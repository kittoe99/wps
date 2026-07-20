import { Router } from "express"
import { z } from "zod"
import { getPool } from "../lib/db.js"
import { assertSlugAvailable } from "../lib/slugs.js"
import { cacheSite, invalidateSiteCache } from "../lib/valkey.js"
import { createUploadUrl, putObject, versionPrefix } from "../lib/spaces.js"
import { activateVersion } from "../workers/publish.js"
import { emitEvent } from "../lib/webhooks.js"
import { getValkey } from "../lib/valkey.js"
import { enqueueBuildJob } from "../workers/build.js"

export const sitesRouter = Router()

sitesRouter.get("/", async (_req, res) => {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, slug, status, current_version, title, created_at, updated_at
     FROM sites ORDER BY created_at DESC LIMIT 200`
  )
  res.json({ sites: rows })
})

sitesRouter.post("/", async (req, res) => {
  try {
    const body = z
      .object({
        slug: z.string().min(2).max(63),
        title: z.string().optional(),
        tenantId: z.string().uuid().optional(),
      })
      .parse(req.body)

    const slug = assertSlugAvailable(body.slug)
    const pool = getPool()

    const { rows } = await pool.query(
      `INSERT INTO sites (slug, title, tenant_id, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING id, slug, status, current_version, title, created_at`,
      [slug, body.title ?? null, body.tenantId ?? null]
    )

    const site = rows[0]
    await cacheSite({
      siteId: site.id,
      slug: site.slug,
      status: site.status,
      version: null,
      storagePrefix: null,
    })

    await emitEvent(
      "site.created",
      { siteId: site.id, slug: site.slug },
      { siteId: site.id, tenantId: body.tenantId }
    )

    res.status(201).json({ site })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create site"
    const status = message.includes("reserved") || message.includes("Invalid") ? 400 : 500
    if (String(err).includes("unique") || String(err).includes("duplicate")) {
      res.status(409).json({ error: "Slug already taken" })
      return
    }
    res.status(status).json({ error: message })
  }
})

sitesRouter.get("/:slug", async (req, res) => {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, slug, status, current_version, title, created_at, updated_at
     FROM sites WHERE slug = $1`,
    [req.params.slug.toLowerCase()]
  )
  if (!rows[0]) {
    res.status(404).json({ error: "Site not found" })
    return
  }
  res.json({ site: rows[0] })
})

sitesRouter.patch("/:slug", async (req, res) => {
  try {
    const body = z
      .object({
        title: z.string().optional(),
        status: z.enum(["draft", "live", "suspended"]).optional(),
      })
      .parse(req.body)

    const pool = getPool()
    const slug = req.params.slug.toLowerCase()
    const { rows } = await pool.query(
      `UPDATE sites SET
         title = COALESCE($2, title),
         status = COALESCE($3, status),
         updated_at = NOW()
       WHERE slug = $1
       RETURNING id, slug, status, current_version, title, tenant_id`,
      [slug, body.title ?? null, body.status ?? null]
    )

    if (!rows[0]) {
      res.status(404).json({ error: "Site not found" })
      return
    }

    const site = rows[0]
    const prefix =
      site.current_version != null ? versionPrefix(site.id, site.current_version) : null

    await cacheSite({
      siteId: site.id,
      slug: site.slug,
      status: site.status,
      version: site.current_version,
      storagePrefix: prefix,
    })

    if (body.status === "suspended") {
      await emitEvent(
        "site.suspended",
        { siteId: site.id, slug: site.slug },
        { siteId: site.id, tenantId: site.tenant_id ?? undefined }
      )
      await getValkey().publish(
        "edge:sync",
        JSON.stringify({ action: "suspend", slug: site.slug, siteId: site.id })
      )
    } else {
      await emitEvent(
        "site.updated",
        { siteId: site.id, slug: site.slug, status: site.status },
        { siteId: site.id, tenantId: site.tenant_id ?? undefined }
      )
    }

    res.json({ site })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Update failed" })
  }
})

/** Presigned uploads for a new version */
sitesRouter.post("/:slug/upload-urls", async (req, res) => {
  try {
    const body = z
      .object({
        files: z
          .array(
            z.object({
              path: z.string().min(1),
              contentType: z.string().default("application/octet-stream"),
            })
          )
          .min(1)
          .max(500),
        version: z.number().int().positive().optional(),
      })
      .parse(req.body)

    const pool = getPool()
    const slug = req.params.slug.toLowerCase()
    const { rows } = await pool.query(`SELECT id, current_version FROM sites WHERE slug = $1`, [
      slug,
    ])
    if (!rows[0]) {
      res.status(404).json({ error: "Site not found" })
      return
    }

    const siteId = rows[0].id as string
    const version = body.version ?? (rows[0].current_version ?? 0) + 1
    const prefix = versionPrefix(siteId, version)

    const uploads = await Promise.all(
      body.files.map(async (f) => {
        const clean = f.path.replace(/^\/+/, "").replace(/\.\./g, "")
        const key = `${prefix}${clean}`
        const url = await createUploadUrl(key, f.contentType)
        return { path: clean, key, url }
      })
    )

    res.json({ siteId, version, prefix, uploads })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" })
  }
})

