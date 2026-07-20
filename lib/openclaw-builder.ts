import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sitePublicUrl, type SiteBuild } from "@/lib/sites"

export function renderBuildPrompt(input: {
  slug: string
  version: number
  brief: SiteBuild["brief"]
}) {
  const templatePath = join(
    process.cwd(),
    "platform/builder/prompts/build-site.md"
  )
  let template: string
  try {
    template = readFileSync(templatePath, "utf8")
  } catch {
    template = `You are the WPS Canvas website builder.
STRICT stack: HTML + Tailwind CSS (cdn.tailwindcss.com) + vanilla JS only.
No React/Next/Vue, no npm, no package.json, no custom CSS framework.
Build under /workspace/sites/{{SLUG}} for {{BUSINESS_NAME}} ({{INDUSTRY}}).
Tone: {{TONE}}
Slug: {{SLUG}} Version: {{VERSION}}
Public URL: {{PUBLIC_URL}}
Research: {{RESEARCH_URLS}}
Deliver index.html with Tailwind utility classes; optional main.js.
When ready run: wps-publish --slug {{SLUG}} --version {{VERSION}} --dir /workspace/sites/{{SLUG}}
Reply with a short summary confirming HTML+Tailwind+JS and the public URL.`
  }

  return template
    .replaceAll("{{SLUG}}", input.slug)
    .replaceAll("{{VERSION}}", String(input.version))
    .replaceAll("{{BUSINESS_NAME}}", input.brief.businessName)
    .replaceAll("{{INDUSTRY}}", input.brief.industry)
    .replaceAll("{{TONE}}", input.brief.tone || "clear and professional")
    .replaceAll(
      "{{RESEARCH_URLS}}",
      (input.brief.researchUrls || []).join(", ") || "(none)"
    )
    .replaceAll("{{PUBLIC_URL}}", sitePublicUrl(input.slug))
}

function openClawHeaders(token: string, sessionId: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-openclaw-session-key": sessionId,
  }
}

async function openClawChat(input: {
  base: string
  token: string
  sessionId: string
  message: string
  signal: AbortSignal
}) {
  const res = await fetch(`${input.base}/v1/chat/completions`, {
    method: "POST",
    signal: input.signal,
    headers: openClawHeaders(input.token, input.sessionId),
    body: JSON.stringify({
      model: process.env.OPENCLAW_MODEL || "openclaw/default",
      user: `conv:${input.sessionId}`,
      messages: [{ role: "user", content: input.message }],
      stream: false,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`OpenClaw error (${res.status}): ${text.slice(0, 500)}`)
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() || ""
}

/** Strip markdown fences / chatter so we keep raw HTML for iframe preview. */
export function extractPreviewHtml(raw: string): string | null {
  if (!raw) return null
  let text = raw.trim()
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) text = fenced[1].trim()
  const doc = text.match(/(<!DOCTYPE[\s\S]*<\/html>)/i) || text.match(/(<html[\s\S]*<\/html>)/i)
  if (doc?.[1]) return doc[1].trim()
  if (text.includes("<body") || text.includes("<div")) return text
  return null
}

export async function runOpenClawBuild(input: {
  sessionId: string
  slug: string
  version: number
  brief: SiteBuild["brief"]
}): Promise<{
  ok: boolean
  reply?: string
  previewHtml?: string | null
  error?: string
}> {
  const base = (process.env.OPENCLAW_URL || "").replace(/\/$/, "")
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || ""
  if (!base || !token) {
    return {
      ok: false,
      error: "OPENCLAW_URL and OPENCLAW_GATEWAY_TOKEN must be set",
    }
  }

  const prompt = renderBuildPrompt({
    slug: input.slug,
    version: input.version,
    brief: input.brief,
  })

  const controller = new AbortController()
  const timeoutMs = Number(process.env.BUILD_TIMEOUT_MS || 12 * 60 * 1000)
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const reply = await openClawChat({
      base,
      token,
      sessionId: input.sessionId,
      message: prompt,
      signal: controller.signal,
    })

    let previewHtml: string | null = null
    try {
      const rawHtml = await openClawChat({
        base,
        token,
        sessionId: input.sessionId,
        message: `For the site preview, run: cat /workspace/sites/${input.slug}/index.html
Reply with ONLY the raw file contents. No markdown fences, no commentary.`,
        signal: controller.signal,
      })
      previewHtml = extractPreviewHtml(rawHtml)
    } catch (previewErr) {
      console.warn("preview html capture failed:", previewErr)
    }

    return {
      ok: true,
      reply: reply || "Build finished.",
      previewHtml,
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Build timed out after ${timeoutMs}ms`
          : err.message
        : String(err)
    return { ok: false, error: message }
  } finally {
    clearTimeout(timer)
  }
}
