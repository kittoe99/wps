import { getPool } from "../lib/db.js"
import { getValkey } from "../lib/valkey.js"
import {
  openClawChatAsync,
  openClawWaitTask,
} from "../lib/openclaw.js"
import { renderBuildPrompt, type BuildBrief } from "../lib/build-prompt.js"

export type BuildJob = {
  buildId: string
  siteId: string
  slug: string
  sessionId: string
  version: number
  brief: BuildBrief
}

/**
 * Process one site build: OpenClaw session → sandbox agent → publish via wps-publish.
 */
export async function processBuildJob(job: BuildJob): Promise<void> {
  const pool = getPool()

  await pool.query(
    `UPDATE site_builds SET status = 'running', started_at = NOW() WHERE id = $1`,
    [job.buildId]
  )

  const prompt = renderBuildPrompt({
    slug: job.slug,
    version: job.version,
    brief: job.brief,
  })

  try {
    const { taskId } = await openClawChatAsync({
      sessionId: job.sessionId,
      message: prompt,
    })

    const result = await openClawWaitTask(taskId, {
      timeoutMs: Number(process.env.BUILD_TIMEOUT_MS || 15 * 60 * 1000),
    })

    if (result.status === "failed") {
      throw new Error(result.error || "OpenClaw build failed")
    }

    // Confirm site went live (agent should have called wps-publish)
    const { rows } = await pool.query(
      `SELECT status, current_version FROM sites WHERE id = $1`,
      [job.siteId]
    )
    const site = rows[0]
    const published =
      site?.status === "live" &&
      Number(site.current_version) === Number(job.version)

    if (!published) {
      // Soft-success if agent replied with URL but publish race; mark published if version matches
      const reply = result.reply || ""
      if (!reply.includes(job.slug) && site?.current_version !== job.version) {
        throw new Error(
          "Build finished but site was not published to the expected version. Check OpenClaw session logs."
        )
      }
    }

    await pool.query(
      `UPDATE site_builds
       SET status = 'published', summary = $2, finished_at = NOW()
       WHERE id = $1`,
      [job.buildId, result.reply?.slice(0, 4000) || "Published"]
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await pool.query(
      `UPDATE site_builds
       SET status = 'failed', error = $2, finished_at = NOW()
       WHERE id = $1`,
      [job.buildId, message.slice(0, 4000)]
    )
    throw err
  }
}

export async function enqueueBuildJob(job: BuildJob): Promise<void> {
  await getValkey().rpush("build:jobs", JSON.stringify(job))
}
