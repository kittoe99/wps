import { after } from "next/server"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { runOpenClawBuild } from "@/lib/openclaw-builder"
import {
  createBuildRecord,
  ensureSitesSchema,
  getSiteForUser,
  markBuildCompleted,
  markBuildFailed,
  markBuildRunning,
} from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string }> }

export async function POST(request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await ctx.params

  try {
    await ensureSitesSchema()
    const site = await getSiteForUser(user.id, slug)
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      brief?: {
        businessName?: string
        industry?: string
        tone?: string
        researchUrls?: string[]
      }
    }

    const businessName =
      body.brief?.businessName?.trim() || site.businessName || site.title || site.slug
    const industry = body.brief?.industry?.trim() || site.industry || "local business"
    const tone = body.brief?.tone?.trim() || site.tone || undefined
    const researchUrls = body.brief?.researchUrls?.filter(Boolean) || []

    if (!businessName || !industry) {
      return NextResponse.json(
        { error: "businessName and industry are required to build" },
        { status: 400 }
      )
    }

    const brief = { businessName, industry, tone, researchUrls }
    const version = (site.currentVersion ?? 0) + 1
    const build = await createBuildRecord({
      siteId: site.id,
      slug: site.slug,
      version,
      brief,
    })

    after(async () => {
      try {
        await markBuildRunning(build.id)
        const result = await runOpenClawBuild({
          sessionId: build.sessionId,
          slug: site.slug,
          version,
          brief,
        })
        if (!result.ok) {
          await markBuildFailed(build.id, site.id, result.error || "Build failed")
          return
        }
        await markBuildCompleted(
          build.id,
          site.id,
          version,
          result.reply || "Build completed",
          result.previewHtml
        )
      } catch (err) {
        console.error("background build failed:", err)
        await markBuildFailed(
          build.id,
          site.id,
          err instanceof Error ? err.message : "Build failed"
        )
      }
    })

    return NextResponse.json(
      {
        buildId: build.id,
        sessionId: build.sessionId,
        version,
        status: "queued",
        publicUrl: site.publicUrl,
      },
      { status: 202 }
    )
  } catch (err) {
    console.error("start build:", err)
    return NextResponse.json({ error: "Failed to start build" }, { status: 500 })
  }
}
