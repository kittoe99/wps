import { getPool } from "@/lib/db"
import type { AuthUser } from "@/lib/auth"

export type UserSite = {
  id: string
  userId: string
  slug: string
  title: string | null
  businessName: string | null
  industry: string | null
  tone: string | null
  status: "draft" | "building" | "live" | "failed"
  currentVersion: number | null
  agentSessionId: string | null
  publicUrl: string
  createdAt: string
  updatedAt: string
}

export type SiteBuild = {
  id: string
  siteId: string
  status: "queued" | "running" | "completed" | "failed"
  sessionId: string
  version: number
  brief: {
    businessName: string
    industry: string
    tone?: string
    researchUrls?: string[]
  }
  summary: string | null
  previewHtml: string | null
  hasPreview: boolean
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

const RESERVED = new Set([
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
  "status",
  "docs",
  "builder",
  "login",
  "signup",
  "contact",
])

export function publicSiteDomain() {
  return process.env.PUBLIC_SITE_DOMAIN || "wpscanvas.com"
}

export function sitePublicUrl(slug: string) {
  return `https://${slug}.${publicSiteDomain()}`
}

export function normalizeSlug(raw: string) {
  const slug = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  if (slug.length < 2 || slug.length > 48) {
    throw new Error("Slug must be 2–48 characters")
  }
  if (RESERVED.has(slug)) {
    throw new Error("That slug is reserved")
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug may only use letters, numbers, and hyphens")
  }
  return slug
}

export async function ensureSitesSchema() {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT to_regclass('public.user_sites') AS table_name`
  )
  if (!rows[0]?.table_name) {
    throw new Error(
      "user_sites table is missing. Run DATABASE_URL=... npm run db:init"
    )
  }
}

function mapSite(row: Record<string, unknown>): UserSite {
  const slug = String(row.slug)
  return {
    id: String(row.id),
    userId: String(row.user_id),
    slug,
    title: (row.title as string) ?? null,
    businessName: (row.business_name as string) ?? null,
    industry: (row.industry as string) ?? null,
    tone: (row.tone as string) ?? null,
    status: row.status as UserSite["status"],
    currentVersion: row.current_version as number | null,
    agentSessionId: (row.agent_session_id as string) ?? null,
    publicUrl: sitePublicUrl(slug),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  }
}

function mapBuild(row: Record<string, unknown>): SiteBuild {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    status: row.status as SiteBuild["status"],
    sessionId: String(row.session_id),
    version: Number(row.version),
    brief: (row.brief as SiteBuild["brief"]) || {
      businessName: "",
      industry: "",
    },
    summary: (row.summary as string) ?? null,
    previewHtml: (row.preview_html as string) ?? null,
    hasPreview: Boolean(row.preview_html),
    error: (row.error as string) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
    startedAt: row.started_at
      ? new Date(row.started_at as string).toISOString()
      : null,
    finishedAt: row.finished_at
      ? new Date(row.finished_at as string).toISOString()
      : null,
  }
}

export async function listSitesForUser(userId: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM user_sites WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  )
  return rows.map(mapSite)
}

export async function getSiteForUser(userId: string, slug: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM user_sites WHERE user_id = $1 AND slug = $2`,
    [userId, slug.toLowerCase()]
  )
  return rows[0] ? mapSite(rows[0]) : null
}

