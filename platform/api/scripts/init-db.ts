import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const adminUrl = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL
if (!adminUrl) {
  console.error("DATABASE_ADMIN_URL or DATABASE_URL required")
  process.exit(1)
}

function sslOpts() {
  const caCandidates = [
    join(process.cwd(), "certs/do-ca.crt"),
    join(process.cwd(), "../../lib/do-ca.crt"),
  ]
  const caPath = caCandidates.find((p) => existsSync(p))
  const ca = caPath ? readFileSync(caPath, "utf8") : undefined
  return { ca, rejectUnauthorized: false }
}

function normalize(url: string) {
  const u = new URL(url)
  u.searchParams.delete("sslmode")
  u.searchParams.set("uselibpqcompat", "true")
  u.searchParams.set("sslmode", "require")
  return u.toString()
}

async function main() {
  // Connect to defaultdb to create platform DB if needed
  const admin = new URL(adminUrl)
  const targetDb = process.env.PLATFORM_DB_NAME || "platform"
  const originalPath = admin.pathname
  admin.pathname = "/defaultdb"

  const bootstrap = new Client({ connectionString: normalize(admin.toString()), ssl: sslOpts() })
  await bootstrap.connect()

  const exists = await bootstrap.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb])
  if (exists.rowCount === 0) {
    await bootstrap.query(`CREATE DATABASE ${targetDb}`)
    console.log(`Created database ${targetDb}`)
  } else {
    console.log(`Database ${targetDb} already exists`)
  }

  const appUser = process.env.DATABASE_APP_USER || "wps_canvas_app"
  await bootstrap.query(`GRANT CONNECT ON DATABASE ${targetDb} TO ${appUser}`).catch(() => undefined)
  await bootstrap.end()

  admin.pathname = `/${targetDb}`
  const client = new Client({ connectionString: normalize(admin.toString()), ssl: sslOpts() })
  await client.connect()

  const schemaPath = join(__dirname, "../src/db/schema.sql")
  const schema = readFileSync(schemaPath, "utf8")
  await client.query(schema)

  await client.query(`GRANT USAGE ON SCHEMA public TO ${appUser}`)
  await client.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appUser}`
  )
  await client.query(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser}`
  )
  await client.query(`
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser}
  `)

  console.log("Platform schema applied.")
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
