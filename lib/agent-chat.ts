import { getPool } from "@/lib/db"
import { sitePublicUrl, type UserSite } from "@/lib/sites"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { extractPreviewHtml } from "@/lib/openclaw-builder"
import {
  hasOpenClawEventStreamConfig,
  runOpenClawAgentStream,
  type OpenClawAgentEvent,
} from "@/lib/openclaw-agent-stream"

export type AgentMessage = {
  id: string
  siteId: string
  userId: string
  role: "user" | "assistant" | "system"
  content: string
  buildId: string | null
  meta: Record<string, unknown>
  createdAt: string
}

export type AgentRunStatus = "queued" | "running" | "completed" | "failed"

export type AgentRunEvent = {
  type: string
  stage?: string
  detail?: string
  text?: string
  stream?: string
  phase?: string
  name?: string
  title?: string
  toolCallId?: string
  seq?: number
  data?: Record<string, unknown>
  buildId?: string
  status?: string
  hasPreview?: boolean
  error?: string
  at: string
}

export type AgentRun = {
  id: string
  siteId: string
  userId: string
  status: AgentRunStatus
  stage: string | null
  stageDetail: string | null
  streamingText: string
  events: AgentRunEvent[]
  userMessage: string
  userMessageId: string | null
  assistantMessageId: string | null
  buildId: string | null
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
}

export type AgentStreamEvent =
  | { type: "status"; stage: string; detail?: string }
  | {
      type: "user_saved"
      message: { id: string; role: "user"; content: string; createdAt: string }
    }
  | { type: "token"; text: string }
  | {
      type: "assistant_done"
      message: {
        id: string
        role: "assistant"
        content: string
        buildId: string | null
        meta: Record<string, unknown>
        createdAt: string
      }
    }
  | {
      type: "build"
      buildId: string
      status: "running" | "completed" | "failed"
      hasPreview?: boolean
    }
  | { type: "site"; site: UserSite }
  | { type: "error"; error: string }
  | { type: "done" }
  | { type: "snapshot"; run: AgentRunClient }

export type AgentRunClient = {
  id: string
  status: AgentRunStatus
  stage: string | null
  stageDetail: string | null
  streamingText: string
  events: AgentRunEvent[]
  userMessage: string
  userMessageId: string | null
  assistantMessageId: string | null
  buildId: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

function mapMessage(row: Record<string, unknown>): AgentMessage {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    userId: String(row.user_id),
    role: row.role as AgentMessage["role"],
    content: String(row.content),
    buildId: row.build_id ? String(row.build_id) : null,
    meta: (row.meta as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at as string).toISOString(),
  }
}

function mapRun(row: Record<string, unknown>): AgentRun {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    userId: String(row.user_id),
    status: row.status as AgentRunStatus,
    stage: (row.stage as string) ?? null,
    stageDetail: (row.stage_detail as string) ?? null,
    streamingText: String(row.streaming_text || ""),
    events: Array.isArray(row.events) ? (row.events as AgentRunEvent[]) : [],
    userMessage: String(row.user_message || ""),
    userMessageId: row.user_message_id ? String(row.user_message_id) : null,
    assistantMessageId: row.assistant_message_id
      ? String(row.assistant_message_id)
      : null,
    buildId: row.build_id ? String(row.build_id) : null,
    error: (row.error as string) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
    startedAt: row.started_at
      ? new Date(row.started_at as string).toISOString()
      : null,
    finishedAt: row.finished_at
      ? new Date(row.finished_at as string).toISOString()
      : null,
    updatedAt: new Date(row.updated_at as string).toISOString(),
  }
}

export function runToClient(run: AgentRun): AgentRunClient {
  return {
    id: run.id,
    status: run.status,
    stage: run.stage,
    stageDetail: run.stageDetail,
    streamingText: run.streamingText,
    events: run.events,
    userMessage: run.userMessage,
    userMessageId: run.userMessageId,
    assistantMessageId: run.assistantMessageId,
    buildId: run.buildId,
    error: run.error,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }
}

export async function ensureAgentChatSchema() {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT to_regclass('public.site_agent_messages') AS messages,
            to_regclass('public.site_agent_runs') AS runs`
  )
  if (!rows[0]?.messages) {
    throw new Error(
      "site_agent_messages table is missing. Run DATABASE_URL=... npm run db:init"
    )
  }
  if (!rows[0]?.runs) {
    throw new Error(
      "site_agent_runs table is missing. Run db:init with a role that can CREATE TABLE (doadmin), then GRANT to wps_canvas_app."
    )
  }
}

export async function getOrCreateAgentSessionId(site: UserSite) {
  const pool = getPool()
  const { rows } = await pool.query<{ agent_session_id: string | null }>(
    `SELECT agent_session_id FROM user_sites WHERE id = $1`,
    [site.id]
  )
  let sessionId = rows[0]?.agent_session_id
  if (!sessionId) {
    sessionId = `site-${site.id}`
    await pool.query(
      `UPDATE user_sites SET agent_session_id = $2, updated_at = NOW() WHERE id = $1`,
      [site.id, sessionId]
    )
  }
  return sessionId
}

export async function listAgentMessages(siteId: string, limit = 200) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM site_agent_messages
     WHERE site_id = $1 AND role IN ('user', 'assistant')
     ORDER BY created_at ASC
     LIMIT $2`,
    [siteId, limit]
  )
  return rows.map(mapMessage)
}

