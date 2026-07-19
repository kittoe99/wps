import { createHmac } from "node:crypto"
import { getPool } from "./db.js"

export type PlatformEvent =
  | "site.created"
  | "site.published"
  | "site.suspended"
  | "site.updated"
  | "integration.updated"

export async function emitEvent(
  eventType: PlatformEvent,
  payload: Record<string, unknown>,
  opts?: { siteId?: string; tenantId?: string; version?: number }
) {
  const pool = getPool()

  if (opts?.siteId) {
    await pool.query(
      `INSERT INTO publish_events (site_id, version, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [opts.siteId, opts.version ?? null, eventType, JSON.stringify(payload)]
    )
  }

  const endpoints = await pool.query<{
    id: string
    url: string
    secret: string
    events: string[]
  }>(
    `SELECT id, url, secret, events FROM webhook_endpoints
     WHERE active = TRUE
       AND ($1::uuid IS NULL OR tenant_id IS NULL OR tenant_id = $1)
       AND $2 = ANY(events)`,
    [opts?.tenantId ?? null, eventType]
  )

  const body = {
    id: crypto.randomUUID(),
    type: eventType,
    createdAt: new Date().toISOString(),
    data: payload,
  }

  await Promise.allSettled(
    endpoints.rows.map(async (ep) => {
      const raw = JSON.stringify(body)
      const signature = createHmac("sha256", ep.secret).update(raw).digest("hex")
      let statusCode: number | null = null
      let success = false
      let lastError: string | null = null

      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WPS-Event": eventType,
            "X-WPS-Signature": signature,
          },
          body: raw,
          signal: AbortSignal.timeout(10_000),
        })
        statusCode = res.status
        success = res.ok
        if (!res.ok) lastError = await res.text().catch(() => `HTTP ${res.status}`)
      } catch (err) {
        lastError = err instanceof Error ? err.message : "delivery failed"
      }

      await pool.query(
        `INSERT INTO webhook_deliveries
           (endpoint_id, event_type, payload, status_code, success, attempts, last_error, delivered_at)
         VALUES ($1, $2, $3, $4, $5, 1, $6, CASE WHEN $5 THEN NOW() ELSE NULL END)`,
        [ep.id, eventType, raw, statusCode, success, lastError]
      )
    })
  )
}
