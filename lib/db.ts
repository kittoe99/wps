import { Pool } from "pg"
import { getDbSsl } from "@/lib/db-ssl"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString)
  url.searchParams.delete("sslmode")
  url.searchParams.set("uselibpqcompat", "true")
  url.searchParams.set("sslmode", "require")
  return url.toString()
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  return new Pool({
    connectionString: normalizeConnectionString(connectionString),
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
