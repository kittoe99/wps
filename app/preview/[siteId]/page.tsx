import { getPool } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function SitePreview({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  const pool = getPool()

  const { rows } = await pool.query(
    "SELECT metadata->>'generated_html' as html FROM sites WHERE id = $1",
    [siteId]
  )

  if (!rows[0]?.html) {
    notFound()
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: rows[0].html }}
      suppressHydrationWarning
    />
  )
}
