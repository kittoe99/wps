import { NextRequest } from "next/server"
import { DEEPSEEK_BASE_URL, buildMessages, extractHtml, stripNonHtml, type ChatMessage } from "@/lib/deepseek"
import { getSessionUser } from "@/lib/auth"
import { writeFile, mkdir, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const maxDuration = 120
const WORKSPACE = process.env.SANDBOX_WORKSPACE || join(process.cwd(), ".sandbox")

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

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const { model = "deepseek-v4-pro", message, siteSlug = "default", history = [] } = body
  if (!message) return Response.json({ error: "Message required" }, { status: 400 })

  const messages = buildMessages(message, history as ChatMessage[])

  try {
    const aiRes = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      return Response.json({ error: `API error ${aiRes.status}: ${err}` }, { status: 500 })
    }

    // Pass-through SSE with HTML extraction at end
    const reader = aiRes.body?.getReader()
    if (!reader) return Response.json({ error: "No stream" }, { status: 500 })

    const encoder = new TextEncoder()
    let fullContent = ""

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        let buffer = ""
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

            // Pass chunk to client unless they disconnected
            try {
              if (!disconnected) controller.enqueue(value)
            } catch {
              disconnected = true
            }

            // Accumulate for extraction
            const text = decoder.decode(value, { stream: true })
            buffer += text
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""
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