export async function appendAgentMessage(input: {
  siteId: string
  userId: string
  role: "user" | "assistant" | "system"
  content: string
  buildId?: string | null
  meta?: Record<string, unknown>
}) {
  const pool = getPool()
  const { rows } = await pool.query(
    `INSERT INTO site_agent_messages
       (site_id, user_id, role, content, build_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.siteId,
      input.userId,
      input.role,
      input.content,
      input.buildId ?? null,
      JSON.stringify(input.meta || {}),
    ]
  )
  await pool.query(
    `UPDATE user_sites SET updated_at = NOW() WHERE id = $1`,
    [input.siteId]
  )
  return mapMessage(rows[0])
}

export async function getAgentRunForUser(runId: string, userId: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM site_agent_runs WHERE id = $1 AND user_id = $2`,
    [runId, userId]
  )
  return rows[0] ? mapRun(rows[0]) : null
}

export async function getActiveAgentRunForSite(siteId: string, userId: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM site_agent_runs
     WHERE site_id = $1 AND user_id = $2 AND status IN ('queued', 'running')
     ORDER BY created_at DESC
     LIMIT 1`,
    [siteId, userId]
  )
  return rows[0] ? mapRun(rows[0]) : null
}

export async function getMessageById(id: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT * FROM site_agent_messages WHERE id = $1`,
    [id]
  )
  return rows[0] ? mapMessage(rows[0]) : null
}

async function pushRunEvent(runId: string, event: Omit<AgentRunEvent, "at">) {
  const pool = getPool()
  const full: AgentRunEvent = { ...event, at: new Date().toISOString() }
  await pool.query(
    `UPDATE site_agent_runs
     SET events = (events || $2::jsonb),
         updated_at = NOW()
     WHERE id = $1`,
    [runId, JSON.stringify([full])]
  )
  const { notifyAgentRunProgress } = await import("@/lib/agent-run-bus")
  await notifyAgentRunProgress(runId)
  return full
}

