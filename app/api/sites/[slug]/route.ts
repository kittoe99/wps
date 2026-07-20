import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import {
  ensureSitesSchema,
  getSiteForUser,
  listBuildsForSite,
  updateSiteBrief,
  buildToClient,
} from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, ctx: Ctx) {
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
    const builds = await listBuildsForSite(site.id)
    return NextResponse.json({
      site,
      builds: builds.map(buildToClient),
    })
  } catch (err) {
    console.error("get site:", err)
    return NextResponse.json({ error: "Failed to load site" }, { status: 500 })
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await ctx.params
  try {
    await ensureSitesSchema()
    const body = (await request.json()) as {
      businessName?: string
      industry?: string
      tone?: string
      title?: string
    }
    if (!body.businessName?.trim() || !body.industry?.trim()) {
      return NextResponse.json(
        { error: "businessName and industry are required" },
        { status: 400 }
      )
    }
    const site = await updateSiteBrief(user.id, slug, {
      businessName: body.businessName,
      industry: body.industry,
      tone: body.tone,
      title: body.title,
    })
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }
    return NextResponse.json({ site })
  } catch (err) {
    console.error("patch site:", err)
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 })
  }
}
