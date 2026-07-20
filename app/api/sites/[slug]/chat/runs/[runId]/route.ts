import { getSessionUser } from "@/lib/auth"
import {
  ensureAgentChatSchema,
  getAgentRunForUser,
  getMessageById,
  runToClient,
} from "@/lib/agent-chat"
import { listenAgentRunProgress } from "@/lib/agent-run-bus"
import { buildRunWatchEvents, type WatchEvent } from "@/lib/agent-run-watch"
import { ensureSitesSchema, getSiteForUser } from "@/lib/sites"

export const maxDuration = 800

type Ctx = { params: Promise<{ slug: string; runId: string }> }

function sseEncode(event: WatchEvent) {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function GET(request: Request, ctx: Ctx) {
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

    const url = new URL(request.url)
    const stream = url.searchParams.get("stream") !== "0"

    if (!stream) {
      let assistantMessage = null
      if (run.assistantMessageId) {
        const msg = await getMessageById(run.assistantMessageId)
        if (msg) {
          assistantMessage = {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            buildId: msg.buildId,
            meta: msg.meta,
            createdAt: msg.createdAt,
          }
        }
      }
      return Response.json({
        run: runToClient(run),
        assistantMessage,
        site,
      })
    }

    const encoder = new TextEncoder()
    let lastUpdated = ""
    let lastTextLen = -1
    let lastStage = ""
    let lastEventCount = -1
    let closed = false
    let listener: { stop: () => Promise<void> } | null = null

    const body = new ReadableStream({
      async start(controller) {
        const send = (event: WatchEvent) => {
          if (closed) return
          try {
            controller.enqueue(encoder.encode(sseEncode(event)))
          } catch {
            closed = true
          }
        }

        const emitSnapshot = async () => {
          const result = await buildRunWatchEvents({
            runId,
            userId: user.id,
            slug,
            lastUpdated,
            lastTextLen,
            lastStage,
            lastEventCount,
          })
          lastUpdated = result.lastUpdated
          lastTextLen = result.lastTextLen
          lastStage = result.lastStage
          lastEventCount = result.lastEventCount
          for (const event of result.events) send(event)
          return result.done
        }

        const cleanup = async () => {
          closed = true
          if (listener) {
            await listener.stop().catch(() => {})
            listener = null
          }
          try {
            controller.close()
          } catch {
            /* already closed */
          }
        }

        try {
          send({ type: "hello", transport: "sse" })
          let done = await emitSnapshot()
          if (done) {
            await cleanup()
            return
          }

          listener = await listenAgentRunProgress({
            runId,
            onNotify: () => {
              void emitSnapshot().then(async (isDone) => {
                if (isDone) await cleanup()
              })
            },
            onError: (err) => {
              send({ type: "error", error: err.message })
            },
          })

          // Keepalive only — updates arrive via Postgres NOTIFY.
          while (!closed && !done) {
            await new Promise((r) => setTimeout(r, 20000))
            if (closed) break
            send({ type: "ping" })
            // Safety net in case a NOTIFY was missed
            done = await emitSnapshot()
            if (done) await cleanup()
          }
        } catch (err) {
          console.error("run stream:", err)
          send({
            type: "error",
            error: err instanceof Error ? err.message : "Stream failed",
          })
          send({ type: "done" })
          await cleanup()
        }
      },
      cancel() {
        closed = true
        void listener?.stop()
      },
    })

    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    console.error("run watch:", err)
    return Response.json({ error: "Failed to watch run" }, { status: 500 })
  }
}
