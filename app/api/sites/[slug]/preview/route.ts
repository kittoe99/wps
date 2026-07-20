import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import {
  ensureSitesSchema,
  getBuildForUser,
  getSiteForUser,
  listBuildsForSite,
} from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string }> }

/**
 * Serves stored build HTML for the in-app preview iframe.
 * Auth required. Prefers ?build=<id>, else latest completed build with preview.
 */
export async function GET(request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { slug } = await ctx.params
  const buildId = new URL(request.url).searchParams.get("build")

  try {
    await ensureSitesSchema()
    const site = await getSiteForUser(user.id, slug)
    if (!site) {
      return new NextResponse("Not found", { status: 404 })
    }

    let html: string | null = null
    if (buildId) {
      const build = await getBuildForUser(user.id, slug, buildId, {
        includePreviewHtml: true,
      })
      html = build?.previewHtml ?? null
    } else {
      const builds = await listBuildsForSite(site.id, 10)
      const withPreview = builds.find(
        (b) => b.status === "completed" && b.hasPreview
      )
      if (withPreview) {
        const full = await getBuildForUser(user.id, slug, withPreview.id, {
          includePreviewHtml: true,
        })
        html = full?.previewHtml ?? null
      }
    }

    if (!html) {
      return new NextResponse(
        `<!doctype html><html><body style="font-family:system-ui;padding:2rem;color:#444">
          <p>No preview HTML stored for this build yet.</p>
          <p><a href="${site.publicUrl}" target="_blank" rel="noreferrer">Open public URL</a></p>
        </body></html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      )
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'self' https: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https:; style-src 'unsafe-inline' https:; img-src * data: blob:;",
      },
    })
  } catch (err) {
    console.error("preview:", err)
    return new NextResponse("Preview failed", { status: 500 })
  }
}
