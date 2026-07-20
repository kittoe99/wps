#!/usr/bin/env node
/**
 * Search the web via Firecrawl search API.
 * Usage: wps-search <query> [--limit N] [--source web|news|images]
 */
const query = process.argv.slice(2).filter(a => !a.startsWith("--")).join(" ")
const key = process.env.FIRECRAWL_API_KEY
const limit = Number(process.argv.includes("--limit")
  ? process.argv[process.argv.indexOf("--limit") + 1]
  : 5)
const source = process.argv.includes("--source")
  ? process.argv[process.argv.indexOf("--source") + 1]
  : "web"

if (!query) {
  console.error("Usage: wps-search <query> [--limit N] [--source web|news|images]")
  process.exit(1)
}
if (!key) {
  console.error("FIRECRAWL_API_KEY is not set")
  process.exit(1)
}

const res = await fetch("https://api.firecrawl.dev/v1/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
    limit,
    sources: [{ type: source }],
  }),
})

const data = await res.json()
if (!res.ok) {
  console.error(JSON.stringify(data, null, 2))
  process.exit(1)
}

const results = data?.data?.[source] || []
if (!results.length) {
  console.log(`No ${source} results found for: ${query}`)
  process.exit(0)
}

console.log(`=== Firecrawl Search: ${query} ===\n`)
for (const item of results) {
  console.log(`**${item.title || "(no title)"}**`)
  console.log(`URL: ${item.url}`)
  if (item.description) console.log(`${item.description}`)
  console.log("---")
}