export async function createSiteForUser(
  user: AuthUser,
  input: {
    slug: string
    title?: string
    businessName?: string
    industry?: string
    tone?: string
  }
) {
  const slug = normalizeSlug(input.slug)
  const pool = getPool()
  try {
    const { rows } = await pool.query(
      `INSERT INTO user_sites
         (user_id, slug, title, business_name, industry, tone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [
        user.id,
        slug,
        input.title?.trim() || input.businessName?.trim() || slug,
        input.businessName?.trim() || null,
        input.industry?.trim() || null,
        input.tone?.trim() || null,
      ]
    )
    return mapSite(rows[0])
  } catch (err) {
    if (String(err).includes("unique") || String(err).includes("duplicate")) {
      throw new Error("That slug is already taken")
    }
    throw err
  }
}

export async function updateSiteBrief(
  userId: string,
  slug: string,
  brief: {
    businessName: string
    industry: string
    tone?: string
    title?: string
  }
) {
  const pool = getPool()
  const { rows } = await pool.query(
    `UPDATE user_sites SET
       business_name = $3,
       industry = $4,
       tone = $5,
       title = COALESCE($6, title),
       updated_at = NOW()
     WHERE user_id = $1 AND slug = $2
     RETURNING *`,
    [
      userId,
      slug.toLowerCase(),
      brief.businessName.trim(),
      brief.industry.trim(),
      brief.tone?.trim() || null,
      brief.title?.trim() || null,
    ]
  )
  return rows[0] ? mapSite(rows[0]) : null
}

export async function createBuildRecord(input: {
  siteId: string
  slug: string
  version: number
  brief: SiteBuild["brief"]
}) {
  const pool = getPool()
  const sessionId = `build-${input.siteId}-${input.version}`
  const { rows } = await pool.query(
    `INSERT INTO user_site_builds
       (site_id, status, session_id, version, brief)
     VALUES ($1, 'queued', $2, $3, $4)
     RETURNING *`,
    [input.siteId, sessionId, input.version, JSON.stringify(input.brief)]
  )
  await pool.query(
    `UPDATE user_sites SET status = 'building', updated_at = NOW() WHERE id = $1`,
    [input.siteId]
  )
  return mapBuild(rows[0])
}

export async function getBuildForUser(
  userId: string,
  slug: string,
  buildId: string,
  opts: { includePreviewHtml?: boolean } = {}
) {
  const pool = getPool()
  const previewSelect = opts.includePreviewHtml
    ? "b.preview_html"
    : `NULL::text AS preview_html,
       CASE WHEN b.preview_html IS NOT NULL AND length(b.preview_html) > 0
         THEN true ELSE false END AS has_preview`
  const { rows } = await pool.query(
    `SELECT b.id, b.site_id, b.status, b.session_id, b.version, b.brief, b.summary,
            b.error, b.created_at, b.started_at, b.finished_at,
            ${previewSelect}
     FROM user_site_builds b
     JOIN user_sites s ON s.id = b.site_id
     WHERE b.id = $1 AND s.slug = $2 AND s.user_id = $3`,
    [buildId, slug.toLowerCase(), userId]
  )
  if (!rows[0]) return null
  const build = mapBuild(rows[0])
  if (!opts.includePreviewHtml && "has_preview" in rows[0]) {
    return { ...build, hasPreview: Boolean(rows[0].has_preview) }
  }
  return build
}

export async function listBuildsForSite(siteId: string, limit = 20) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, site_id, status, session_id, version, brief, summary, error,
            created_at, started_at, finished_at,
            CASE WHEN preview_html IS NOT NULL AND length(preview_html) > 0
              THEN true ELSE false END AS has_preview,
            NULL::text AS preview_html
     FROM user_site_builds
     WHERE site_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [siteId, limit]
  )
  return rows.map((row) => {
    const build = mapBuild(row)
    return {
      ...build,
      hasPreview: Boolean(row.has_preview),
    }
  })
}

export async function markBuildRunning(buildId: string) {
  const pool = getPool()
  await pool.query(
    `UPDATE user_site_builds
     SET status = 'running', started_at = NOW()
     WHERE id = $1`,
    [buildId]
  )
}

export async function markBuildCompleted(
  buildId: string,
  siteId: string,
  version: number,
  summary: string,
  previewHtml?: string | null
) {
  const pool = getPool()
  await pool.query(
    `UPDATE user_site_builds
     SET status = 'completed', summary = $2, preview_html = $3, finished_at = NOW()
     WHERE id = $1`,
    [
      buildId,
      summary.slice(0, 8000),
      previewHtml ? previewHtml.slice(0, 2_000_000) : null,
    ]
  )
  await pool.query(
    `UPDATE user_sites
     SET status = 'live', current_version = $2, updated_at = NOW()
     WHERE id = $1`,
    [siteId, version]
  )
}

export function buildToClient(build: SiteBuild) {
  return {
    id: build.id,
    siteId: build.siteId,
    status: build.status,
    sessionId: build.sessionId,
    version: build.version,
    brief: build.brief,
    summary: build.summary,
    hasPreview: build.hasPreview,
    error: build.error,
    createdAt: build.createdAt,
    startedAt: build.startedAt,
    finishedAt: build.finishedAt,
  }
}

export async function markBuildFailed(
  buildId: string,
  siteId: string,
  error: string
) {
  const pool = getPool()
  await pool.query(
    `UPDATE user_site_builds
     SET status = 'failed', error = $2, finished_at = NOW()
     WHERE id = $1`,
    [buildId, error.slice(0, 4000)]
  )
  await pool.query(
    `UPDATE user_sites SET status = 'failed', updated_at = NOW() WHERE id = $1`,
    [siteId]
  )
}
