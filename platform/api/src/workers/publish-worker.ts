import { activateVersion } from "./publish.js"
import { getValkey } from "../lib/valkey.js"

/**
 * Long-running worker: listens for publish jobs on Valkey list `publish:jobs`
 * Payload: JSON { siteId, version }
 */
async function main() {
  const redis = getValkey()
  console.log("Publish worker listening on publish:jobs...")

  for (;;) {
    const result = await redis.blpop("publish:jobs", 0)
    if (!result) continue
    const [, raw] = result
    try {
      const job = JSON.parse(raw) as { siteId: string; version: number }
      console.log("Activating", job)
      const out = await activateVersion(job)
      console.log("Activated", out)
    } catch (err) {
      console.error("Publish job failed:", err)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
