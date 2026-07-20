import { after } from "next/server"
import { getSessionUser } from "@/lib/auth"
import {
  ensureAgentChatSchema,
  enqueueAgentTurn,
  executeAgentRun,
  getActiveAgentRunForSite,
  getMessageById,
  listAgentMessages,
  runToClient,
} from "@/lib/agent-chat"
import { ensureSitesSchema, getSiteForUser } from "@/lib/sites"

export const maxDuration = 300

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await ctx.params
  try {
    await ensureSitesSchema()
    await ensureAgentChatSchema()
    const site = await getSiteForUser(user.id, slug)
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 })
    }
    const [messages, activeRun] = await Promise.all([
      listAgentMessages(site.id),
      getActiveAgentRunForSite(site.id, user.id),
    ])

    let activeAssistant: {
      id: string
      role: "assistant"
      content: string
      buildId: string | null
      meta: Record<string, unknown>
      createdAt: string
    } | null = null

    if (activeRun?.assistantMessageId) {
      const msg = await getMessageById(activeRun.assistantMessageId)
      if (msg) {
        activeAssistant = {
          id: msg.id,
          role: "assistant",
          content: msg.content,
          buildId: msg.buildId,
          meta: msg.meta,
          createdAt: msg.createdAt,
        }
      }
    }

    return Response.json({
      site,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        buildId: m.buildId,
        meta: m.meta,
        createdAt: m.createdAt,
      })),
      activeRun: activeRun ? runToClient(activeRun) : null,
      activeAssistant,
    })
  } catch (err) {
    console.error("chat history:", err)
    return Response.json({ error: "Failed to load chat" }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { slug } = await ctx.params

  try {
    await ensureSitesSchema()
    await ensureAgentChatSchema()
    const site = await getSiteForUser(user.id, slug)
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 })
    }

    const body = (await request.json()) as { message?: string }
    const message = body.message?.trim()
    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }
    if (message.length > 12000) {
      return Response.json({ error: "Message is too long" }, { status: 400 })
    }

    const { run, userMessage } = await enqueueAgentTurn({
      site,
      userId: user.id,
      userMessage: message,
    })

    // Detached from the HTTP request — survives logout, tab close, and network drop.
    after(async () => {
      try {
        await executeAgentRun(run.id)
      } catch (err) {
        console.error("background agent run failed:", err)
      }
    })

    return Response.json(
      {
        runId: run.id,
        run: runToClient(run),
        userMessage: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        durable: true,
      },
      { status: 202 }
    )
  } catch (err) {
    console.error("chat enqueue:", err)
    const message = err instanceof Error ? err.message : "Agent failed"
    const conflict = message.includes("already in progress")
    return Response.json(
      { error: message },
      { status: conflict ? 409 : 500 }
    )
  }
}
