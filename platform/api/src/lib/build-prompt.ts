import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type BuildBrief = {
  businessName: string
  industry: string
  tone?: string
  researchUrls?: string[]
}

export function renderBuildPrompt(input: {
  slug: string
  version: number
  brief: BuildBrief
  publicUrl?: string
}): string {
  const templatePath = join(
    __dirname,
    "../../../../builder/prompts/build-site.md"
  )
  let template: string
  try {
    template = readFileSync(templatePath, "utf8")
  } catch {
    // Fallback when running from dist/ without builder tree mounted
    template = `STRICT stack: HTML + Tailwind (cdn.tailwindcss.com) + vanilla JS only. No React/npm/package.json.
Build a static site for {{BUSINESS_NAME}} ({{INDUSTRY}}) in /workspace/sites/{{SLUG}}, then run:
wps-publish --slug {{SLUG}} --version {{VERSION}} --dir /workspace/sites/{{SLUG}}
Public URL: {{PUBLIC_URL}}
Tone: {{TONE}}
Research: {{RESEARCH_URLS}}
Confirm HTML+Tailwind+JS in your summary.`
  }

  const domain = process.env.PUBLIC_SITE_DOMAIN || "wpscanvas.com"
  const publicUrl =
    input.publicUrl || `https://${input.slug}.${domain}`

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
    .replaceAll("{{PUBLIC_URL}}", publicUrl)
}
