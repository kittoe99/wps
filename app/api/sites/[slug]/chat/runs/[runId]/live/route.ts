import { getSessionUser } from "@/lib/auth"
import {
  agentWsPublicUrl,
  createLiveWatchToken,
} from "@/lib/agent-live-auth"
import {
  ensureAgentChatSchema,
  getAgentRunForUser,
} from "@/lib/agent-chat"
import { ensureSitesSchema, getSiteForUser } from "@/lib/sites"

type Ctx = { params: Promise<{ slug: string; runId: string }> }

/**
 * Issues a short-lived watch token and tells the client which live transport to use.
 * Prefer WebSocket when NEXT_PUBLIC_AGENT_WS_URL is set (local/Node); else SSE.
 */
export async function GET(_request: Request, ctx: Ctx) {
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

    const token = await createLiveWatchToken({
      userId: user.id,
      runId,
      slug,
    })

    const wsBase = agentWsPublicUrl()
    const preferWs = Boolean(wsBase) && process.env.VERCEL !== "1"

    return Response.json({
      runId,
      token,
      transport: preferWs ? "ws" : "sse",
      wsUrl: preferWs
        ? `${wsBase}/agent-live?token=${encodeURIComponent(token)}`
        : null,
      sseUrl: `/api/sites/${slug}/chat/runs/${runId}?stream=1`,
    })
  } catch (err) {
    console.error("live session:", err)
    return Response.json({ error: "Failed to start live session" }, { status: 500 })
  }
}
