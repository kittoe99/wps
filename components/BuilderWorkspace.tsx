"use client"

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

type Site = {
  id: string
  slug: string
  title: string | null
  businessName: string | null
  industry: string | null
  tone: string | null
  status: "draft" | "building" | "live" | "failed"
  currentVersion: number | null
  publicUrl: string
  updatedAt: string
}

type Build = {
  id: string
  status: "queued" | "running" | "completed" | "failed"
  version: number
  summary: string | null
  hasPreview: boolean
  error: string | null
  createdAt: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  buildId?: string | null
  meta?: Record<string, unknown>
  createdAt: string
}

type AgentActivity = {
  stage: string
  detail: string
  history: Array<{ stage: string; detail: string; at: number }>
}

type AgentEvent = {
  type: string
  stage?: string
  detail?: string
  stream?: string
  phase?: string
  name?: string
  title?: string
  toolCallId?: string
  seq?: number
  data?: Record<string, unknown>
  at: string
}

type ActiveRun = {
  id: string
  status: "queued" | "running" | "completed" | "failed"
  stage: string | null
  stageDetail: string | null
  streamingText: string
  events: AgentEvent[]
  userMessageId: string | null
  buildId: string | null
  error: string | null
  createdAt?: string
}

type StreamEvent =
  | { type: "status"; stage: string; detail?: string }
  | { type: "user_saved"; message: ChatMessage }
  | { type: "token"; text: string; replace?: boolean }
  | { type: "assistant_done"; message: ChatMessage }
  | {
      type: "build"
      buildId: string
      status: "running" | "completed" | "failed"
      hasPreview?: boolean
    }
  | { type: "site"; site: Site }
  | { type: "snapshot"; run: ActiveRun }
  | { type: "error"; error: string }
  | { type: "done" }
  | { type: "ping" }
  | { type: "hello"; transport: "ws" | "sse" }

const statusLabel: Record<Site["status"], string> = {
  draft: "Draft",
  building: "Building",
  live: "Live",
  failed: "Needs attention",
}

const statusTone: Record<Site["status"], string> = {
  draft: "bg-neutral-200 text-neutral-700",
  building: "bg-[#fde6de] text-[#b85e44]",
  live: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
}

const STAGE_LABELS: Record<string, string> = {
  queued: "Starting",
  saving: "Saving",
  connecting: "Connecting",
  thinking: "Thinking",
  waiting_model: "Thinking",
  generating: "Writing",
  researching: "Researching web",
  building: "Building site",
  preview: "Loading preview",
  agent_started: "Agent started",
  using_tool: "Using tools",
  writing_files: "Writing files",
  publishing: "Publishing",
  finishing: "Finishing",
  replying: "Finishing",
  complete: "Done",
  error: "Something went wrong",
}

function friendlyStatus(stage: string | null | undefined, hasStream: boolean) {
  if (hasStream && (stage === "generating" || stage === "waiting_model" || stage === "thinking")) {
    return "Writing"
  }
  return STAGE_LABELS[stage || ""] || "Working"
}

function splitLiveOutput(raw: string): { thinking: string; reply: string } {
  const cleaned = stripBuildMarker(raw)
  if (!cleaned) return { thinking: "", reply: "" }
  if (cleaned.startsWith("[thinking]")) {
    const body = cleaned.replace(/^\[thinking\]\s*/i, "")
    const idx = body.indexOf("\n\n")
    if (idx >= 0) {
      return {
        thinking: body.slice(0, idx).trim(),
        reply: body.slice(idx + 2).trim(),
      }
    }
    return { thinking: body.trim(), reply: "" }
  }
  return { thinking: "", reply: cleaned }
}

const STARTERS = [
  "I need a calm landing page for my dental clinic",
  "Ask me what you need to know before building",
  "Build a one-page site for a local bakery — warm and friendly",
]

function stripBuildMarker(text: string) {
  return text.replace(/\s*\[\[WPS_BUILD_COMPLETE[^\]]*\]\]\s*/gi, "\n").trim()
}

