import { Router } from "express"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { getPool } from "../lib/db.js"

export const webhooksRouter = Router()

webhooksRouter.get("/", async (req, res) => {
  const tenantId = typeof req.query.tenantId === "string" ? req.query.tenantId : null
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, tenant_id, url, events, active, created_at
     FROM webhook_endpoints
     WHERE ($1::uuid IS NULL OR tenant_id = $1)
     ORDER BY created_at DESC`,
    [tenantId]
  )
  res.json({ endpoints: rows })
})

webhooksRouter.post("/", async (req, res) => {
  try {
    const body = z
      .object({
        url: z.string().url(),
        tenantId: z.string().uuid().optional(),
        events: z
          .array(z.string())
          .default(["site.published", "site.suspended", "site.created"]),
      })
      .parse(req.body)

    const secret = randomBytes(24).toString("hex")
    const pool = getPool()
    const { rows } = await pool.query(
      `INSERT INTO webhook_endpoints (tenant_id, url, secret, events)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id, url, events, active, created_at`,
      [body.tenantId ?? null, body.url, secret, body.events]
    )

    res.status(201).json({ endpoint: rows[0], secret })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" })
  }
})

webhooksRouter.get("/:id/deliveries", async (req, res) => {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, event_type, status_code, success, attempts, last_error, created_at, delivered_at
     FROM webhook_deliveries
     WHERE endpoint_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [req.params.id]
  )
  res.json({ deliveries: rows })
})

webhooksRouter.delete("/:id", async (req, res) => {
  const pool = getPool()
  await pool.query(`UPDATE webhook_endpoints SET active = FALSE WHERE id = $1`, [
    req.params.id,
  ])
  res.json({ ok: true })
})
