import { NextRequest } from "next/server"
import {
  DEEPSEEK_BASE_URL,
  BUILDER_SYSTEM_PROMPT,
  buildMessages,
  extractHtml,
  stripNonHtml,
  type ChatMessage,
} from "@/lib/deepseek"
import { getSessionUser } from "@/lib/auth"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const maxDuration = 120
const WORKSPACE = process.env.SANDBOX_WORKSPACE || join(process.cwd(), ".sandbox")

function sanitizeSiteSlug(raw: unknown): string {
  const slug = typeof raw === "string" ? raw.trim() : ""
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(slug)) return "default"
  return slug.toLowerCase()
}

async function saveSite(userId: string, siteSlug: string, html: string) {
  const dir = join(WORKSPACE, userId, siteSlug)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, "index.html"), html, "utf-8")
  const metaPath = join(dir, "meta.json")
  if (existsSync(metaPath)) {
    const meta = JSON.parse(await readFile(metaPath, "utf-8"))
    meta.updatedAt = new Date().toISOString()
    await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8")
  }
}

function openClawConfigured(): { base: string; token: string } | null {
  const base = (process.env.OPENCLAW_URL || "").replace(/\/$/, "")
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || ""
  if (!base || !token) return null
  return { base, token }
}

function openClawHeaders(token: string, sessionKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-openclaw-session-key": sessionKey,
  }
}

async function streamViaOpenClaw(
  { base, token }: { base: string; token: string },
  user: { id: string },
  body: { message: string; siteSlug: string; history?: ChatMessage[] }
) {
  const sessionKey = `gen:${user.id}:${body.siteSlug}`
  const messages = buildMessages(body.message, body.history || [])
  // Keep the model constrained to HTML generation even on the OpenClaw path.
  const constrained = [
    {
      role: "system" as const,
      content:
        BUILDER_SYSTEM_PROMPT +
        "\n\nDo not use tools, shell, or publish CLIs. Reply only with the HTML website code block.",
    },
    ...messages.filter((m) => m.role !== "system"),
  ]

  const payload = {
    model: process.env.OPENCLAW_MODEL || "openclaw/default",
    user: sessionKey,
    messages: constrained,
  }

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: openClawHeaders(token, sessionKey),
    body: JSON.stringify({ ...payload, stream: true }),
  })

  if (res.status === 400 || res.status === 404 || res.status === 501) {
    const nonStream = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: openClawHeaders(token, sessionKey),
      body: JSON.stringify({ ...payload, stream: false }),
    })
    if (!nonStream.ok) return null
    const data = (await nonStream.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = data.choices?.[0]?.message?.content ?? ""
    return { text }
  }

  if (!res.ok || !res.body) return null

  return { stream: res.body }
}

async function streamViaDeepSeek(
  apiKey: string,
  body: { model?: string; message: string; history?: ChatMessage[] }
) {
  const { model = "deepseek-v4-pro", message, history = [] } = body
  const messages = buildMessages(message, history as ChatMessage[])

  const aiRes = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.text()
    throw new Error(`AI API error ${aiRes.status}: ${err}`)
  }

  return aiRes.body
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const message = typeof body.message === "string" ? body.message.trim() : ""
  const siteSlug = sanitizeSiteSlug(body.siteSlug)
  if (!message) return Response.json({ error: "Message required" }, { status: 400 })
  if (message.length > 12000) {
    return Response.json({ error: "Message is too long" }, { status: 400 })
  }

  const requestBody = { ...body, message, siteSlug }

  // Try OpenClaw agent first — no extra API key needed
  const openclaw = openClawConfigured()
  if (openclaw) {
    try {
      const result = await streamViaOpenClaw(openclaw, user, requestBody)
      if (result) {
        if ("text" in result) {
          const text = result.text || ""
          const html = extractHtml(text)
          const clean = html
            ? stripNonHtml(html)
            : text.length > 100
              ? stripNonHtml(text)
              : null
          if (clean) await saveSite(user.id, siteSlug, clean)
          return Response.json({ html: clean, extracted: !!html })
        }

        // Stream mode — pass through SSE
        const reader = result.stream.getReader()
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        let fullContent = ""
        let buffer = ""

        const stream = new ReadableStream({
          async start(controller) {
            let disconnected = false
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                try {
                  if (!disconnected) controller.enqueue(value)
                } catch { disconnected = true }

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() || ""
                for (const line of lines) {
                  const d = line.trim()
                  if (!d.startsWith("data: ")) continue
                  const payload = d.slice(6).trim()
                  if (payload === "[DONE]") continue
                  try {
                    const chunk = JSON.parse(payload)
                    const delta = chunk.choices?.[0]?.delta?.content
                    if (delta) fullContent += delta
                  } catch {}
                }
              }
            } catch {}

            if (!disconnected) {
              const html = extractHtml(fullContent)
              const clean = html ? stripNonHtml(html) : (fullContent.length > 100 ? stripNonHtml(fullContent) : null)
              if (clean) await saveSite(user.id, siteSlug, clean)
              controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ html: clean, extracted: !!html })}\n\n`))
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        })
      }
    } catch { /* OpenClaw failed, fall through to DeepSeek */ }
  }

  // Fallback: direct DeepSeek API
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return Response.json({ error: "No API key configured" }, { status: 500 })

  try {
    const aiBody = await streamViaDeepSeek(apiKey, requestBody)
    if (!aiBody) return Response.json({ error: "No response from AI" }, { status: 500 })

    const reader = aiBody.getReader()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullContent = ""
    let sseBuffer = ""

    const stream = new ReadableStream({
      async start(controller) {
        let disconnected = false
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              const html = extractHtml(fullContent)
              const clean = html ? stripNonHtml(html) : (fullContent.length > 100 ? stripNonHtml(fullContent) : null)
              if (clean) await saveSite(user.id, siteSlug, clean)
              if (!disconnected) {
                controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ html: clean, extracted: !!html })}\n\n`))
                controller.close()
              }
              break
            }

            try {
              if (!disconnected) controller.enqueue(value)
            } catch { disconnected = true }

            sseBuffer += decoder.decode(value, { stream: true })
            const lines = sseBuffer.split("\n")
            sseBuffer = lines.pop() || ""
            for (const line of lines) {
              const d = line.trim()
              if (!d.startsWith("data: ")) continue
              try {
                const chunk = JSON.parse(d.slice(6))
                const delta = chunk.choices?.[0]?.delta?.content
                if (delta) fullContent += delta
              } catch {}
            }
          }
        } catch {
          if (!disconnected) controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 })
  }
}
