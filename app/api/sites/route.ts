import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import {
  createSiteForUser,
  ensureSitesSchema,
  listSitesForUser,
} from "@/lib/sites"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSitesSchema()
    const sites = await listSitesForUser(user.id)
    return NextResponse.json({ sites })
  } catch (err) {
    console.error("list sites:", err)
    return NextResponse.json({ error: "Failed to load sites" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSitesSchema()
    const body = (await request.json()) as {
      slug?: string
      title?: string
      businessName?: string
      industry?: string
      tone?: string
    }
    if (!body.slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }
    const site = await createSiteForUser(user, {
      slug: body.slug,
      title: body.title,
      businessName: body.businessName,
      industry: body.industry,
      tone: body.tone,
    })
    return NextResponse.json({ site }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create site"
    const status =
      message.includes("reserved") ||
      message.includes("Slug") ||
      message.includes("taken")
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
