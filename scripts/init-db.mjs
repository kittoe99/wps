import pg from "pg"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const { Client } = pg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL is required.")
  process.exit(1)
}

const client = new Client({
  connectionString: (() => {
    const url = new URL(connectionString)
    url.searchParams.delete("sslmode")
    url.searchParams.set("uselibpqcompat", "true")
    url.searchParams.set("sslmode", "require")
    return url.toString()
  })(),
  ssl: {
    ca: readFileSync(join(process.cwd(), "lib", "do-ca.crt"), "utf8"),
    rejectUnauthorized: false,
  },
})

await client.connect()

await client.query(`
  CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'contact',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON contact_submissions (created_at DESC)
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON contact_submissions (email)
`)

const appUser = process.env.DATABASE_APP_USER || "wps_canvas_app"

await client.query(`GRANT CONNECT ON DATABASE defaultdb TO ${appUser}`)
await client.query(`GRANT USAGE ON SCHEMA public TO ${appUser}`)
await client.query(`GRANT SELECT, INSERT ON contact_submissions TO ${appUser}`)
await client.query(`
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT ON TABLES TO ${appUser}
`)

const count = await client.query("SELECT COUNT(*)::int AS count FROM contact_submissions")
console.log(`Schema ready. contact_submissions rows: ${count.rows[0].count}`)

await client.end()
