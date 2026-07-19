import { getPool } from "../lib/db.js"
import { cacheSite } from "../lib/valkey.js"
import { listPrefix, writeCurrentPointer, versionPrefix } from "../lib/spaces.js"
import { emitEvent } from "../lib/webhooks.js"

export type PublishJob = {
  siteId: string
  version: number
}

/**
 * Activate a published version:
 * Spaces is already written → update Postgres → Valkey → current pointer → events
 * Edge cache sync is triggered via Valkey pub/sub so NGINX nodes can pull.
 */
export async function activateVersion(job: PublishJob) {
  const pool = getPool()
  const prefix = versionPrefix(job.siteId, job.version)
  const objects = await listPrefix(prefix)
  const byteSize = objects.reduce((sum, o) => sum + o.size, 0)

  const siteRes = await pool.query<{
    id: string
    slug: string
    status: string
    tenant_id: string | null
  }>(`SELECT id, slug, status, tenant_id FROM sites WHERE id = $1`, [job.siteId])

  const site = siteRes.rows[0]
  if (!site) throw new Error(`Site ${job.siteId} not found`)

  await pool.query(
    `INSERT INTO site_versions (site_id, version, storage_prefix, file_count, byte_size, activated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (site_id, version) DO UPDATE SET
       storage_prefix = EXCLUDED.storage_prefix,
       file_count = EXCLUDED.file_count,
       byte_size = EXCLUDED.byte_size,
       activated_at = NOW()`,
    [job.siteId, job.version, prefix, objects.length, byteSize]
  )

  await pool.query(
    `UPDATE sites
     SET current_version = $2, status = 'live', updated_at = NOW()
     WHERE id = $1`,
    [job.siteId, job.version]
  )

  await writeCurrentPointer(job.siteId, job.version)

  await cacheSite({
    siteId: site.id,
    slug: site.slug,
    status: "live",
    version: job.version,
    storagePrefix: prefix,
  })

  // Notify edge sync workers
  const { getValkey } = await import("../lib/valkey.js")
  await getValkey().publish(
    "edge:sync",
    JSON.stringify({
      action: "activate",
      siteId: site.id,
      slug: site.slug,
      version: job.version,
      storagePrefix: prefix,
    })
  )

  // CDN invalidate hint (Spaces CDN + optional Cloudflare)
  await invalidateCdn(site.slug)

  await emitEvent(
    "site.published",
    {
      siteId: site.id,
      slug: site.slug,
      version: job.version,
      url: `https://${site.slug}.${process.env.EDGE_DOMAIN || "wpscanvas.com"}`,
      fileCount: objects.length,
      byteSize,
    },
    { siteId: site.id, tenantId: site.tenant_id ?? undefined, version: job.version }
  )

  return { siteId: site.id, slug: site.slug, version: job.version, fileCount: objects.length }
}

async function invalidateCdn(slug: string) {
  const domain = process.env.EDGE_DOMAIN || "wpscanvas.com"
  const urls = [`https://${slug}.${domain}/`, `https://${slug}.${domain}/*`]

  // Optional Cloudflare purge
  if (process.env.CF_ZONE_ID && process.env.CF_API_TOKEN) {
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
      }
    ).catch(() => undefined)
  }

  // Spaces CDN has no granular purge API; edge nodes pull fresh objects on sync.
  return urls
}
