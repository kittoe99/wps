import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { readFile } from "fs/promises"
import { join } from "path"

const WORKSPACE = process.env.SANDBOX_WORKSPACE || join(process.cwd(), ".sandbox")

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const siteSlug = request.nextUrl.searchParams.get("site") || "default"

  try {
    const html = await readFile(join(WORKSPACE, user.id, siteSlug, "index.html"), "utf-8")
    return new Response(html, {
      headers: { "Content-Type": "text/html", "Cache-Control": "no-cache" },
    })
  } catch {
    return NextResponse.json({ error: "No saved site" }, { status: 404 })
  }
}