async function updateRunProgress(
  runId: string,
  patch: {
    status?: AgentRunStatus
    stage?: string
    stageDetail?: string
    streamingText?: string
    buildId?: string | null
    error?: string | null
    userMessageId?: string | null
    assistantMessageId?: string | null
    markStarted?: boolean
    markFinished?: boolean
  }
) {
  const pool = getPool()
  await pool.query(
    `UPDATE site_agent_runs SET
       status = COALESCE($2, status),
       stage = COALESCE($3, stage),
       stage_detail = COALESCE($4, stage_detail),
       streaming_text = COALESCE($5, streaming_text),
       build_id = COALESCE($6, build_id),
       error = COALESCE($7, error),
       user_message_id = COALESCE($8, user_message_id),
       assistant_message_id = COALESCE($9, assistant_message_id),
       started_at = CASE WHEN $10 THEN COALESCE(started_at, NOW()) ELSE started_at END,
       finished_at = CASE WHEN $11 THEN NOW() ELSE finished_at END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      runId,
      patch.status ?? null,
      patch.stage ?? null,
      patch.stageDetail ?? null,
      patch.streamingText ?? null,
      patch.buildId === undefined ? null : patch.buildId,
      patch.error === undefined ? null : patch.error,
      patch.userMessageId === undefined ? null : patch.userMessageId,
      patch.assistantMessageId === undefined ? null : patch.assistantMessageId,
      Boolean(patch.markStarted),
      Boolean(patch.markFinished),
    ]
  )
  const { notifyAgentRunProgress } = await import("@/lib/agent-run-bus")
  await notifyAgentRunProgress(runId)
}

/** Throttled streaming_text writer so reconnecting clients see live text. */
function createTokenBuffer(runId: string) {
  let buffer = ""
  let flushed = ""
  let timer: ReturnType<typeof setTimeout> | null = null
  let writing: Promise<void> = Promise.resolve()

  const flush = () => {
    if (buffer === flushed) return
    const next = buffer
    flushed = next
    writing = writing.then(async () => {
      await updateRunProgress(runId, { streamingText: next })
    })
  }

  return {
    append(text: string) {
      buffer += text
      if (!timer) {
        timer = setTimeout(() => {
          timer = null
          flush()
        }, 200)
      }
    },
    async flushNow() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      flush()
      await writing
    },
    get text() {
      return buffer
    },
  }
}

function renderChatSystemPrompt(site: UserSite, version: number) {
  const path = join(process.cwd(), "platform/builder/prompts/chat-system.md")
  let template: string
  try {
    template = readFileSync(path, "utf8")
  } catch {
    template = `You are the WPS Canvas builder for {{SLUG}} ({{PUBLIC_URL}}).
Ask clarifying questions. Build only with HTML+Tailwind+JS when the user is ready.
When done building/publishing, end with [[WPS_BUILD_COMPLETE version={{VERSION}}]].`
  }
  return template
    .replaceAll("{{SLUG}}", site.slug)
    .replaceAll("{{PUBLIC_URL}}", site.publicUrl || sitePublicUrl(site.slug))
    .replaceAll(
      "{{BUSINESS_NAME}}",
      site.businessName || site.title || "(unknown — ask)"
    )
    .replaceAll("{{INDUSTRY}}", site.industry || "(unknown — ask)")
    .replaceAll("{{TONE}}", site.tone || "(unknown — ask)")
    .replaceAll("{{VERSION}}", String(version))
}

function openClawConfig() {
  const base = (process.env.OPENCLAW_URL || "").replace(/\/$/, "")
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || ""
  if (!base || !token) {
    throw new Error("OPENCLAW_URL and OPENCLAW_GATEWAY_TOKEN must be set")
  }
  return { base, token }
}

export function parseBuildCompleteMarker(reply: string): {
  cleanReply: string
  completed: boolean
  version: number | null
} {
  const match = reply.match(/\[\[WPS_BUILD_COMPLETE(?:\s+version=(\d+))?\]\]/i)
  const cleanReply = reply
    .replace(/\s*\[\[WPS_BUILD_COMPLETE[^\]]*\]\]\s*/gi, "\n")
    .trim()
  return {
    cleanReply,
    completed: Boolean(match),
    version: match?.[1] ? Number(match[1]) : null,
  }
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m <= 0) return `${rem}s`
  return `${m}m ${rem.toString().padStart(2, "0")}s`
}

function waitingDetail(elapsedMs: number, phase: "connecting" | "waiting" | "streaming") {
  const t = formatElapsed(elapsedMs)
  if (phase === "connecting") {
    return `Starting… (${t})`
  }
  if (phase === "streaming") {
    return `Writing reply… (${t})`
  }
  if (elapsedMs < 20_000) {
    return `Thinking… (${t})`
  }
  if (elapsedMs < 60_000) {
    return `Still thinking… (${t})`
  }
  if (elapsedMs < 180_000) {
    return `Working on it… (${t}) — longer replies can take a few minutes`
  }
  return `Still working… (${t}). You can leave this page; the run keeps going.`
}

type StreamPiece =
  | { kind: "token"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "meta"; label: string }

const runControllers = new Map<string, AbortController>()

const SENSITIVE_EVENT_KEY = /token|secret|password|authorization|api[-_]?key/i

function sanitizeAgentEventValue(
  value: unknown,
  depth = 0
): unknown {
  if (depth > 5) return "[nested data omitted]"
  if (typeof value === "string") {
    return value.length > 40_000
      ? `${value.slice(0, 40_000)}\n… (${value.length - 40_000} chars omitted)`
      : value
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeAgentEventValue(item, depth + 1))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 80)
        .map(([key, item]) => [
          key,
          SENSITIVE_EVENT_KEY.test(key)
            ? "[redacted]"
            : sanitizeAgentEventValue(item, depth + 1),
        ])
    )
  }
  return value
}

function extractFirecrawlTarget(command: string, prefix: string): string {
  let target = command.replace(prefix, "").trim()
  target = target.replace(/--\w+(\s+\S+)?/g, "").trim()
  return target.slice(0, 160) || target
}

function summarizeAgentActivity(
  stream: string,
  data: Record<string, unknown>
): string {
  const name = typeof data.name === "string" ? data.name : ""
  const phase = typeof data.phase === "string" ? data.phase : ""
  const title = typeof data.title === "string" ? data.title : ""
  const args =
    data.args && typeof data.args === "object"
      ? (data.args as Record<string, unknown>)
      : {}
  const command = typeof args.command === "string" ? args.command : ""
  const path =
    typeof args.path === "string"
      ? args.path
      : typeof args.file_path === "string"
        ? args.file_path
        : ""
  const resultText =
    typeof data.result === "string"
      ? data.result
      : typeof data.output === "string"
        ? data.output
        : typeof data.text === "string"
          ? data.text
          : typeof data.delta === "string"
            ? data.delta
            : ""

  if (stream === "thinking" || stream === "reasoning") {
    const snippet = resultText.replace(/\s+/g, " ").trim()
    return snippet
      ? `Thinking: ${snippet.slice(0, 240)}${snippet.length > 240 ? "…" : ""}`
      : "Thinking…"
  }
  if (name === "exec" && command) {
    const isResult = phase === "result" || phase === "end"
    if (command.includes("wps-search")) {
      const q = extractFirecrawlTarget(command, "wps-search")
      return isResult ? `Web search done: ${q}` : `Searching web: ${q}`
    }
    if (command.includes("wps-research")) {
      const u = extractFirecrawlTarget(command, "wps-research")
      return isResult ? `Scraped page: ${u}` : `Scraping page: ${u}`
    }
    if (command.includes("wps-crawl")) {
      const u = extractFirecrawlTarget(command, "wps-crawl")
      return isResult ? `Crawl complete: ${u}` : `Crawling site: ${u}`
    }
    if (command.includes("wps-screenshot")) {
      const u = extractFirecrawlTarget(command, "wps-screenshot")
      return isResult ? `Screenshot captured: ${u}` : `Taking screenshot: ${u}`
    }
    if (command.includes("wps-diff")) {
      if (command.includes("--snapshot"))
        return isResult ? "Snapshot saved" : "Saving snapshot..."
      return isResult ? `Diff complete` : `Computing diff...`
    }
    return isResult
      ? `Shell finished: ${command.slice(0, 160)}`
      : `Shell: ${command.slice(0, 200)}`
  }
  if (["write", "edit", "apply_patch"].includes(name) && path) {
    return phase === "result" || phase === "end"
      ? `Updated ${path}`
      : `Writing ${path}`
  }
  if (name === "read" && path) return `Reading ${path}`
  if (title) return title
  if (name && phase) return `${name} · ${phase}`
  if (name) return name
  if (resultText) {
    const snippet = resultText.replace(/\s+/g, " ").trim()
    return `${stream}: ${snippet.slice(0, 200)}${snippet.length > 200 ? "…" : ""}`
  }
  return stream || "agent"
}

function toRunActivityEvent(event: OpenClawAgentEvent): Omit<AgentRunEvent, "at"> {
  const data = sanitizeAgentEventValue(event.data) as Record<string, unknown>
  const name = typeof data.name === "string" ? data.name : undefined
  const phase = typeof data.phase === "string" ? data.phase : undefined
  const title = typeof data.title === "string" ? data.title : undefined
  const toolCallId =
    typeof data.toolCallId === "string" ? data.toolCallId : undefined
  return {
    type: "agent_activity",
    stream: event.stream,
    phase,
    name,
    title,
    toolCallId,
    seq: event.seq,
    detail: summarizeAgentActivity(event.stream, data),
    data,
  }
}

export async function cancelAgentRun(runId: string, userId: string) {
  const run = await getAgentRunForUser(runId, userId)
  if (!run) return { ok: false as const, error: "Run not found" }
  if (run.status !== "queued" && run.status !== "running") {
    return { ok: false as const, error: "Run is not active" }
  }

  const controller = runControllers.get(runId)
  if (controller) {
    controller.abort(new Error("Cancelled"))
    // executeAgentRun catch will finalize DB state
    return { ok: true as const }
  }

  // Queued / orphaned — nothing running in this process
  await updateRunProgress(runId, {
    status: "failed",
    stage: "error",
    stageDetail: "Cancelled",
    error: "Cancelled",
    markFinished: true,
  })
  await pushRunEvent(runId, { type: "error", error: "Cancelled" })
  await pushRunEvent(runId, { type: "done" })

  await getPool().query(
    `UPDATE user_sites
     SET status = CASE WHEN status = 'building' THEN 'draft' ELSE status END,
         updated_at = NOW()
     WHERE id = $1`,
    [run.siteId]
  )

  return { ok: true as const }
}

async function* openClawTurnStream(input: {
  sessionId: string
  message: string
  timeoutMs?: number
  firstTokenTimeoutMs?: number
  externalSignal?: AbortSignal
  onProgress?: (info: {
    phase: "connecting" | "waiting" | "streaming"
    elapsedMs: number
    bytes: number
    note?: string
  }) => void | Promise<void>
}): AsyncGenerator<StreamPiece> {
  const { base, token } = openClawConfig()
  const controller = new AbortController()
  const timeoutMs =
    input.timeoutMs ?? Number(process.env.BUILD_TIMEOUT_MS || 12 * 60 * 1000)
  const firstTokenTimeoutMs =
    input.firstTokenTimeoutMs ??
    Number(process.env.AGENT_FIRST_TOKEN_MS || 3 * 60 * 1000)
  let gotVisible = false
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let firstTokenTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (!gotVisible) {
      controller.abort(
        new Error(
          "Timed out waiting for the agent to start writing. Send again to retry."
        )
      )
    }
  }, firstTokenTimeoutMs)

  const onExternalAbort = () => {
    controller.abort(input.externalSignal?.reason || new Error("cancelled"))
  }
  if (input.externalSignal) {
    if (input.externalSignal.aborted) onExternalAbort()
    else input.externalSignal.addEventListener("abort", onExternalAbort)
  }

  const started = Date.now()
  let bytes = 0
  let phase: "connecting" | "waiting" | "streaming" = "connecting"

  const heartbeat = setInterval(() => {
    void input.onProgress?.({
      phase,
      elapsedMs: Date.now() - started,
      bytes,
    })
  }, 4000)

  const markVisible = () => {
    gotVisible = true
    if (firstTokenTimer) {
      clearTimeout(firstTokenTimer)
      firstTokenTimer = null
    }
  }

  try {
    await input.onProgress?.({
      phase: "connecting",
      elapsedMs: 0,
      bytes: 0,
      note: "Starting…",
    })

    const thinking =
      process.env.OPENCLAW_THINKING || "off"

    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-openclaw-session-key": input.sessionId,
      },
      body: JSON.stringify({
        model: process.env.OPENCLAW_MODEL || "openclaw/default",
        user: `conv:${input.sessionId}`,
        messages: [{ role: "user", content: input.message }],
        stream: true,
        thinking,
      }),
    })

    if (!res.ok) {
      if (res.status === 400 || res.status === 404 || res.status === 501) {
        phase = "waiting"
        const nonStream = await fetch(`${base}/v1/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-openclaw-session-key": input.sessionId,
          },
          body: JSON.stringify({
            model: process.env.OPENCLAW_MODEL || "openclaw/default",
            user: `conv:${input.sessionId}`,
            messages: [{ role: "user", content: input.message }],
            stream: false,
            thinking,
          }),
        })
        if (!nonStream.ok) {
          const text = await nonStream.text().catch(() => "")
          throw new Error(
            `OpenClaw error (${nonStream.status}): ${text.slice(0, 500)}`
          )
        }
        const data = (await nonStream.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }
        const full = data.choices?.[0]?.message?.content || ""
        if (full) {
          markVisible()
          yield { kind: "token", text: full }
        }
        return
      }
      const text = await res.text().catch(() => "")
      throw new Error(`OpenClaw error (${res.status}): ${text.slice(0, 500)}`)
    }

    if (!res.body) throw new Error("OpenClaw returned an empty stream")

    phase = "waiting"
    await input.onProgress?.({
      phase,
      elapsedMs: Date.now() - started,
      bytes: 0,
      note: "Thinking…",
    })
    yield { kind: "meta", label: "Thinking…" }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) bytes += value.byteLength
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const payload = trimmed.slice(5).trim()
        if (payload === "[DONE]") return
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{
              delta?: {
                content?: string
                reasoning_content?: string
                reasoning?: string
                tool_calls?: unknown
              }
              message?: { content?: string }
            }>
          }
          const delta = json.choices?.[0]?.delta
          const reasoning =
            delta?.reasoning_content || delta?.reasoning || ""
          if (reasoning) {
            phase = "streaming"
            yield { kind: "reasoning", text: reasoning }
          }
          if (delta?.tool_calls) {
            const calls = Array.isArray(delta.tool_calls)
              ? delta.tool_calls
              : []
            const details = calls
              .map((call) => {
                if (!call || typeof call !== "object") return null
                const fn = (call as { function?: { name?: string; arguments?: string } }).function
                const name = typeof fn?.name === "string" ? fn.name : ""
                let args = ""
                try {
                  if (typeof fn?.arguments === "string") {
                    const parsed = JSON.parse(fn.arguments) as Record<string, unknown>
                    args =
                      typeof parsed.command === "string"
                        ? parsed.command
                        : typeof parsed.path === "string"
                          ? parsed.path
                          : typeof parsed.file_path === "string"
                            ? parsed.file_path
                            : ""
                  }
                } catch {
                  /* ignore parse errors */
                }
                return { name, args }
              })
              .filter(Boolean) as Array<{ name: string; args: string }>
            const labels = details.map((d) =>
              d.args ? `${d.name}: ${d.args.slice(0, 120)}` : d.name
            )
            yield {
              kind: "meta",
              label: labels.length
                ? `Using tools: ${labels.join(", ")}`
                : "Using tools…",
            }
          }
          const text =
            delta?.content ?? json.choices?.[0]?.message?.content ?? ""
          if (text) {
            phase = "streaming"
            markVisible()
            yield { kind: "token", text }
          }
        } catch {
          /* ignore partial JSON */
        }
      }
    }

    if (!gotVisible) {
      yield {
        kind: "meta",
        label: "Finished without visible text — try sending again.",
      }
    }
  } finally {
    clearInterval(heartbeat)
    clearTimeout(timer)
    if (firstTokenTimer) clearTimeout(firstTokenTimer)
    input.externalSignal?.removeEventListener("abort", onExternalAbort)
  }
}

