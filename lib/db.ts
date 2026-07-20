import { Pool } from "pg"
import { getDbSsl } from "@/lib/db-ssl"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

/**
 * Resolve the DigitalOcean Managed Postgres URL.
 * Prefer DATABASE_URL; fall back to DO_POSTGRES_* (set on Vercel).
 */
export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const host = process.env.DO_POSTGRES_HOST
  const user = process.env.DO_POSTGRES_USER || "wps_canvas_app"
  const password = process.env.DO_POSTGRES_PASSWORD
  const port = process.env.DO_POSTGRES_PORT || "25060"
  const database = process.env.DO_POSTGRES_DB || "defaultdb"

  if (host && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`
  }

  throw new Error(
    "DATABASE_URL (or DO_POSTGRES_HOST + DO_POSTGRES_PASSWORD) is not set — required for DigitalOcean Postgres"
  )
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString)
  url.searchParams.delete("sslmode")
  url.searchParams.set("uselibpqcompat", "true")
  url.searchParams.set("sslmode", "require")
  return url.toString()
}

function createPool() {
  return new Pool({
    connectionString: normalizeConnectionString(resolveDatabaseUrl()),
    ssl: getDbSsl(),
    max: 5,
  })
}

export function getPool() {
  if (!globalForDb.pool) {
    globalForDb.pool = createPool()
  }

  return globalForDb.pool
}

export async function ensureSchema() {
  // Schema is provisioned by scripts/init-db.mjs (admin). The app DB user
  // only has INSERT/SELECT and must not attempt DDL on every request.
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT to_regclass('public.contact_submissions') AS table_name`
  )
  if (!rows[0]?.table_name) {
    throw new Error(
      "contact_submissions table is missing. Run: DATABASE_ADMIN_URL=... npm run db:init"
    )
  }
}
