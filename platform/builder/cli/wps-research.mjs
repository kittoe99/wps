#!/usr/bin/env node
/**
 * Research a URL via Firecrawl scrape API.
 * Usage: wps-research <url>
 */
const url = process.argv[2]
const key = process.env.FIRECRAWL_API_KEY
if (!url) {
  console.error("Usage: wps-research <url>")
  process.exit(1)
}
if (!key) {
  console.error("FIRECRAWL_API_KEY is not set")
  process.exit(1)
}

const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url,
    formats: ["markdown"],
    onlyMainContent: true,
  }),
})

const data = await res.json()
if (!res.ok) {
  console.error(JSON.stringify(data, null, 2))
  process.exit(1)
}

const md = data?.data?.markdown || data?.markdown || ""
process.stdout.write(md)
