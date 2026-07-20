#!/usr/bin/env node
/**
 * Crawl a website via Firecrawl crawl API.
 * Usage: wps-crawl <url> [--max-pages N] [--depth N] [--markdown]
 */
const args = process.argv.slice(2).filter(a => !a.startsWith("--") || a === "--markdown")
const url = args[0]
const key = process.env.FIRECRAWL_API_KEY
const maxPages = process.argv.includes("--max-pages")
  ? Number(process.argv[process.argv.indexOf("--max-pages") + 1])
  : 10
const maxDepth = process.argv.includes("--depth")
  ? Number(process.argv[process.argv.indexOf("--depth") + 1])
  : 2
const markdown = process.argv.includes("--markdown")

if (!url) {
  console.error("Usage: wps-crawl <url> [--max-pages N] [--depth N] [--markdown]")
  process.exit(1)
}
if (!key) {
  console.error("FIRECRAWL_API_KEY is not set")
  process.exit(1)
}

console.error(`Crawling ${url} (max ${maxPages} pages, depth ${maxDepth})...`)

const res = await fetch("https://api.firecrawl.dev/v1/crawl", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url,
    limit: maxPages,
    maxDiscoveryDepth: maxDepth,
    scrapeOptions: markdown ? { formats: ["markdown"], onlyMainContent: true } : undefined,
  }),
})

const { id } = await res.json()
if (!res.ok || !id) {
  const data = await res.json().catch(() => ({}))
  console.error("Crawl start failed:", JSON.stringify(data, null, 2))
  process.exit(1)
}

let attempts = 0
while (attempts < 60) {
  await new Promise(r => setTimeout(r, 3000))
  const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const statusData = await statusRes.json()
  const status = statusData?.status || statusData?.data?.status

  if (status === "completed") {
    const pages = statusData?.data || statusData?.pages || []
    console.log(`\n=== Crawl complete: ${url} (${pages.length} pages) ===\n`)

    if (markdown && statusData?.data) {
      for (const page of statusData.data) {
        if (page.markdown) {
          console.log(`\n## ${page.metadata?.title || page.url}`)
          console.log(`URL: ${page.url}`)
          console.log(page.markdown.slice(0, 3000))
          console.log("---")
        }
      }
    } else {
      for (const page of pages) {
        const title = page.title || page.metadata?.title || page.url
        const desc = page.description || page.metadata?.description || ""
        const content = page.markdown || page.content || ""
        console.log(`**${title}**`)
        console.log(`URL: ${page.url}`)
        if (desc) console.log(`${desc}`)
        if (!markdown && content) {
          console.log(content.slice(0, 2000))
        }
        console.log("---")
      }
    }
    process.exit(0)
  }

  if (status === "failed") {
    console.error("Crawl failed:", JSON.stringify(statusData, null, 2))
    process.exit(1)
  }

  attempts++
  console.error(`Crawling... (${status}, attempt ${attempts})`)
}

console.error("Crawl timed out")
process.exit(1)
