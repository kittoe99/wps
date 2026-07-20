import { redirect, notFound } from "next/navigation"
import { readFile } from "fs/promises"
import { join } from "path"
import { getSessionUser } from "@/lib/auth"
import { getPool } from "@/lib/db"

const WORKSPACE =
  process.env.SANDBOX_WORKSPACE || join(process.cwd(), ".sandbox")

export default async function SitePreview({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  const user = await getSessionUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/preview/${siteId}`)}`)
  }

  if (!/^[0-9a-f-]{36}$/i.test(siteId)) {
    notFound()
  }

  const pool = getPool()
  const { rows } = await pool.query<{
    slug: string
    preview_html: string | null
  }>(
    `SELECT s.slug, b.preview_html
     FROM user_sites s
     LEFT JOIN LATERAL (
       SELECT preview_html
       FROM user_site_builds
       WHERE site_id = s.id AND preview_html IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1
     ) b ON true
     WHERE s.id = $1 AND s.user_id = $2`,
    [siteId, user.id]
  )

  const site = rows[0]
  if (!site) {
    notFound()
  }

  let html = site.preview_html
  if (!html) {
    try {
      html = await readFile(
        join(WORKSPACE, user.id, site.slug, "index.html"),
        "utf-8"
      )
    } catch {
      notFound()
    }
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
