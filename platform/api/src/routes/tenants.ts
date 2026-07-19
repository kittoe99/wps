import { Router } from "express"
import { z } from "zod"
import { getPool } from "../lib/db.js"

export const tenantsRouter = Router()

tenantsRouter.post("/", async (req, res) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email().optional(),
      })
      .parse(req.body)

    const pool = getPool()
    const { rows } = await pool.query(
      `INSERT INTO tenants (name, email) VALUES ($1, $2)
       RETURNING id, name, email, created_at`,
      [body.name, body.email ?? null]
    )
    res.status(201).json({ tenant: rows[0] })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" })
  }
})

tenantsRouter.get("/:id", async (req, res) => {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, name, email, created_at FROM tenants WHERE id = $1`,
    [req.params.id]
  )
  if (!rows[0]) {
    res.status(404).json({ error: "Not found" })
    return
  }
  res.json({ tenant: rows[0] })
})
