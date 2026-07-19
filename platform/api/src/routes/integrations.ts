import { Router } from "express"
import { z } from "zod"
import { getPool } from "../lib/db.js"
import { emitEvent } from "../lib/webhooks.js"

export const integrationsRouter = Router()

integrationsRouter.get("/sites/:slug", async (req, res) => {
  const pool = getPool()
  const { rows: sites } = await pool.query(`SELECT id FROM sites WHERE slug = $1`, [
    req.params.slug.toLowerCase(),
  ])
  if (!sites[0]) {
    res.status(404).json({ error: "Site not found" })
    return
  }
  const { rows } = await pool.query(
    `SELECT id, provider, config, enabled, created_at, updated_at
     FROM site_integrations WHERE site_id = $1`,
    [sites[0].id]
  )
  res.json({ integrations: rows })
})

integrationsRouter.put("/sites/:slug/:provider", async (req, res) => {
  try {
    const body = z
      .object({
        config: z.record(z.unknown()).default({}),
        enabled: z.boolean().default(true),
      })
      .parse(req.body)

    const pool = getPool()
    const slug = req.params.slug.toLowerCase()
    const provider = req.params.provider.toLowerCase()

    const { rows: sites } = await pool.query(
      `SELECT id, tenant_id FROM sites WHERE slug = $1`,
      [slug]
    )
    if (!sites[0]) {
      res.status(404).json({ error: "Site not found" })
      return
    }

    const { rows } = await pool.query(
      `INSERT INTO site_integrations (site_id, provider, config, enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (site_id, provider) DO UPDATE SET
         config = EXCLUDED.config,
         enabled = EXCLUDED.enabled,
         updated_at = NOW()
       RETURNING id, provider, config, enabled, updated_at`,
      [sites[0].id, provider, JSON.stringify(body.config), body.enabled]
    )

    await emitEvent(
      "integration.updated",
      { siteId: sites[0].id, slug, provider, enabled: body.enabled },
      { siteId: sites[0].id, tenantId: sites[0].tenant_id ?? undefined }
    )

    res.json({ integration: rows[0] })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" })
  }
})

integrationsRouter.delete("/sites/:slug/:provider", async (req, res) => {
  const pool = getPool()
  const { rows: sites } = await pool.query(`SELECT id FROM sites WHERE slug = $1`, [
    req.params.slug.toLowerCase(),
  ])
  if (!sites[0]) {
    res.status(404).json({ error: "Site not found" })
    return
  }
  await pool.query(`DELETE FROM site_integrations WHERE site_id = $1 AND provider = $2`, [
    sites[0].id,
    req.params.provider.toLowerCase(),
  ])
  res.json({ ok: true })
})
