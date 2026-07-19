import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { Pool } from "pg"

const globalForDb = globalThis as unknown as { platformPool?: Pool }

function getCa() {
  const caPath = join(process.cwd(), "../../lib/do-ca.crt")
  const localCa = join(process.cwd(), "certs/do-ca.crt")
  if (existsSync(localCa)) return readFileSync(localCa, "utf8")
  if (existsSync(caPath)) return readFileSync(caPath, "utf8")
  return undefined
}

export function getPool() {
  if (!globalForDb.platformPool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error("DATABASE_URL is not set")

    const url = new URL(connectionString)
    url.searchParams.delete("sslmode")
    url.searchParams.set("uselibpqcompat", "true")
    url.searchParams.set("sslmode", "require")

    const ca = getCa()
    globalForDb.platformPool = new Pool({
      connectionString: url.toString(),
      ssl: ca ? { ca, rejectUnauthorized: false } : { rejectUnauthorized: false },
      max: 10,
    })
  }
  return globalForDb.platformPool
}
