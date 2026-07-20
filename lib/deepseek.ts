export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

export const DEEPSEEK_MODELS = {
  "deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    description: "Most capable model for complex tasks",
  },
  "deepseek-v4-flash": {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    description: "Fast responses for simpler tasks",
  },
} as const

export type DeepSeekModelKey = keyof typeof DEEPSEEK_MODELS

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `You are an expert AI website builder that generates complete, production-ready multi-page websites in a single HTML file.

CRITICAL RULES:
1. ALWAYS output the full HTML document wrapped in \`\`\`html code blocks — start your response directly with the code block, no introductory text before it
2. Build the ENTIRE website in ONE HTML file — every page as a <section> with a unique id
3. Include ALL CSS inline in a <style> tag and ALL JS in a single <script> tag at the end
4. Use Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
5. Full document structure: <!DOCTYPE html>, <html>, <head>, <body>

MULTI-PAGE STRUCTURE:
1. Create a <nav> with links to all pages using href="#page-name"
2. Each page is a <section id="page-name" class="page-section">
3. Use JavaScript at the bottom to show/hide pages based on hash:
   - On load, check window.location.hash — show that page, hide others
   - On hashchange, switch visible page
   - Listen for nav clicks and update hash
   - Default to "#home" if no hash
4. Mark ALL nav links with class="nav-link" and highlight the active one
5. Include at minimum 3-5 pages: Home, About, Services/Products, Contact
6. Contact page must include a working form with fields (not just placeholders)

NAVIGATION REQUIREMENTS:
- Use <a href="#page-name" class="nav-link"> for all nav items
- Active nav link gets a distinct style (underline, color change, etc.)
- Mobile: hamburger menu that toggles nav visibility
- Footer on every page with quick links using the same hash navigation

DESIGN QUALITY:
- Hero section on home page with headline, subtext, CTA button
- Real content: actual business names, service descriptions, testimonials, etc.
- Modern design: generous spacing, rounded corners, shadows, gradients
- Responsive: works on mobile, tablet, desktop
- Color scheme: cohesive palette with primary and accent colors
- Loading states, hover effects, smooth transitions

TECHNICAL REQUIREMENTS:
- Complete, working code — never use "..." or placeholders
- All images use placeholder URLs like https://placehold.co/600x400 or SVG icons
- Form submissions show a success message via JavaScript (no server needed)
- Include meta tags for SEO (title, description, viewport)
- Minimum 300 lines of HTML — be thorough

After the code block, list all pages you created and offer to refine any section.`

export function buildMessages(
  userMessage: string,
  history: ChatMessage[] = []
): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage },
  ]
}

// Cut anything after </html> (trailing fences, prose) and drop a dangling fence
function cleanupHtml(html: string): string {
  let out = html
  const end = out.search(/<\/html>/i)
  if (end !== -1) out = out.slice(0, end + "</html>".length)
  return out.replace(/```\s*$/, "").trim()
}

function looksLikeHtml(s: string): boolean {
  return /<!DOCTYPE\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(s)
}

export function extractHtml(response: string): string | null {
  // Method 1: ```html ... ``` blocks
  const htmlMatch = response.match(/```html\s*\n?([\s\S]*?)\n?```/)
  if (htmlMatch?.[1] && htmlMatch[1].trim().length > 100) return cleanupHtml(htmlMatch[1])

  // Method 2: Any ``` code block that looks like HTML
  const blocks = response.match(/```\s*\n?([\s\S]*?)```/g)
  if (blocks) {
    for (const block of blocks) {
      const content = block.replace(/```\s*\n?/, "").replace(/\n?```$/, "").trim()
      if ((content.includes("<!DOCTYPE") || content.includes("<html")) && content.length > 100) {
        return cleanupHtml(content)
      }
    }
  }

  // Method 3: Unclosed ```html fence (response truncated mid-block)
  const openFence = response.match(/```html\s*\n?([\s\S]*)$/)
  if (openFence?.[1] && openFence[1].trim().length > 100 && looksLikeHtml(openFence[1])) {
    return cleanupHtml(openFence[1])
  }

  // Method 4: Direct DOCTYPE match (closed or truncated)
  const docStart = response.search(/<!DOCTYPE\s+html/i)
  if (docStart !== -1 && response.length - docStart > 100) {
    return cleanupHtml(response.slice(docStart))
  }

  // Method 5: Find <html> without DOCTYPE (closed or truncated)
  const htmlStart = response.search(/<html[\s>]/i)
  if (htmlStart !== -1 && response.length - htmlStart > 100) {
    return "<!DOCTYPE html>\n" + cleanupHtml(response.slice(htmlStart))
  }

  return null
}

export function stripNonHtml(response: string): string {
  const lt = response.indexOf("<")
  if (lt === -1) return response
  return cleanupHtml(response.substring(lt))
}