async function openClawTurnOnce(input: {
  sessionId: string
  message: string
  timeoutMs?: number
}) {
  let full = ""
  for await (const piece of openClawTurnStream(input)) {
    if (piece.kind === "token") full += piece.text
  }
  return full.trim()
}

export async function enqueueAgentTurn(input: {
  site: UserSite
  userId: string
  userMessage: string
}) {
  const pool = getPool()
  const active = await getActiveAgentRunForSite(input.site.id, input.userId)
  if (active) {
    throw new Error(
      "An agent turn is already in progress for this site. Reconnect to watch it."
    )
  }

  const userMsg = await appendAgentMessage({
    siteId: input.site.id,
    userId: input.userId,
    role: "user",
    content: input.userMessage,
  })

  const { rows } = await pool.query(
    `INSERT INTO site_agent_runs
       (site_id, user_id, status, stage, stage_detail, user_message, user_message_id, events)
     VALUES ($1, $2, 'queued', 'queued', $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [
      input.site.id,
      input.userId,
      "Queued — keeps working if you leave.",
      input.userMessage,
      userMsg.id,
      JSON.stringify([
        {
          type: "status",
          stage: "queued",
          detail: "Queued — keeps working if you leave.",
          at: new Date().toISOString(),
        },
        {
          type: "user_saved",
          detail: userMsg.id,
          at: new Date().toISOString(),
        },
      ]),
    ]
  )

  await pool.query(
    `UPDATE user_sites
     SET status = CASE WHEN status = 'live' THEN status ELSE 'building' END,
         updated_at = NOW()
     WHERE id = $1`,
    [input.site.id]
  )

  return { run: mapRun(rows[0]), userMessage: userMsg }
}

/**
 * Runs in the background (Next.js `after`). Survives client disconnect / logout.
 * Progress is written to site_agent_runs for reconnecting UIs.
 */
export async function executeAgentRun(runId: string) {
  const pool = getPool()
  const { rows } = await pool.query(`SELECT * FROM site_agent_runs WHERE id = $1`, [
    runId,
  ])
  if (!rows[0]) return
  const run = mapRun(rows[0])
  if (run.status === "completed" || run.status === "failed") return

  const { rows: siteRows } = await pool.query(
    `SELECT * FROM user_sites WHERE id = $1`,
    [run.siteId]
  )
  if (!siteRows[0]) {
    await updateRunProgress(runId, {
      status: "failed",
      stage: "error",
      stageDetail: "Site missing",
      error: "Site missing",
      markFinished: true,
    })
    return
  }

  const site: UserSite = {
    id: String(siteRows[0].id),
    userId: String(siteRows[0].user_id),
    slug: String(siteRows[0].slug),
    title: siteRows[0].title ?? null,
    businessName: siteRows[0].business_name ?? null,
    industry: siteRows[0].industry ?? null,
    tone: siteRows[0].tone ?? null,
    status: siteRows[0].status,
    currentVersion: siteRows[0].current_version,
    agentSessionId: siteRows[0].agent_session_id ?? null,
    publicUrl: sitePublicUrl(String(siteRows[0].slug)),
    createdAt: new Date(siteRows[0].created_at).toISOString(),
    updatedAt: new Date(siteRows[0].updated_at).toISOString(),
  }

  const tokens = createTokenBuffer(runId)
  let lastEventPush = 0
  let activityNotes = ""
  let lastExtractedCommand = ""
  const abortController = new AbortController()
  runControllers.set(runId, abortController)

  /** Extract shell commands the agent announces from its streaming text. */
  function extractCommandsFromText(text: string): string[] {
    const patterns = [
      // Explicit "Running:" prefix
      /(?:Running|Running:|Run|Running command|Executing|Command)[:.]?\s*(wps-(?:search|research|crawl|screenshot|diff|publish)\s+[^\n\r]+)/gi,
      /(?:Running|Running:|Run|Executing)[:.]?\s*(sed\s+-i\s+[^\n\r]+)/gi,
      /(?:Running|Running:|Run|Executing)[:.]?\s*(cat\s+[^\n\r]+)/gi,
      /(?:Running|Running:|Run|Executing)[:.]?\s*(ls\s+[^\n\r]+)/gi,
      /(?:Running|Running:|Run|Executing)[:.]?\s*(test\s+-f\s+[^\n\r]+)/gi,
      // Without prefix — any wps-* command in the text
      /\b(wps-(?:search|research|crawl|screenshot|diff|publish)\s+[^\n\r]+)/gi,
      /\b(sed\s+-i\s+[^\n\r]+)/gi,
    ]
    const found: string[] = []
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      let match
      while ((match = pattern.exec(text)) !== null) {
        found.push(match[1].trim())
      }
    }
    return [...new Set(found)]
  }

  const setStatus = async (
    stage: string,
    detail: string,
    opts?: { recordEvent?: boolean }
  ) => {
    await updateRunProgress(runId, {
      status: "running",
      stage,
      stageDetail: detail,
      markStarted: true,
    })
    const record = opts?.recordEvent !== false
    if (record) {
      await pushRunEvent(runId, { type: "status", stage, detail })
      lastEventPush = Date.now()
    } else if (Date.now() - lastEventPush > 30_000) {
      // Periodic timeline crumbs so reconnecting UIs aren't blank.
      await pushRunEvent(runId, { type: "status", stage, detail })
      lastEventPush = Date.now()
    }
  }

  try {
    await setStatus("thinking", "Thinking…")

    const sessionId = await getOrCreateAgentSessionId(site)
    const version = (site.currentVersion ?? 0) + 1
    const system = renderChatSystemPrompt(site, version)
    const composed = `${system}

---

User message:
${run.userMessage}`

    await setStatus("waiting_model", "Thinking…")

    const handlePiece = async (piece: StreamPiece) => {
      if (piece.kind === "token") {
        tokens.append(piece.text)
        await setStatus(
          "generating",
          `Writing… (${tokens.text.length.toLocaleString()} chars)`,
          { recordEvent: tokens.text.length < 80 }
        )
        // Extract shell commands the agent announces in its output
        const commands = extractCommandsFromText(tokens.text)
        for (const cmd of commands) {
          if (cmd !== lastExtractedCommand) {
            lastExtractedCommand = cmd
            await pushRunEvent(runId, {
              type: "agent_activity",
              stream: "tool",
              phase: "start",
              detail: `Running: ${cmd.slice(0, 180)}`,
              data: { command: cmd.slice(0, 500), source: "extracted" },
            })
          }
        }
      } else if (piece.kind === "reasoning") {
        activityNotes = (activityNotes + piece.text).slice(-8000)
        await updateRunProgress(runId, {
          streamingText: `[thinking]\n${activityNotes.slice(-4000)}\n\n${tokens.text}`,
        })
        await setStatus("thinking", "Thinking…", { recordEvent: false })
        await pushRunEvent(runId, {
          type: "agent_activity",
          stream: "thinking",
          phase: "delta",
          detail: summarizeAgentActivity("thinking", { delta: piece.text }),
          data: { delta: piece.text },
        })
        // Also extract commands from reasoning text
        const reasoningCommands = extractCommandsFromText(piece.text)
        for (const cmd of reasoningCommands) {
          if (cmd !== lastExtractedCommand) {
            lastExtractedCommand = cmd
            await pushRunEvent(runId, {
              type: "agent_activity",
              stream: "tool",
              phase: "start",
              detail: `Running: ${cmd.slice(0, 180)}`,
              data: { command: cmd.slice(0, 500), source: "extracted" },
            })
          }
        }
      } else if (piece.kind === "meta") {
        await setStatus("waiting_model", piece.label, { recordEvent: true })
        await pushRunEvent(runId, {
          type: "agent_activity",
          stream: "status",
          phase: "update",
          detail: piece.label,
          data: { label: piece.label },
        })
      }
    }

    if (hasOpenClawEventStreamConfig()) {
      const result = await runOpenClawAgentStream({
        runId,
        sessionKey: sessionId,
        message: composed,
        thinking: process.env.OPENCLAW_THINKING || "off",
        timeoutMs: Number(process.env.BUILD_TIMEOUT_MS || 12 * 60 * 1000),
        signal: abortController.signal,
        onText: async (text) => {
          await handlePiece({ kind: "token", text })
        },
        onEvent: async (event) => {
          const phase =
            typeof event.data.phase === "string" ? event.data.phase : ""
          const name =
            typeof event.data.name === "string" ? event.data.name : ""
          const title =
            typeof event.data.title === "string" ? event.data.title : ""
          const args =
            event.data.args && typeof event.data.args === "object"
              ? (event.data.args as Record<string, unknown>)
              : {}
          const command =
            typeof args.command === "string" ? args.command : ""

          // Assistant token deltas already stream via onText — avoid flooding
          // the timeline with every character. Still keep thinking streams.
          if (event.stream === "assistant") {
            const thinking =
              typeof event.data.thinking === "string"
                ? event.data.thinking
                : typeof event.data.reasoning === "string"
                  ? event.data.reasoning
                  : typeof event.data.reasoning_content === "string"
                    ? event.data.reasoning_content
                    : ""
            if (thinking) {
              activityNotes = (activityNotes + thinking).slice(-8000)
              await updateRunProgress(runId, {
                streamingText: `[thinking]\n${activityNotes.slice(-4000)}\n\n${tokens.text}`,
              })
              await setStatus("thinking", "Thinking…", { recordEvent: false })
              await pushRunEvent(runId, {
                type: "agent_activity",
                stream: "thinking",
                phase: phase || "delta",
                detail: summarizeAgentActivity("thinking", {
                  delta: thinking,
                }),
                data: sanitizeAgentEventValue({
                  delta: thinking,
                }) as Record<string, unknown>,
              })
            }
            return
          }

          await pushRunEvent(runId, toRunActivityEvent(event))

          if (event.stream === "thinking" || event.stream === "reasoning") {
            const chunk =
              typeof event.data.delta === "string"
                ? event.data.delta
                : typeof event.data.text === "string"
                  ? event.data.text
                  : ""
            if (chunk) {
              activityNotes = (activityNotes + chunk).slice(-8000)
              await updateRunProgress(runId, {
                streamingText: `[thinking]\n${activityNotes.slice(-4000)}\n\n${tokens.text}`,
              })
              await setStatus("thinking", "Thinking…", { recordEvent: false })
            }
            return
          }

          if (event.stream === "lifecycle" && phase === "start") {
            await setStatus("agent_started", "Agent started", {
              recordEvent: false,
            })
          } else if (event.stream === "lifecycle" && phase === "finishing") {
            await setStatus("finishing", "Finishing agent run…", {
              recordEvent: false,
            })
          } else if (
            (event.stream === "tool" || event.stream === "item") &&
            (phase === "start" || phase === "result" || phase === "end")
          ) {
            const isFileTool = ["write", "edit", "apply_patch"].includes(name)
            const isPublishing =
              name === "exec" && command.includes("wps-publish")
            const isResearch =
              name === "exec" &&
              (command.includes("wps-search") ||
                command.includes("wps-research") ||
                command.includes("wps-crawl") ||
                command.includes("wps-screenshot"))
            const detail = summarizeAgentActivity(event.stream, event.data)
            await setStatus(
              isPublishing
                ? "publishing"
                : isResearch
                  ? "researching"
                  : isFileTool
                    ? "writing_files"
                    : "using_tool",
              detail ||
                title ||
                (isPublishing
                  ? "Publishing site"
                  : isResearch
                    ? "Researching the web"
                    : `Using ${name || "tool"}`),
              { recordEvent: false }
            )
          }
        },
      })
      if (!tokens.text && result.text) {
        await handlePiece({ kind: "token", text: result.text })
      }
      const meta =
        result.result && typeof result.result.meta === "object"
          ? (result.result.meta as Record<string, unknown>)
          : undefined
      if (meta) {
        await pushRunEvent(runId, {
          type: "agent_activity",
          stream: "model",
          phase: "end",
          detail: "Model run completed",
          data: sanitizeAgentEventValue({
            durationMs: meta.durationMs,
            agentMeta: meta.agentMeta,
            executionTrace: meta.executionTrace,
            toolSummary: meta.toolSummary,
            completion: meta.completion,
          }) as Record<string, unknown>,
        })
      }
    } else {
      for await (const piece of openClawTurnStream({
        sessionId,
        message: composed,
        externalSignal: abortController.signal,
        onProgress: async ({ phase, elapsedMs, note }) => {
          const detail = note || waitingDetail(elapsedMs, phase)
          const stage =
            phase === "streaming"
              ? "generating"
              : phase === "connecting"
                ? "connecting"
                : "waiting_model"
          await setStatus(stage, detail, { recordEvent: false })
        },
      })) {
        await handlePiece(piece)
      }
    }
    await tokens.flushNow()
    const rawReply = tokens.text

    const { cleanReply, completed, version: markerVersion } =
      parseBuildCompleteMarker(rawReply)

    let buildId: string | null = null
    let previewHtml: string | null = null
    let buildStatus: "completed" | "failed" | null = null

    if (completed) {
      await setStatus(
        "building",
        "Build marker received — capturing site files for preview…"
      )

      const buildVersion = markerVersion || version
      const { rows: buildRows } = await pool.query(
        `INSERT INTO user_site_builds
           (site_id, status, session_id, version, brief)
         VALUES ($1, 'running', $2, $3, $4)
         RETURNING id`,
        [
          site.id,
          `${sessionId}-v${buildVersion}-${Date.now()}`,
          buildVersion,
          JSON.stringify({
            businessName: site.businessName || site.title || site.slug,
            industry: site.industry || "business",
            tone: site.tone || undefined,
            source: "chat",
          }),
        ]
      )
      buildId = buildRows[0].id as string
      await updateRunProgress(runId, { buildId })
      await pushRunEvent(runId, {
        type: "build",
        buildId,
        status: "running",
      })

      try {
        await setStatus(
          "preview",
          `Reading /workspace/sites/${site.slug}/index.html for live preview…`
        )
        const rawHtml = await openClawTurnOnce({
          sessionId,
          message: `For the site preview, run: cat /workspace/sites/${site.slug}/index.html
Reply with ONLY the raw file contents. No markdown fences, no commentary.`,
          timeoutMs: 3 * 60 * 1000,
        })
        previewHtml = extractPreviewHtml(rawHtml)
        await pool.query(
          `UPDATE user_site_builds
           SET status = 'completed', summary = $2, preview_html = $3,
               finished_at = NOW(), started_at = COALESCE(started_at, NOW())
           WHERE id = $1`,
          [
            buildId,
            cleanReply.slice(0, 8000),
            previewHtml ? previewHtml.slice(0, 2_000_000) : null,
          ]
        )
        await pool.query(
          `UPDATE user_sites
           SET status = 'live', current_version = $2, updated_at = NOW()
           WHERE id = $1`,
          [site.id, buildVersion]
        )
        buildStatus = "completed"
        await pushRunEvent(runId, {
          type: "build",
          buildId,
          status: "completed",
          hasPreview: Boolean(previewHtml),
        })
        await setStatus(
          "complete",
          previewHtml
            ? "Build complete — preview ready."
            : "Build complete — preview HTML not captured."
        )
      } catch (err) {
        const buildError = err instanceof Error ? err.message : String(err)
        await pool.query(
          `UPDATE user_site_builds
           SET status = 'failed', error = $2, summary = $3,
               finished_at = NOW(), started_at = COALESCE(started_at, NOW())
           WHERE id = $1`,
          [buildId, buildError.slice(0, 4000), cleanReply.slice(0, 8000)]
        )
        await pool.query(
          `UPDATE user_sites SET status = 'failed', updated_at = NOW() WHERE id = $1`,
          [site.id]
        )
        buildStatus = "failed"
        await pushRunEvent(runId, {
          type: "build",
          buildId,
          status: "failed",
        })
        await setStatus("error", `Preview capture failed: ${buildError}`)
      }
    } else {
      await setStatus("replying", "Agent finished this turn (chat / questions).")
    }

    const assistantMsg = await appendAgentMessage({
      siteId: site.id,
      userId: run.userId,
      role: "assistant",
      content: cleanReply || "(No reply)",
      buildId,
      meta: {
        buildCompleted: completed,
        buildStatus,
        version: markerVersion || (completed ? version : undefined),
        runId,
      },
    })

    await updateRunProgress(runId, {
      status: "completed",
      stage: completed ? "complete" : "replying",
      stageDetail: completed
        ? "Build finished. You can leave and come back anytime."
        : "Reply saved. Session continues on next message.",
      streamingText: cleanReply || "(No reply)",
      assistantMessageId: assistantMsg.id,
      buildId,
      markFinished: true,
    })
    await pushRunEvent(runId, {
      type: "assistant_done",
      detail: assistantMsg.id,
    })
    await pushRunEvent(runId, { type: "done" })
  } catch (err) {
    const { rows: latestRows } = await pool.query(
      `SELECT status FROM site_agent_runs WHERE id = $1`,
      [runId]
    )
    if (
      latestRows[0]?.status === "failed" ||
      latestRows[0]?.status === "completed"
    ) {
      return
    }

    const reason = abortController.signal.reason
    const reasonMsg =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : ""
    const message = err instanceof Error ? err.message : String(err)
    const aborted =
      abortController.signal.aborted ||
      (err instanceof Error && err.name === "AbortError") ||
      /aborted|abort|cancelled|timed out/i.test(`${message} ${reasonMsg}`)
    const friendly = aborted
      ? reasonMsg && !/^AbortError$/i.test(reasonMsg)
        ? reasonMsg
        : "Cancelled. Send again when you’re ready."
      : message
    console.error("executeAgentRun:", err)
    await tokens.flushNow().catch(() => {})
    await updateRunProgress(runId, {
      status: "failed",
      stage: "error",
      stageDetail: friendly,
      error: friendly,
      markFinished: true,
    })
    await pushRunEvent(runId, { type: "error", error: friendly })
    await pushRunEvent(runId, { type: "done" })
    await pool.query(
      `UPDATE user_sites
       SET status = CASE WHEN status = 'building' THEN 'draft' ELSE status END,
           updated_at = NOW()
       WHERE id = $1`,
      [run.siteId]
    )
  } finally {
    runControllers.delete(runId)
  }
}

/** Map a durable run row into UI-facing stream events (for reconnect). */
export function runSnapshotEvents(run: AgentRun): AgentStreamEvent[] {
  const events: AgentStreamEvent[] = [{ type: "snapshot", run: runToClient(run) }]

  if (run.stage) {
    events.push({
      type: "status",
      stage: run.stage,
      detail: run.stageDetail || undefined,
    })
  }
  if (run.streamingText) {
    events.push({ type: "token", text: run.streamingText })
  }
  if (run.error && run.status === "failed") {
    events.push({ type: "error", error: run.error })
  }
  if (run.status === "completed" || run.status === "failed") {
    events.push({ type: "done" })
  }
  return events
}