function activityBody(event: AgentEvent): string {
  const data = event.data || {}
  const args =
    data.args && typeof data.args === "object"
      ? (data.args as Record<string, unknown>)
      : {}
  const parts: string[] = []
  if (typeof args.command === "string" && args.command.trim()) {
    parts.push(`$ ${args.command}`)
  }
  const path =
    typeof args.path === "string"
      ? args.path
      : typeof args.file_path === "string"
        ? args.file_path
        : ""
  if (path) parts.push(`path: ${path}`)
  if (typeof args.content === "string" && args.content.trim()) {
    parts.push(args.content)
  }
  for (const key of ["result", "output", "text", "delta", "error", "label"]) {
    const value = data[key]
    if (typeof value === "string" && value.trim()) {
      parts.push(value)
      break
    }
  }
  if (!parts.length && Object.keys(data).length) {
    parts.push(JSON.stringify(data, null, 2))
  }
  return parts.join("\n\n").trim()
}

function AgentTimeline({
  events,
  live = false,
}: {
  events: AgentEvent[]
  live?: boolean
}) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const visible = events.filter(
    (event) => event.type === "agent_activity" || event.type === "status"
  )

  useEffect(() => {
    const el = listRef.current
    if (!el || !live) return
    el.scrollTop = el.scrollHeight
  }, [visible.length, live])

  if (!visible.length) return null

  return (
    <div className={live ? "mt-3" : "mt-3"}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-sans-ui text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b]">
          {live ? "Live agent feed" : "Agent activity"}
        </p>
        <span className="font-sans-ui text-[10px] tabular-nums text-[#9a9a96]">
          {visible.length} events
        </span>
      </div>
      <div
        ref={listRef}
        className={`${live ? "max-h-[42vh]" : "max-h-80"} space-y-2 overflow-y-auto pr-1`}
      >
        {visible.map((event, index) => {
          const label =
            event.detail ||
            event.title ||
            [event.name, event.phase].filter(Boolean).join(" ") ||
            event.stream ||
            event.type
          const body = activityBody(event)
          const openByDefault =
            live &&
            index === visible.length - 1 &&
            Boolean(body) &&
            event.stream !== "status"
          const tone =
            event.phase === "result" ||
            event.phase === "end" ||
            event.phase === "finishing"
              ? "bg-emerald-500"
              : event.phase === "error"
                ? "bg-red-500"
                : event.stream === "thinking" || event.stream === "reasoning"
                  ? "bg-[#c4c0ba]"
                  : "bg-[#d97759]"
          return (
            <details
              key={`${event.at}-${event.seq ?? index}-${index}`}
              open={openByDefault || undefined}
              className="rounded-lg border border-[#ece9e5] bg-[#fcfaf8]"
            >
              <summary className="flex cursor-pointer list-none items-start gap-2 px-2.5 py-2 font-sans-ui text-xs text-[#3d3d3a]">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`}
                />
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-relaxed">
                  {label}
                </span>
                <span className="shrink-0 pt-0.5 text-[10px] uppercase tracking-wide text-[#9a9a96]">
                  {event.stream || event.stage || "status"}
                </span>
              </summary>
              {body && (
                <pre className="max-h-72 overflow-auto border-t border-[#ece9e5] px-2.5 py-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words text-[#5d5d59]">
                  {body}
                </pre>
              )}
            </details>
          )
        })}
      </div>
    </div>
  )
}

async function watchViaSse(
  slug: string,
  runId: string,
  ac: AbortController,
  onEvent: (event: StreamEvent) => void,
  sseUrl?: string
) {
  const res = await fetch(
    sseUrl || `/api/sites/${slug}/chat/runs/${runId}?stream=1`,
    {
      signal: ac.signal,
      headers: { Accept: "text/event-stream" },
    }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error || "Could not resume agent"
    )
  }
  if (!res.body) throw new Error("No run stream")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() || ""

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"))
      if (!line) continue
      let event: StreamEvent
      try {
        event = JSON.parse(line.slice(5).trim()) as StreamEvent
      } catch {
        continue
      }
      onEvent(event)
      if (event.type === "done") return
    }
  }
}

function activityFromRun(run: ActiveRun): AgentActivity {
  const history: AgentActivity["history"] = []
  for (const e of run.events || []) {
    if (e.type !== "status" || !e.stage) continue
    const detail = e.detail || STAGE_LABELS[e.stage] || e.stage
    const last = history[history.length - 1]
    if (last && last.stage === e.stage) {
      last.detail = detail
      last.at = Date.parse(e.at) || last.at
      continue
    }
    history.push({
      stage: e.stage,
      detail,
      at: Date.parse(e.at) || Date.now(),
    })
  }
  const trimmed = history.slice(-12)

  const stage = run.stage || "running"
  const detail =
    run.stageDetail || STAGE_LABELS[stage] || "Agent is working…"

  if (!trimmed.length) {
    trimmed.push({ stage, detail, at: Date.now() })
  }

  return { stage, detail, history: trimmed }
}

export default function BuilderWorkspace({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string | null
}) {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [previewBuildId, setPreviewBuildId] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [previewLocked, setPreviewLocked] = useState(false)
  const [activity, setActivity] = useState<AgentActivity | null>(null)
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [streamingText, setStreamingText] = useState("")
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null)
  const [elapsedLabel, setElapsedLabel] = useState("")

  const previewRef = useRef<HTMLDivElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const watchAbortRef = useRef<AbortController | null>(null)
  const watchingRunRef = useRef<string | null>(null)
  const stickToBottomRef = useRef(true)

  const selected = useMemo(
    () => sites.find((s) => s.slug === selectedSlug) || null,
    [sites, selectedSlug]
  )

  const loadSites = useCallback(async () => {
    const res = await fetch("/api/sites")
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to load sites")
    setSites(data.sites || [])
    return data.sites as Site[]
  }, [])

  const loadSiteDetail = useCallback(async (slug: string) => {
    const [siteRes, chatRes] = await Promise.all([
      fetch(`/api/sites/${slug}`),
      fetch(`/api/sites/${slug}/chat`),
    ])
    const siteData = await siteRes.json()
    const chatData = await chatRes.json()
    if (!siteRes.ok) throw new Error(siteData.error || "Failed to load site")
    if (!chatRes.ok) throw new Error(chatData.error || "Failed to load chat")

    setBuilds(siteData.builds || [])
    setMessages(chatData.messages || [])
    setSites((prev) => {
      const next = [...prev]
      const i = next.findIndex((s) => s.slug === slug)
      if (i >= 0) next[i] = siteData.site
      else next.unshift(siteData.site)
      return next
    })

    const completed = (siteData.builds as Build[]).find(
      (b) => b.status === "completed" && b.hasPreview
    )
    if (completed) setPreviewBuildId(completed.id)

    return {
      ...siteData,
      activeRun: chatData.activeRun as ActiveRun | null,
    }
  }, [])

  const applyStreamEvent = useCallback(
    (event: StreamEvent, slug: string) => {
      if (event.type === "ping" || event.type === "hello") return
      if (event.type === "snapshot") {
        setActivity(activityFromRun(event.run))
        setAgentEvents(event.run.events || [])
        if (event.run.streamingText) {
          setStreamingText(event.run.streamingText)
        }
        return
      }
      if (event.type === "status") {
        const stage = event.stage
        const detail = event.detail || STAGE_LABELS[stage] || stage
        setActivity((prev) => {
          if (prev?.stage === stage) {
            return { ...prev, detail }
          }
          return {
            stage,
            detail,
            history: [
              ...(prev?.history || []),
              { stage, detail, at: Date.now() },
            ].slice(-12),
          }
        })
        return
      }
      if (event.type === "token") {
        if (event.replace) setStreamingText(event.text)
        else setStreamingText((prev) => prev + event.text)
        return
      }
      if (event.type === "assistant_done") {
        const assistant = event.message
        setStreamingText("")
        setMessages((prev) => {
          if (prev.some((m) => m.id === assistant.id)) return prev
          return [...prev, assistant]
        })
        return
      }
      if (event.type === "build") {
        if (event.status === "completed") {
          setPreviewBuildId(event.buildId)
          setPreviewLocked(false)
          setPreviewKey((k) => k + 1)
        }
        return
      }
      if (event.type === "site") {
        setSites((prev) =>
          prev.map((s) => (s.slug === slug ? event.site : s))
        )
        return
      }
      if (event.type === "error") {
        setError(event.error)
      }
    },
    []
  )

  const watchRun = useCallback(
    async (slug: string, runId: string) => {
      if (watchingRunRef.current === runId) return
      watchAbortRef.current?.abort()
      const ac = new AbortController()
      watchAbortRef.current = ac
      watchingRunRef.current = runId

      setActiveRunId(runId)
      setSending(true)
      setError(null)
      setRunStartedAt(Date.now())

      let completedBuild = false
      let socket: WebSocket | null = null
      const closeSocket = () => {
        try {
          socket?.close()
        } catch {
          /* ignore */
        }
        socket = null
      }

      const handleEvent = (event: StreamEvent) => {
        if (event.type === "build" && event.status === "completed") {
          completedBuild = true
        }
        applyStreamEvent(event, slug)
      }

      try {
        const liveRes = await fetch(
          `/api/sites/${slug}/chat/runs/${runId}/live`,
          { signal: ac.signal }
        )
        const live = await liveRes.json()
        if (!liveRes.ok) {
          throw new Error(live.error || "Could not start live watch")
        }

        let usedWs = false
        if (live.transport === "ws" && typeof live.wsUrl === "string") {
          usedWs = await new Promise<boolean>((resolve) => {
            let opened = false
            let finished = false
            const done = (ok: boolean) => {
              if (finished) return
              finished = true
              resolve(ok)
            }

            try {
              socket = new WebSocket(live.wsUrl)
            } catch {
              done(false)
              return
            }

            const onAbort = () => {
              closeSocket()
              done(opened)
            }
            ac.signal.addEventListener("abort", onAbort)

            socket.onopen = () => {
              opened = true
            }
            socket.onmessage = (msg) => {
              let event: StreamEvent
              try {
                event = JSON.parse(String(msg.data)) as StreamEvent
              } catch {
                return
              }
              handleEvent(event)
              if (event.type === "done") {
                closeSocket()
                ac.signal.removeEventListener("abort", onAbort)
                done(true)
              }
            }
            socket.onerror = () => {
              if (!opened) {
                ac.signal.removeEventListener("abort", onAbort)
                closeSocket()
                done(false)
              }
            }
            socket.onclose = () => {
              ac.signal.removeEventListener("abort", onAbort)
              done(opened)
            }
          })
        }

        if (!usedWs && !ac.signal.aborted) {
          await watchViaSse(
            slug,
            runId,
            ac,
            handleEvent,
            live.sseUrl as string | undefined
          )
        }

        if (ac.signal.aborted) return

        await loadSiteDetail(slug)
        if (completedBuild) {
          setPreviewKey((k) => k + 1)
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setError(err instanceof Error ? err.message : "Watch failed")
      } finally {
        closeSocket()
        if (watchingRunRef.current === runId) {
          watchingRunRef.current = null
          setSending(false)
          setActiveRunId(null)
          setRunStartedAt(null)
          setElapsedLabel("")
          setActivity(null)
          setStreamingText("")
          // Unlock after any finished run; preview only shows for completed builds.
          setPreviewLocked(false)
        }
      }
    },
    [applyStreamEvent, loadSiteDetail]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await loadSites()
        if (cancelled) return
        setSelectedSlug((prev) => prev || list[0]?.slug || null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadSites])

  const watchRunRef = useRef(watchRun)
  watchRunRef.current = watchRun

  useEffect(() => {
    if (!selectedSlug) {
      setMessages([])
      setBuilds([])
      watchAbortRef.current?.abort()
      watchingRunRef.current = null
      setSending(false)
      setActiveRunId(null)
      setActivity(null)
      setAgentEvents([])
      setStreamingText("")
      setPreviewLocked(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = await loadSiteDetail(selectedSlug)
        if (cancelled) return
        const active = data.activeRun as ActiveRun | null
        if (
          active &&
          (active.status === "queued" || active.status === "running")
        ) {
          setPreviewLocked(true)
          setActivity(activityFromRun(active))
          setAgentEvents(active.events || [])
          setStreamingText(active.streamingText || "")
          setRunStartedAt(
            active.createdAt ? Date.parse(active.createdAt) || Date.now() : Date.now()
          )
          void watchRunRef.current(selectedSlug, active.id)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load site")
        }
      }
    })()
    return () => {
      cancelled = true
      // Stop watching UI only — durable agent run continues server-side.
      watchAbortRef.current?.abort()
      watchingRunRef.current = null
      setSending(false)
      setActiveRunId(null)
    }
  }, [selectedSlug, loadSiteDetail])

  useEffect(() => {
    const el = chatScrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending, streamingText, activity, agentEvents.length])

  useEffect(() => {
    if (!runStartedAt || !sending) {
      setElapsedLabel("")
      return
    }
    const tick = () => {
      const ms = Date.now() - runStartedAt
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      const rem = s % 60
      setElapsedLabel(m > 0 ? `${m}m ${rem.toString().padStart(2, "0")}s` : `${rem}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [runStartedAt, sending])

  const waitingForPreview = sending || previewLocked
  const previewTarget = waitingForPreview
    ? null
    : (previewBuildId && builds.find((b) => b.id === previewBuildId)) ||
      builds.find((b) => b.status === "completed" && b.hasPreview) ||
      builds.find((b) => b.status === "completed") ||
      null
  const showPreviewPane =
    waitingForPreview || Boolean(previewTarget) || builds.length > 0

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not create site")
      setNewSlug("")
      await loadSites()
      setSelectedSlug(data.site.slug)
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed")
    } finally {
      setCreating(false)
    }
  }

  async function sendMessage(text: string) {
    if (!selectedSlug || !text.trim() || sending) return
    setError(null)
    setSending(true)
    setDraft("")
    setStreamingText("")
    setAgentEvents([])
    setPreviewLocked(true)
    stickToBottomRef.current = true
    setActivity({
      stage: "queued",
      detail: "Starting durable agent run…",
      history: [
        {
          stage: "queued",
          detail: "Starting durable agent run…",
          at: Date.now(),
        },
      ],
    })

    const optimisticId = `local-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      },
    ])

    try {
      const res = await fetch(`/api/sites/${selectedSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Agent failed")

      if (data.userMessage) {
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== optimisticId)
          return [...without, data.userMessage]
        })
      }

      const runId = data.runId as string
      if (!runId) throw new Error("No run id returned")

      // Watch progress; agent work continues even if this stream disconnects.
      await watchRun(selectedSlug, runId)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setSending(false)
      setActivity(null)
      setStreamingText("")
      setError(err instanceof Error ? err.message : "Send failed")
    }
  }

  async function cancelActiveRun() {
    if (!selectedSlug || !activeRunId) return
    setError(null)
    try {
      const res = await fetch(
        `/api/sites/${selectedSlug}/chat/runs/${activeRunId}/cancel`,
        { method: "POST" }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not cancel")
      watchAbortRef.current?.abort()
      watchingRunRef.current = null
      setSending(false)
      setActiveRunId(null)
      setActivity(null)
      setStreamingText("")
      setPreviewLocked(false)
      setRunStartedAt(null)
      setElapsedLabel("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed")
    }
  }

  function onSend(e: FormEvent) {
    e.preventDefault()
    sendMessage(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(draft)
    }
  }

  function onChatScroll() {
    const el = chatScrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 80
  }

  return (
    <div className="h-dvh w-full flex flex-col bg-[#fcfaf8] overflow-hidden">
      <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="border-b lg:border-b-0 lg:border-r border-[#dbd9d7] bg-white/60 overflow-y-auto p-4 md:p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans-ui text-[10px] uppercase tracking-wider text-[#6b6b6b] mb-0.5">
                wpscanvas
              </p>
              <p className="font-sans-ui text-sm text-[#141413] font-medium truncate">
                {userName || userEmail}
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 font-sans-ui text-xs text-[#6b6b6b] hover:text-[#141413]"
            >
              Exit
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans-ui text-sm font-semibold text-[#141413]">
                Your websites
              </h2>
              <span className="font-sans-ui text-xs text-[#6b6b6b]">
                {sites.length}
              </span>
            </div>
            {loading ? (
              <p className="font-sans-ui text-sm text-[#6b6b6b]">Loading…</p>
            ) : sites.length === 0 ? (
              <p className="font-sans-ui text-sm text-[#6b6b6b] leading-relaxed">
                Create a site to start chatting with the builder agent. Full chat
                history is saved per site.
              </p>
            ) : (
              <ul className="space-y-1">
                {sites.map((site) => (
                  <li key={site.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(site.slug)}
                      className={`w-full text-left rounded-xl px-3 py-3 transition-colors ${
                        selectedSlug === site.slug
                          ? "bg-[#fde6de]/80 ring-1 ring-[#d97759]/30"
                          : "hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans-ui text-sm font-medium text-[#141413] truncate">
                          {site.businessName || site.title || site.slug}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[site.status]}`}
                        >
                          {statusLabel[site.status]}
                        </span>
                      </div>
                      <span className="font-sans-ui text-xs text-[#6b6b6b] block mt-0.5 truncate">
                        {site.slug}.wpscanvas.com
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={onCreate}
            className="rounded-2xl border border-[#dbd9d7] bg-white/70 p-4 space-y-3"
          >
            <h3 className="font-sans-ui text-sm font-semibold text-[#141413]">
              New website
            </h3>
            <input
              required
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
              placeholder="acme-dental"
              className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
            <p className="font-sans-ui text-[11px] text-[#6b6b6b]">
              {newSlug || "slug"}.wpscanvas.com
            </p>
            <button
              type="submit"
              disabled={creating || !newSlug.trim()}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create site"}
            </button>
          </form>
        </aside>

        {/* Chat + preview */}
        <section className="min-w-0 min-h-0 flex flex-col overflow-hidden">
          {error && (
            <div
              className="shrink-0 mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans-ui text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {!selected ? (
            <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
              <div>
                <h2 className="font-sans-ui text-lg font-semibold text-[#141413] mb-2">
                  Chat with your builder agent
                </h2>
                <p className="font-sans-ui text-sm text-[#6b6b6b] max-w-md mx-auto">
                  Create a website on the left, then describe what you want. The
                  agent can ask questions before it builds.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <header className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 md:px-5 py-3 border-b border-[#dbd9d7] bg-white/70">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[selected.status]}`}
                    >
                      {statusLabel[selected.status]}
                    </span>
                    {selected.currentVersion != null && (
                      <span className="font-sans-ui text-xs text-[#6b6b6b]">
                        v{selected.currentVersion}
                      </span>
                    )}
                  </div>
                  <h2 className="font-sans-ui text-base md:text-lg font-semibold tracking-tight text-[#141413] truncate">
                    {selected.businessName || selected.title || selected.slug}
                  </h2>
                </div>
                <a
                  href={selected.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans-ui text-xs text-[#d97759] hover:text-[#c46a4f] shrink-0"
                >
                  {selected.publicUrl.replace("https://", "")} <ArrowUpRight size={12} className="inline-block" />
                </a>
              </header>

              {/* Chat panel */}
              <div className="flex-1 min-h-0 flex flex-col bg-white/80 overflow-hidden">
                <div
                  ref={chatScrollRef}
                  onScroll={onChatScroll}
                  className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
                >                  {messages.length === 0 && !sending && (
                    <div className="space-y-4 py-6">
                      <p className="font-sans-ui text-sm text-[#3d3d3a] leading-relaxed max-w-lg">
                        Tell the agent what to build. It may ask follow-up
                        questions — answer in this chat. Say{" "}
                        <span className="font-medium">“build it”</span> when
                        you&apos;re ready.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STARTERS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => sendMessage(s)}
                            className="rounded-full border border-[#dbd9d7] bg-[#fcfaf8] px-3 py-1.5 font-sans-ui text-xs text-[#3d3d3a] hover:border-[#d97759]/40 hover:bg-[#fde6de]/40 transition-colors text-left"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[min(100%,36rem)] rounded-2xl px-4 py-3 ${
                          m.role === "user"
                            ? "bg-[#fde6de]/70 border border-[#d97759]/25 text-[#141413] rounded-br-md"
                            : "bg-[#fcfaf8] border border-[#dbd9d7] text-[#141413] rounded-bl-md"
                        }`}
                      >
                        {m.role === "assistant" && (
                          <p className="font-sans-ui text-[10px] uppercase tracking-wider text-[#d97759] mb-1.5">
                            Builder agent
                          </p>
                        )}
                        {m.role === "user" && (
                          <p className="font-sans-ui text-[10px] uppercase tracking-wider text-[#b85e44] mb-1.5">
                            You
                          </p>
                        )}
                        <p className="font-sans-ui text-sm leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <time className="font-sans-ui text-[10px] text-[#6b6b6b]">
                            {new Date(m.createdAt).toLocaleString()}
                          </time>
                          {m.buildId && m.meta?.buildStatus === "completed" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewBuildId(String(m.buildId))
                                setPreviewKey((k) => k + 1)
                              }}
                              className="font-sans-ui text-[10px] text-[#d97759] hover:text-[#c46a4f]"
                            >
                              View preview
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="max-w-[min(100%,40rem)] w-full rounded-2xl rounded-bl-md border border-[#e8e4df] bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2.5 mb-3">
                          <span
                            className="relative flex h-5 w-5 items-center justify-center"
                            aria-hidden
                          >
                            <span className="absolute inset-0 rounded-full border-2 border-[#fde6de]" />
                            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d97759] animate-spin" />
                          </span>
                          <div className="flex items-baseline gap-2 min-w-0 flex-1">
                            <p className="font-sans-ui text-sm font-medium text-[#141413]">
                              {friendlyStatus(activity?.stage, Boolean(streamingText))}
                            </p>
                            {elapsedLabel && (
                              <p className="font-sans-ui text-xs tabular-nums text-[#9a9a96]">
                                {elapsedLabel}
                              </p>
                            )}
                          </div>
                          {activeRunId && (
                            <button
                              type="button"
                              onClick={() => void cancelActiveRun()}
                              className="shrink-0 rounded-lg px-2.5 py-1 font-sans-ui text-xs text-[#6b6b6b] border border-[#dbd9d7] hover:bg-[#fcfaf8] hover:text-[#141413] transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {(() => {
                          const { thinking, reply } = splitLiveOutput(streamingText)
                          return (
                            <div className="space-y-3">
                              {activity?.detail && (
                                <p className="font-sans-ui text-xs text-[#6b6b6b]">
                                  {activity.detail}
                                </p>
                              )}
                              <AgentTimeline events={agentEvents} live />
                              {thinking && (
                                <div className="space-y-1.5 rounded-lg border border-[#ece9e5] bg-[#fcfaf8] px-3 py-2">
                                  <p className="font-sans-ui text-[11px] uppercase tracking-wider text-[#9a9a96]">
                                    Model reasoning
                                  </p>
                                  <p className="font-sans-ui text-xs leading-relaxed whitespace-pre-wrap text-[#6b6b6b] max-h-40 overflow-y-auto">
                                    {thinking}
                                    <span className="inline-block w-[2px] h-[1em] ml-0.5 align-[-0.1em] bg-[#c4c0ba] animate-pulse" />
                                  </p>
                                </div>
                              )}
                              {reply && (
                                <div className="font-sans-ui text-sm leading-relaxed whitespace-pre-wrap text-[#141413]">
                                  {reply}
                                  <span className="inline-block w-[2px] h-[1.05em] ml-0.5 align-[-0.15em] bg-[#d97759] animate-pulse" />
                                </div>
                              )}
                              {!thinking && !reply && agentEvents.length === 0 && (
                                <div className="space-y-2.5" aria-live="polite">
                                  <div className="h-2.5 w-[72%] rounded-full bg-[#f0eeeb] animate-pulse" />
                                  <div className="h-2.5 w-[54%] rounded-full bg-[#f0eeeb] animate-pulse [animation-delay:120ms]" />
                                  <div className="h-2.5 w-[63%] rounded-full bg-[#f0eeeb] animate-pulse [animation-delay:240ms]" />
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}

                  {!sending && agentEvents.length > 0 && (
                    <details
                      className="max-w-[min(100%,40rem)] rounded-2xl border border-[#e8e4df] bg-white px-4 py-3"
                      open
                    >
                      <summary className="cursor-pointer font-sans-ui text-xs font-medium text-[#3d3d3a]">
                        Last agent run · {agentEvents.length} recorded events
                      </summary>
                      <AgentTimeline events={agentEvents} />
                    </details>
                  )}
                </div>

                <form
                  onSubmit={onSend}
                  className="shrink-0 border-t border-[#dbd9d7] bg-white p-3 sm:p-4"
                >
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onKeyDown}
                      rows={2}
                      disabled={sending}
                      placeholder="Describe the site, answer questions, or say “build it”…"
                      className="flex-1 resize-none rounded-xl border border-neutral-200 bg-[#fcfaf8] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-300 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 transition-colors h-[42px]"
                    >
                      Send
                    </button>
                  </div>
                  <p className="font-sans-ui text-[11px] text-[#6b6b6b] mt-2">
                    Enter to send · Shift+Enter for new line
                    {activeRunId
                      ? " · Agent keeps working if you leave"
                      : ""}
                  </p>
                </form>
              </div>

              {/* Preview + versions (no auto page scroll) */}
              {showPreviewPane && (
                <div
                  ref={previewRef}
                  className="shrink-0 max-h-[38vh] border-t border-[#dbd9d7] overflow-y-auto bg-[#fcfaf8]"
                >
                  {waitingForPreview && (
                    <div className="bg-white px-4 py-5 border-b border-[#dbd9d7]">
                      <h3 className="font-sans-ui text-sm font-semibold text-[#141413]">
                        Site preview
                      </h3>
                      <p className="font-sans-ui text-xs text-[#6b6b6b] mt-1 max-w-xl leading-relaxed">
                        Preview unlocks after the agent finishes building and
                        the site files are captured. Watch the live feed above
                        for every tool call and model step.
                      </p>
                    </div>
                  )}
                  {previewTarget && (
                    <div className="bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#dbd9d7]">
                        <div>
                          <h3 className="font-sans-ui text-sm font-semibold text-[#141413]">
                            Site preview
                          </h3>
                          <p className="font-sans-ui text-xs text-[#6b6b6b]">
                            Version {previewTarget.version}
                            {previewTarget.hasPreview
                              ? " · from agent build"
                              : " · public URL"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewKey((k) => k + 1)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-300 hover:bg-white"
                          >
                            Refresh
                          </button>
                          <a
                            href={
                              previewTarget.hasPreview
                                ? `/api/sites/${selected.slug}/preview?build=${previewTarget.id}`
                                : selected.publicUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-[#d97759] hover:bg-[#c46a4f]"
                          >
                            Open <ArrowUpRight size={12} className="inline-block" />
                          </a>
                        </div>
                      </div>
                      <div className="relative bg-[#1a1a18]">
                        <div className="absolute inset-x-0 top-0 h-7 flex items-center gap-1.5 px-3 bg-[#2a2a28] z-10">
                          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                          <span className="ml-3 font-sans-ui text-[10px] text-neutral-400 truncate">
                            {selected.slug}.wpscanvas.com
                          </span>
                        </div>
                        <iframe
                          key={`${previewTarget.id}-${previewKey}`}
                          title={`Preview ${selected.slug}`}
                          src={
                            previewTarget.hasPreview
                              ? `/api/sites/${selected.slug}/preview?build=${previewTarget.id}&t=${previewKey}`
                              : selected.publicUrl
                          }
                          className="w-full h-[min(32vh,360px)] mt-7 bg-white border-0"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                      </div>
                    </div>
                  )}

                  {builds.length > 0 && (
                    <div className="px-4 py-3">
                      <h3 className="font-sans-ui text-xs font-semibold text-[#141413] mb-2 uppercase tracking-wide">
                        Build versions
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {builds.slice(0, 6).map((b) => (
                          <li key={b.id}>
                            <button
                              type="button"
                              disabled={!b.hasPreview}
                              onClick={() => {
                                setPreviewBuildId(b.id)
                                setPreviewKey((k) => k + 1)
                              }}
                              className="rounded-lg border border-[#dbd9d7] bg-white px-3 py-1.5 font-sans-ui text-xs text-[#3d3d3a] hover:border-[#d97759]/40 disabled:opacity-40"
                            >
                              v{b.version} · {b.status}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