/** Publish: activate a version that was uploaded to Spaces (sync or queue) */
sitesRouter.post("/:slug/publish", async (req, res) => {
  try {
    const body = z
      .object({
        version: z.number().int().positive(),
        async: z.boolean().optional().default(false),
        files: z
          .array(
            z.object({
              path: z.string(),
              content: z.string(),
              contentType: z.string().default("text/html"),
            })
          )
          .optional(),
      })
      .parse(req.body)

    const pool = getPool()
    const slug = req.params.slug.toLowerCase()
    const { rows } = await pool.query(`SELECT id FROM sites WHERE slug = $1`, [slug])
    if (!rows[0]) {
      res.status(404).json({ error: "Site not found" })
      return
    }

    const siteId = rows[0].id as string

    // Optional inline file write (useful for AI agent / small sites)
    if (body.files?.length) {
      const prefix = versionPrefix(siteId, body.version)
      for (const f of body.files) {
        const clean = f.path.replace(/^\/+/, "").replace(/\.\./g, "")
        await putObject(`${prefix}${clean}`, f.content, f.contentType)
      }
    }

    if (body.async) {
      await getValkey().rpush(
        "publish:jobs",
        JSON.stringify({ siteId, version: body.version })
      )
      res.status(202).json({ queued: true, siteId, version: body.version })
      return
    }

    const result = await activateVersion({ siteId, version: body.version })
    res.json({ published: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Publish failed" })
  }
})

sitesRouter.delete("/:slug/cache", async (req, res) => {
  await invalidateSiteCache(req.params.slug.toLowerCase())
  res.json({ ok: true })
})

/** Queue an OpenClaw sandbox build for this site */
sitesRouter.post("/:slug/build", async (req, res) => {
  try {
    const body = z
      .object({
        brief: z.object({
          businessName: z.string().min(1),
          industry: z.string().min(1),
          tone: z.string().optional(),
          researchUrls: z.array(z.string().url()).max(10).optional(),
        }),
        version: z.number().int().positive().optional(),
      })
      .parse(req.body)

    const pool = getPool()
    const slug = req.params.slug.toLowerCase()
    const { rows } = await pool.query(
      `SELECT id, current_version FROM sites WHERE slug = $1`,
      [slug]
    )
    if (!rows[0]) {
      res.status(404).json({ error: "Site not found" })
      return
    }

    const siteId = rows[0].id as string
    const version = body.version ?? (rows[0].current_version ?? 0) + 1
    const buildIdRow = await pool.query(`SELECT gen_random_uuid() AS id`)
    const buildId = buildIdRow.rows[0].id as string
    const sessionId = `build-${siteId}-${version}`

    await pool.query(
      `INSERT INTO site_builds (id, site_id, status, session_id, version, brief)
       VALUES ($1, $2, 'queued', $3, $4, $5)`,
      [buildId, siteId, sessionId, version, JSON.stringify(body.brief)]
    )

    await enqueueBuildJob({
      buildId,
      siteId,
      slug,
      sessionId,
      version,
      brief: body.brief,
    })

    res.status(202).json({ buildId, sessionId, version, status: "queued" })
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to queue build",
    })
  }
})

sitesRouter.get("/:slug/builds/:id", async (req, res) => {
  const pool = getPool()
  const slug = req.params.slug.toLowerCase()
  const { rows } = await pool.query(
    `SELECT b.id, b.status, b.session_id, b.version, b.brief, b.summary, b.error,
            b.created_at, b.started_at, b.finished_at, s.slug
     FROM site_builds b
     JOIN sites s ON s.id = b.site_id
     WHERE b.id = $1 AND s.slug = $2`,
    [req.params.id, slug]
  )
  if (!rows[0]) {
    res.status(404).json({ error: "Build not found" })
    return
  }
  const b = rows[0]
  res.json({
    build: {
      id: b.id,
      status: b.status,
      sessionId: b.session_id,
      version: b.version,
      brief: b.brief,
      summary: b.summary,
      error: b.error,
      createdAt: b.created_at,
      startedAt: b.started_at,
      finishedAt: b.finished_at,
      slug: b.slug,
      publicUrl: `https://${b.slug}.${process.env.PUBLIC_SITE_DOMAIN || "wpscanvas.com"}`,
    },
  })
})

sitesRouter.get("/:slug/builds", async (req, res) => {
  const pool = getPool()
  const slug = req.params.slug.toLowerCase()
  const { rows } = await pool.query(
    `SELECT b.id, b.status, b.session_id, b.version, b.created_at, b.finished_at
     FROM site_builds b
     JOIN sites s ON s.id = b.site_id
     WHERE s.slug = $1
     ORDER BY b.created_at DESC
     LIMIT 50`,
    [slug]
  )
  res.json({ builds: rows })
})
