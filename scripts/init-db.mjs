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

await client.query(`
  CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_app_users_email
  ON app_users (email)
`)

await client.query(`
  CREATE TABLE IF NOT EXISTS user_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT,
    business_name TEXT,
    industry TEXT,
    tone TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'building', 'live', 'failed')),
    current_version INT,
    agent_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

await client.query(`
  ALTER TABLE user_sites
  ADD COLUMN IF NOT EXISTS agent_session_id TEXT
`)

await client.query(`
  ALTER TABLE user_sites
  ADD COLUMN IF NOT EXISTS onboarding_brief JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (onboarding_status IN ('draft', 'ready'))
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_user_sites_user
  ON user_sites (user_id, updated_at DESC)
`)

await client.query(`
  CREATE TABLE IF NOT EXISTS user_site_builds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES user_sites(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued'
      CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    session_id TEXT NOT NULL,
    version INT NOT NULL,
    brief JSONB NOT NULL DEFAULT '{}',
    summary TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
  )
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_user_site_builds_site
  ON user_site_builds (site_id, created_at DESC)
`)

await client.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_site_builds_session
  ON user_site_builds (session_id)
`)

await client.query(`
  ALTER TABLE user_site_builds
  ADD COLUMN IF NOT EXISTS preview_html TEXT
`)

await client.query(`
  CREATE TABLE IF NOT EXISTS site_agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES user_sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    build_id UUID REFERENCES user_site_builds(id) ON DELETE SET NULL,
    meta JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_site_agent_messages_site
  ON site_agent_messages (site_id, created_at ASC)
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_site_agent_messages_user
  ON site_agent_messages (user_id, created_at DESC)
`)

await client.query(`
  CREATE TABLE IF NOT EXISTS site_agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES user_sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued'
      CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    stage TEXT,
    stage_detail TEXT,
    streaming_text TEXT NOT NULL DEFAULT '',
    events JSONB NOT NULL DEFAULT '[]',
    user_message TEXT NOT NULL,
    user_message_id UUID REFERENCES site_agent_messages(id) ON DELETE SET NULL,
    assistant_message_id UUID REFERENCES site_agent_messages(id) ON DELETE SET NULL,
    build_id UUID REFERENCES user_site_builds(id) ON DELETE SET NULL,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_site_agent_runs_site
  ON site_agent_runs (site_id, created_at DESC)
`)

await client.query(`
  CREATE INDEX IF NOT EXISTS idx_site_agent_runs_active
  ON site_agent_runs (site_id, status)
  WHERE status IN ('queued', 'running')
`)

const appUser = process.env.DATABASE_APP_USER || "wps_canvas_app"

await client.query(`GRANT CONNECT ON DATABASE defaultdb TO ${appUser}`)
await client.query(`GRANT USAGE ON SCHEMA public TO ${appUser}`)
await client.query(`GRANT SELECT, INSERT ON contact_submissions TO ${appUser}`)
await client.query(`GRANT SELECT, INSERT, UPDATE ON app_users TO ${appUser}`)
await client.query(
  `GRANT SELECT, INSERT, UPDATE, DELETE ON user_sites TO ${appUser}`
)
await client.query(
  `GRANT SELECT, INSERT, UPDATE, DELETE ON user_site_builds TO ${appUser}`
)
await client.query(
  `GRANT SELECT, INSERT, UPDATE, DELETE ON site_agent_messages TO ${appUser}`
)
await client.query(
  `GRANT SELECT, INSERT, UPDATE, DELETE ON site_agent_runs TO ${appUser}`
)
await client.query(`
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT ON TABLES TO ${appUser}
`)

const count = await client.query("SELECT COUNT(*)::int AS count FROM contact_submissions")
const users = await client.query("SELECT COUNT(*)::int AS count FROM app_users")
const sites = await client.query("SELECT COUNT(*)::int AS count FROM user_sites")
console.log(
  `Schema ready. contact_submissions: ${count.rows[0].count}, app_users: ${users.rows[0].count}, user_sites: ${sites.rows[0].count}`
)

await client.end()
