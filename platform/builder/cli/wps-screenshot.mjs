#!/usr/bin/env node
/**
 * Take a screenshot of a webpage via Firecrawl scrape API.
 * Usage: wps-screenshot <url> [--full-page]
 */
const args = process.argv.slice(2).filter(a => !a.startsWith("--") || a === "--full-page")
const url = args[0]
const key = process.env.FIRECRAWL_API_KEY
const fullPage = process.argv.includes("--full-page")

if (!url) {
  console.error("Usage: wps-screenshot <url> [--full-page]")
  process.exit(1)
}
if (!key) {
  console.error("FIRECRAWL_API_KEY is not set")
  process.exit(1)
}

console.error(`Taking screenshot of ${url}...`)

const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url,
    formats: ["screenshot"],
    screenshotOptions: { fullPage },
  }),
})

const data = await res.json()
if (!res.ok) {
  console.error(JSON.stringify(data, null, 2))
  process.exit(1)
}

const screenshot = data?.data?.screenshot
if (screenshot) {
  console.log(`Screenshot captured (${screenshot.length} chars base64).`)
  console.log(`URL: ${url}`)
} else {
  console.error("No screenshot returned")
  process.exit(1)
}
