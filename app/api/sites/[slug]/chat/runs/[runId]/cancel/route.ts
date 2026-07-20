import {
  cancelAgentRun,
  ensureAgentChatSchema,
  getAgentRunForUser,
} from "@/lib/agent-chat"
import { getSessionUser } from "@/lib/auth"
import { ensureSitesSchema, getSiteForUser } from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string; runId: string }> }

export async function POST(_request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug, runId } = await ctx.params

  try {
    await ensureSitesSchema()
    await ensureAgentChatSchema()
    const site = await getSiteForUser(user.id, slug)
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 })
    }

    const run = await getAgentRunForUser(runId, user.id)
    if (!run || run.siteId !== site.id) {
      return Response.json({ error: "Run not found" }, { status: 404 })
    }

    const result = await cancelAgentRun(runId, user.id)
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error("cancel run:", err)
    return Response.json({ error: "Failed to cancel run" }, { status: 500 })
  }
}
