import { processBuildJob, type BuildJob } from "./build.js"
import { getValkey } from "../lib/valkey.js"

/**
 * Long-running worker: listens for AI site builds on Valkey list `build:jobs`
 */
async function main() {
  const redis = getValkey()
  console.log("Build worker listening on build:jobs...")

  for (;;) {
    const result = await redis.blpop("build:jobs", 0)
    if (!result) continue
    const [, raw] = result
    try {
      const job = JSON.parse(raw) as BuildJob
      console.log("Building", job.buildId, job.slug, job.sessionId)
      await processBuildJob(job)
      console.log("Build complete", job.buildId)
    } catch (err) {
      console.error("Build job failed:", err)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
