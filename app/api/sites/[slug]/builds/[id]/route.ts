import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { ensureSitesSchema, getBuildForUser, buildToClient } from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string; id: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug, id } = await ctx.params
  try {
    await ensureSitesSchema()
    const build = await getBuildForUser(user.id, slug, id)
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 })
    }
    return NextResponse.json({ build: buildToClient(build) })
  } catch (err) {
    console.error("get build:", err)
    return NextResponse.json({ error: "Failed to load build" }, { status: 500 })
  }
}
