/**
 * OpenClaw gateway client for site-build orchestration.
 * Uses OpenAI-compatible POST /v1/chat/completions (must be enabled on gateway).
 */

export type OpenClawChatResult = {
  taskId?: string
  sessionId: string
  status: "queued" | "running" | "completed" | "failed"
  reply?: string
  error?: string
}

function gatewayBase(): string {
  return (process.env.OPENCLAW_URL || "http://127.0.0.1:18789").replace(/\/$/, "")
}

function headers(sessionId?: string): Record<string, string> {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || ""
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { "x-openclaw-session-key": sessionId } : {}),
  }
}

/** Start a build session chat turn (async wrapper around chat completions). */
export async function openClawChatAsync(input: {
  sessionId: string
  message: string
}): Promise<{ taskId: string; sessionId: string }> {
  // Fire-and-forget style: kick off the request without awaiting full reply here.
  // Build worker awaits via openClawWaitTask which reuses the same in-flight promise map.
  const taskId = `chat-${input.sessionId}-${Date.now()}`
  const promise = openClawChat(input)
  pendingTasks.set(taskId, promise)
  return { taskId, sessionId: input.sessionId }
}

const pendingTasks = new Map<string, Promise<OpenClawChatResult>>()

export async function openClawChat(input: {
  sessionId: string
  message: string
}): Promise<OpenClawChatResult> {
  const base = gatewayBase()
  const controller = new AbortController()
  const timeoutMs = Number(process.env.BUILD_TIMEOUT_MS || 15 * 60 * 1000)
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: headers(input.sessionId),
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENCLAW_MODEL || "openclaw/default",
        user: `conv:${input.sessionId}`,
        messages: [{ role: "user", content: input.message }],
        stream: false,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return {
        sessionId: input.sessionId,
        status: "failed",
        error: `OpenClaw chat failed (${res.status}): ${text.slice(0, 500)}`,
      }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const reply = data.choices?.[0]?.message?.content ?? ""
    return {
      sessionId: input.sessionId,
      status: "completed",
      reply,
    }
  } catch (err) {
    return {
      sessionId: input.sessionId,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Wait for an async chat task started by openClawChatAsync. */
export async function openClawWaitTask(
  taskId: string,
  _opts: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<OpenClawChatResult> {
  const pending = pendingTasks.get(taskId)
  if (!pending) {
    return {
      taskId,
      sessionId: "",
      status: "failed",
      error: `Unknown task ${taskId}`,
    }
  }
  try {
    const result = await pending
    return { ...result, taskId }
  } finally {
    pendingTasks.delete(taskId)
  }
}

export async function openClawHealth(): Promise<{ ok: boolean; message: string }> {
  const base = gatewayBase()
  try {
    const res = await fetch(`${base}/health`, { headers: headers() })
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    return { ok: true, message: "live" }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }
}
