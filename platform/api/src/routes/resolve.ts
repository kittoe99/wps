import { Router } from "express"
import { getLiveSite } from "../lib/valkey.js"
import { getPool } from "../lib/db.js"
import { reservedSlugs } from "../lib/slugs.js"

export const resolveRouter = Router()

/**
 * Fast path for edge/NGINX auth_request or OpenResty:
 * GET /resolve/:slug → 200 + JSON if live, 404 otherwise
 */
resolveRouter.get("/:slug", async (req, res) => {
  const slug = req.params.slug.toLowerCase()

  if (reservedSlugs().has(slug)) {
    res.status(404).json({ error: "reserved" })
    return
  }

  let entry = await getLiveSite(slug).catch(() => null)

  if (!entry) {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT id, slug, status, current_version FROM sites WHERE slug = $1`,
      [slug]
    )
    if (!rows[0] || rows[0].status !== "live" || !rows[0].current_version) {
      res.status(404).json({ error: "not found" })
      return
    }
    entry = {
      siteId: rows[0].id,
      slug: rows[0].slug,
      status: rows[0].status,
      version: rows[0].current_version,
      storagePrefix: `sites/${rows[0].id}/v${rows[0].current_version}/`,
    }
  }

  if (entry.status !== "live") {
    res.status(410).json({ error: "suspended" })
    return
  }

  res.json({
    siteId: entry.siteId,
    slug: entry.slug,
    version: entry.version,
    root: `/var/www/sites/${entry.slug}/current`,
    storagePrefix: entry.storagePrefix,
  })
})
