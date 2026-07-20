import {
  getAgentRunForUser,
  getMessageById,
  runToClient,
  type AgentStreamEvent,
} from "@/lib/agent-chat"
import { getSiteForUser } from "@/lib/sites"

export type WatchEvent =
  | AgentStreamEvent
  | { type: "ping" }
  | { type: "token"; text: string; replace: true }
  | { type: "hello"; transport: "ws" | "sse" }

/**
 * Build the next batch of UI events from the latest durable run row.
 * Returns `{ done: true }` when the run is terminal.
 */
export async function buildRunWatchEvents(input: {
  runId: string
  userId: string
  slug: string
  lastUpdated: string
  lastTextLen: number
  lastStage: string
  lastEventCount?: number
}): Promise<{
  events: WatchEvent[]
  done: boolean
  lastUpdated: string
  lastTextLen: number
  lastStage: string
  lastEventCount: number
}> {
  const current = await getAgentRunForUser(input.runId, input.userId)
  if (!current) {
    return {
      events: [
        { type: "error", error: "Run disappeared" },
        { type: "done" },
      ],
      done: true,
      lastUpdated: input.lastUpdated,
      lastTextLen: input.lastTextLen,
      lastStage: input.lastStage,
      lastEventCount: input.lastEventCount || 0,
    }
  }

  const eventCount = current.events.length
  const changed =
    current.updatedAt !== input.lastUpdated ||
    current.streamingText.length !== input.lastTextLen ||
    current.stage !== input.lastStage ||
    eventCount !== (input.lastEventCount ?? -1)

  if (
    !changed &&
    current.status !== "completed" &&
    current.status !== "failed"
  ) {
    return {
      events: [],
      done: false,
      lastUpdated: input.lastUpdated,
      lastTextLen: input.lastTextLen,
      lastStage: input.lastStage,
      lastEventCount: eventCount,
    }
  }

  const events: WatchEvent[] = [
    { type: "snapshot", run: runToClient(current) },
  ]

  if (current.stage) {
    events.push({
      type: "status",
      stage: current.stage,
      detail: current.stageDetail || undefined,
    })
  }

  if (current.streamingText) {
    events.push({
      type: "token",
      text: current.streamingText,
      replace: true,
    })
  }

  for (const ev of current.events) {
    if (ev.type === "build" && ev.buildId) {
      events.push({
        type: "build",
        buildId: ev.buildId,
        status:
          (ev.status as "running" | "completed" | "failed") || "running",
        hasPreview: ev.hasPreview,
      })
    }
  }

  let done = false
  if (current.status === "completed" || current.status === "failed") {
    done = true
    if (current.assistantMessageId) {
      const msg = await getMessageById(current.assistantMessageId)
      if (msg) {
        events.push({
          type: "assistant_done",
          message: {
            id: msg.id,
            role: "assistant",
            content: msg.content,
            buildId: msg.buildId,
            meta: msg.meta,
            createdAt: msg.createdAt,
          },
        })
      }
    }
    if (current.status === "failed" && current.error) {
      events.push({ type: "error", error: current.error })
    }
    const refreshed = await getSiteForUser(input.userId, input.slug)
    if (refreshed) events.push({ type: "site", site: refreshed })
    events.push({ type: "done" })
  }

  return {
    events,
    done,
    lastUpdated: current.updatedAt,
    lastTextLen: current.streamingText.length,
    lastStage: current.stage || "",
    lastEventCount: eventCount,
  }
}
