"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentActivity, type LiveToolEvent } from "./AgentActivity";
import {
  ONBOARDING_LOCAL_DRAFT_KEY,
  onboardingPrompt,
  type LocalOnboardingDraft,
} from "@/lib/onboarding-agent";

interface SiteMeta {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  files: string[];
  workspacePath?: string;
}

interface ChatItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at?: string;
  runId?: string;
}

interface AgentStatus {
  provider: string;
  codingAgent: string;
  model: string | null;
  models?: Array<{ id: string; label: string; description: string }>;
  deepseekConfigured?: boolean;
  firecrawlConfigured?: boolean;
}

interface AgentRun {
  id: string;
  siteId: string;
  prompt: string;
  model: string;
  provider: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  error?: string;
  summary?: string;
  title?: string;
  tools: string[];
}

type PreviewDevice = "mobile" | "tablet" | "desktop";

const PREVIEW_DEVICES: Array<{
  id: PreviewDevice;
  label: string;
  width: number | "100%";
}> = [
  { id: "mobile", label: "Mobile", width: 390 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "desktop", label: "Desktop", width: "100%" },
];

const SITE_KEY = "atelier.activeSiteId";
const DEVICE_KEY = "atelier.previewDevice";
function ViewToggle({
  mobileView,
  onChange,
}: {
  mobileView: "chat" | "preview";
  onChange: (view: "chat" | "preview") => void;
}) {
  return (
    <div
      className="flex h-9 items-center rounded-full border border-border bg-surface-2 p-0.5 text-xs leading-none"
      role="group"
      aria-label="View"
    >
      <button
        type="button"
        onClick={() => onChange("chat")}
        aria-pressed={mobileView === "chat"}
        className={
          mobileView === "chat"
            ? "flex items-center gap-1.5 rounded-full bg-button px-3 py-1.5 font-medium text-button-ink"
            : "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-faint transition hover:text-foreground"
        }
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 4H4v12h4v4l5-4h7V4z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
        Chat
      </button>
      <button
        type="button"
        onClick={() => onChange("preview")}
        aria-pressed={mobileView === "preview"}
        className={
          mobileView === "preview"
            ? "flex items-center gap-1.5 rounded-full bg-button px-3 py-1.5 font-medium text-button-ink"
            : "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-faint transition hover:text-foreground"
        }
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
        Preview
      </button>
    </div>
  );
}

function ModelPicker({
  models,
  selected,
  onChange,
  disabled,
}: {
  models: Array<{ id: string; label: string; description?: string }>;
  selected: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = models.find((m) => m.id === selected) ?? models[0] ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Model"
        className="flex items-center gap-1.5 rounded-full border border-[#c9c9c1] bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-foreground shadow-sm transition hover:border-[#9eb900] disabled:opacity-40"
      >
        <span>{active ? active.label : "Model"}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="menu-pop-up absolute bottom-full left-0 z-50 mb-1.5 w-44 overflow-hidden rounded-xl border border-[#c9c9c1] bg-white py-1 shadow-[0_18px_48px_-12px_rgba(17,17,16,0.32)] ring-1 ring-black/5"
        >
          {models.map((m) => {
            const isSelected = m.id === selected;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setOpen(false);
                  onChange(m.id);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition ${
                  isSelected
                    ? "bg-surface-3 text-ink"
                    : "text-muted hover:bg-surface-3 hover:text-foreground"
                }`}
              >
                <span className="w-3.5 shrink-0" aria-hidden>
                  {isSelected ? (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-accent"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SiteSwitcher({
  sites,
  activeSiteId,
  onSelect,
}: {
  sites: SiteMeta[];
  activeSiteId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = sites.find((s) => s.id === activeSiteId) ?? null;

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex max-w-[110px] items-center gap-1.5 rounded-lg py-2 pl-1.5 pr-2 text-[13px] font-medium text-foreground transition hover:bg-surface-2 sm:max-w-[260px] md:max-w-[340px]"
      >
        <span className="truncate">
          {active ? active.title : "Select site…"}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="menu-pop absolute left-0 top-full z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface-2 py-1 shadow-[0_16px_48px_-12px_rgba(62,44,26,0.28)]"
        >
          {sites.map((site) => {
            const selected = site.id === activeSiteId;
            return (
              <button
                key={site.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  onSelect(site.id);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition ${
                  selected
                    ? "bg-surface-3 text-ink"
                    : "text-muted hover:bg-surface-3 hover:text-foreground"
                }`}
              >
                <span className="w-3.5 shrink-0" aria-hidden>
                  {selected ? (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-accent"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="truncate">{site.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  const parts = content
    .split("\n")
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""));
  const metaIndex = parts.findIndex(
    (l, i) =>
      i > 0 && /^\d+\s+pages?\s·/i.test(l.trim()) && !l.trim().startsWith("•"),
  );

  const body = metaIndex >= 0 ? parts.slice(0, metaIndex) : parts;
  const meta = metaIndex >= 0 ? parts[metaIndex] : null;

  const firstBullet = body.findIndex((l) => l.trim().startsWith("•"));
  const lead =
    firstBullet > 0
      ? body.slice(0, firstBullet).join("\n").trim()
      : firstBullet === 0
        ? ""
        : body.join("\n").trim();
  const bullets =
    firstBullet >= 0
      ? body.slice(firstBullet).filter((l) => l.trim().startsWith("•"))
      : [];

  // Fallback for older chat messages without structured bullets
  if (!bullets.length && !meta) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lead ? (
        <p className="text-sm leading-relaxed text-foreground">{lead}</p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="space-y-1.5">
          {bullets.map((line) => {
            const raw = line.replace(/^•\s*/, "");
            const [file, ...rest] = raw.split(" — ");
            const desc = rest.join(" — ");
            return (
              <li key={line} className="flex gap-2 text-[13px] leading-snug">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{file}</span>
                  {desc ? <span className="text-muted"> — {desc}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {meta ? <p className="font-mono text-[11px] text-faint">{meta}</p> : null}
    </div>
  );
}

export function Studio() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [sites, setSites] = useState<SiteMeta[]>([]);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseek-v4-pro");
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [liveTools, setLiveTools] = useState<LiveToolEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<EventSource | null>(null);
  const restoredRef = useRef(false);
  const onboardingLoadedRef = useRef(false);

  const isRunning =
    isStarting ||
    activeRun?.status === "queued" ||
    activeRun?.status === "running";

  const refreshSites = useCallback(async (selectId?: string) => {
    const res = await fetch("/api/studio/sites");
    const data = (await res.json()) as { sites: SiteMeta[] };
    setSites(data.sites);
    if (selectId) {
      setActiveSiteId(selectId);
      setPreviewKey((k) => k + 1);
      try {
        localStorage.setItem(SITE_KEY, selectId);
      } catch {
        /* ignore */
      }
    }
    return data.sites;
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
  }, []);

  const attachStream = useCallback(
    (runId: string, siteId: string) => {
      stopStream();
      const seen = new Set<string>();
      let finished = false;
      const es = new EventSource(`/api/studio/agent/runs/${runId}/stream`);
      streamRef.current = es;

      const finish = (run?: AgentRun, failMessage?: string) => {
        if (finished) return;
        finished = true;
        if (failMessage || run?.status === "failed") {
          setError(failMessage || run?.error || "Build failed");
        } else {
          // Reveal the result — mobile starts on the chat view
          setMobileView("preview");
        }
        setActiveRun(null);
        setIsStarting(false);
        setLiveTools([]);
        setStatusMessage(null);
        stopStream();
        void (async () => {
          await refreshSites(siteId);
          const sessionRes = await fetch(`/api/studio/sites/${siteId}/session`);
          if (sessionRes.ok) {
            const session = (await sessionRes.json()) as { chat: ChatItem[] };
            if (session.chat?.length) setMessages(session.chat);
          }
          setPreviewKey((k) => k + 1);
        })();
      };

      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as {
            type: string;
            run?: AgentRun;
            id?: string;
            tool?: string;
            toolStatus?: string;
            message?: string;
            text?: string;
            at?: string;
          };

          if (data.type === "status" && data.run) {
            setActiveRun(data.run);
            if (
              data.run.status === "completed" ||
              data.run.status === "failed"
            ) {
              finish(
                data.run,
                data.run.status === "failed" ? data.run.error : undefined,
              );
              return;
            }
          }

          if (data.type === "tool" && data.id) {
            if (seen.has(data.id)) return;
            seen.add(data.id);
            setLiveTools((prev) => [
              ...prev,
              {
                id: data.id!,
                tool: data.tool,
                toolStatus: data.toolStatus,
                message: data.message,
                at: data.at,
              },
            ]);
            if (data.message) setStatusMessage(data.message);
          } else if (data.type === "text" && data.text) {
            setStatusMessage(data.text.slice(0, 160));
          } else if (data.message && data.type !== "done") {
            setStatusMessage(data.message);
          }

          if (
            data.type === "completed" ||
            data.type === "failed" ||
            data.type === "done"
          ) {
            finish(
              data.run,
              data.type === "failed"
                ? data.message || data.run?.error
                : undefined,
            );
          }
        } catch {
          /* ignore malformed SSE */
        }
      };

      es.onerror = () => {
        // EventSource retries; disk poll on the server also closes the stream when done
      };
    },
    [refreshSites, stopStream],
  );

  const restoreSession = useCallback(
    async (siteId: string) => {
      const res = await fetch(`/api/studio/sites/${siteId}/session`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        chat: ChatItem[];
        activeRun: AgentRun | null;
        events: Array<{
          id: string;
          type: string;
          tool?: string;
          toolStatus?: string;
          message?: string;
          at?: string;
        }>;
      };

      if (data.chat?.length) {
        setMessages(data.chat);
      } else {
        setMessages([]);
      }

      if (
        data.activeRun &&
        (data.activeRun.status === "queued" ||
          data.activeRun.status === "running")
      ) {
        setActiveRun(data.activeRun);
        setLiveTools([]);
        setStatusMessage("Reconnecting to live run…");
        attachStream(data.activeRun.id, siteId);
      } else {
        setActiveRun(null);
        setLiveTools([]);
        setStatusMessage(null);
        stopStream();
      }

      setPreviewKey((k) => k + 1);
    },
    [attachStream, stopStream],
  );

  useEffect(() => {
    void (async () => {
      try {
        const savedOnboarding = localStorage.getItem(
          ONBOARDING_LOCAL_DRAFT_KEY,
        );
        if (savedOnboarding && !onboardingLoadedRef.current) {
          const draft = JSON.parse(savedOnboarding) as LocalOnboardingDraft;
          setPrompt(onboardingPrompt(draft));
          onboardingLoadedRef.current = true;
        }
      } catch {
        /* A malformed or unavailable local draft must never block the builder. */
      }

      const list = await refreshSites();
      void fetch("/api/studio/agent")
        .then((r) => r.json())
        .then((data: AgentStatus) => {
          setStatus(data);
          if (data.model) setSelectedModel(data.model);
        })
        .catch(() => {});

      try {
        const savedDevice = localStorage.getItem(
          DEVICE_KEY,
        ) as PreviewDevice | null;
        if (
          savedDevice === "mobile" ||
          savedDevice === "tablet" ||
          savedDevice === "desktop"
        ) {
          setPreviewDevice(savedDevice);
        }
      } catch {
        /* ignore */
      }

      if (restoredRef.current) return;
      restoredRef.current = true;

      let saved: string | null = null;
      try {
        saved = localStorage.getItem(SITE_KEY);
      } catch {
        saved = null;
      }
      const pick =
        (saved && list.find((s) => s.id === saved)?.id) || list[0]?.id || null;
      if (pick) {
        setActiveSiteId(pick);
        await restoreSession(pick);
      }
    })();

    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function chooseDevice(device: PreviewDevice) {
    setPreviewDevice(device);
    try {
      localStorage.setItem(DEVICE_KEY, device);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isRunning, liveTools]);

  async function build(nextPrompt: string) {
    const trimmed = nextPrompt.trim();
    if (!trimmed || isRunning) return;

    setError(null);
    setPrompt("");
    setIsStarting(true);
    setLiveTools([]);
    setStatusMessage("Queuing agent run…");
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== "welcome"),
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);

    try {
      const res = await fetch("/api/studio/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          siteId: activeSiteId ?? undefined,
          model: selectedModel,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        runId?: string;
        siteId?: string;
        status?: AgentRun["status"];
        provider?: string;
        model?: string;
      };
      if (!res.ok || !data.runId || !data.siteId) {
        throw new Error(data.error || "Failed to start build");
      }

      setActiveSiteId(data.siteId);
      try {
        localStorage.setItem(SITE_KEY, data.siteId);
      } catch {
        /* ignore */
      }
      await refreshSites(data.siteId);
      setActiveRun({
        id: data.runId,
        siteId: data.siteId,
        prompt: trimmed,
        model: data.model || selectedModel,
        provider: data.provider || status?.provider || "opencode",
        status: data.status || "queued",
        createdAt: new Date().toISOString(),
        tools: [],
      });
      setIsStarting(false);
      attachStream(data.runId, data.siteId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setIsStarting(false);
      setActiveRun(null);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Build failed: ${message}`,
        },
      ]);
    }
  }

  async function selectSite(id: string | null) {
    stopStream();
    setActiveRun(null);
    setLiveTools([]);
    setStatusMessage(null);
    setError(null);
    setActiveSiteId(id);
    if (!id) {
      setMessages([]);
      try {
        localStorage.removeItem(SITE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      localStorage.setItem(SITE_KEY, id);
    } catch {
      /* ignore */
    }
    await restoreSession(id);
  }

  const activeSite = sites.find((s) => s.id === activeSiteId) ?? null;
  const previewUrl = activeSiteId
    ? `/api/studio/sites/${activeSiteId}/files/index.html?v=${previewKey}`
    : null;
  const device = PREVIEW_DEVICES.find((d) => d.id === previewDevice)!;
  const isFluid = device.width === "100%";
  // On phones the preview view takes over the whole screen
  const fullScreenPreview = isMobileViewport && mobileView === "preview";
  const isFramed = !isFluid && !fullScreenPreview;
  const frameWidthPx = isFramed ? device.width : undefined;

  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground">
      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[400px_1fr]">
        <section
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } min-h-0 flex-col border-border md:flex md:border-r`}
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Conversation
            </p>
            <div className="md:hidden">
              <ViewToggle mobileView={mobileView} onChange={setMobileView} />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-surface-3 px-4 py-2.5 text-sm leading-relaxed text-ink"
                >
                  {m.content}
                </div>
              ) : (
                <div key={m.id} className="pr-2">
                  <AssistantMessage content={m.content} />
                </div>
              ),
            )}
            {isRunning && (
              <AgentActivity
                model={activeRun?.model ?? selectedModel}
                provider={activeRun?.provider ?? status?.provider ?? "opencode"}
                tools={liveTools}
                statusMessage={statusMessage}
                startedAt={activeRun?.startedAt ?? activeRun?.createdAt}
              />
            )}
            <div ref={endRef} />
          </div>

          <div className="shrink-0 border-t border-border bg-surface px-4 py-4">
            <form
              className="rounded-xl border border-border bg-surface-2 transition focus-within:border-border-strong"
              onSubmit={(e) => {
                e.preventDefault();
                void build(prompt);
              }}
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your site — e.g. a landing page for Meridian watches"
                className="min-h-[80px] w-full flex-1 resize-none bg-transparent px-4 pb-1 pt-3 text-sm text-foreground outline-none placeholder:text-placeholder"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void build(prompt);
                  }
                }}
              />
              <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
                <ModelPicker
                  models={
                    status?.models ?? [
                      { id: "deepseek-v4-flash", label: "V4 Flash" },
                      { id: "deepseek-v4-pro", label: "V4 Pro" },
                      { id: "kimi-k3", label: "Kimi K3" },
                    ]
                  }
                  selected={selectedModel}
                  onChange={setSelectedModel}
                  disabled={isRunning}
                />
                <button
                  type="submit"
                  disabled={isRunning || !prompt.trim()}
                  aria-label="Build"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-button text-button-ink transition hover:bg-button-strong disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 19V5m0 0l-6.5 6.5M12 5l6.5 6.5"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
            <div className="mt-2 flex items-center justify-between px-1">
              {error ? (
                <p className="text-xs text-danger">{error}</p>
              ) : (
                <span />
              )}
              <p className="font-mono text-[10px] text-faint">
                ⏎ send · ⇧⏎ newline
              </p>
            </div>
          </div>
        </section>

        <section
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } min-h-0 flex-col bg-background md:flex`}
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface pl-4 pr-3">
            <div className="flex min-w-0 flex-1 items-center">
              {isRunning ? (
                <div className="flex items-center gap-2 pl-1">
                  <span
                    className="relative flex h-1.5 w-1.5 shrink-0"
                    aria-hidden
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  <p className="truncate text-[13px] text-faint">
                    Building
                    {activeSite ? (
                      <span className="text-foreground">
                        {` · ${activeSite.title}`}
                      </span>
                    ) : null}
                  </p>
                </div>
              ) : sites.length > 0 ? (
                <SiteSwitcher
                  sites={sites}
                  activeSiteId={activeSiteId}
                  onSelect={(id) => void selectSite(id)}
                />
              ) : (
                <p className="pl-1 text-[13px] text-faint">Preview</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="md:hidden">
                <ViewToggle mobileView={mobileView} onChange={setMobileView} />
              </div>
              <div
                className="hidden h-9 items-center rounded-full border border-border bg-surface-2 p-0.5 md:flex"
                role="group"
                aria-label="Preview screen size"
              >
                {PREVIEW_DEVICES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => chooseDevice(d.id)}
                    title={d.label}
                    aria-label={d.label}
                    className={
                      previewDevice === d.id
                        ? "grid h-8 w-8 place-items-center rounded-full bg-button text-button-ink"
                        : "grid h-8 w-8 place-items-center rounded-full text-faint transition hover:text-foreground"
                    }
                  >
                    {d.id === "mobile" && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <rect
                          x="7"
                          y="2"
                          width="10"
                          height="20"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        />
                        <path
                          d="M11 18h2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {d.id === "tablet" && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <rect
                          x="4"
                          y="3"
                          width="16"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        />
                        <path
                          d="M11 17h2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {d.id === "desktop" && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <rect
                          x="2"
                          y="4"
                          width="20"
                          height="13"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.75"
                        />
                        <path
                          d="M8 20h8M12 17v3"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void selectSite(null)}
                disabled={isRunning}
                aria-label="New site"
                title="New site"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-button text-button-ink transition hover:bg-button-strong disabled:opacity-40 md:w-auto md:gap-1.5 md:px-4"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="hidden text-xs font-medium md:inline">
                  New
                </span>
              </button>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in new tab"
                  title="Open in new tab"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-button text-button-ink transition hover:bg-button-strong md:w-auto md:gap-1.5 md:px-4"
                >
                  <span className="hidden text-xs font-medium md:inline">
                    Open
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M7 17L17 7M9 7h8v8"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div
            className={`preview-canvas relative min-h-0 flex-1 overflow-auto ${
              fullScreenPreview ? "p-0" : "p-4"
            } md:p-8`}
          >
            {previewUrl ? (
              <div
                className={`flex h-full justify-center ${
                  fullScreenPreview ? "min-h-0" : "min-h-[520px]"
                }`}
              >
                <div
                  className={
                    isFramed
                      ? "flex h-full min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_72px_-24px_rgba(62,44,26,0.3)]"
                      : "flex h-full w-full min-w-0 flex-col overflow-hidden bg-white md:rounded-lg md:border md:border-border md:shadow-[0_2px_20px_rgba(62,44,26,0.18)]"
                  }
                  style={
                    isFramed
                      ? {
                          width: frameWidthPx,
                          maxWidth: "100%",
                          // Critical: prevent flex/iframe min-content from expanding
                          // past the device width (otherwise lg: breakpoints never fire)
                          minWidth: 0,
                        }
                      : { width: "100%", maxWidth: "100%" }
                  }
                >
                  {isFramed && (
                    <div className="flex h-7 shrink-0 items-center justify-center border-b border-border bg-surface">
                      <span className="font-mono text-[10px] tabular-nums text-faint">
                        {device.label} · {frameWidthPx}px
                      </span>
                    </div>
                  )}
                  <iframe
                    key={`${previewKey}-${previewDevice}`}
                    title={`Site preview · ${device.label}`}
                    src={previewUrl}
                    className="block min-h-0 min-w-0 w-full flex-1 border-0 bg-white"
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      // Force the iframe layout viewport to the frame width
                      ...(frameWidthPx ? { width: "100%", minWidth: 0 } : null),
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2"
                  aria-hidden
                >
                  <span className="h-2 w-2 rounded-[3px] bg-accent" />
                </span>
                <div className="space-y-1">
                  <p className="text-[15px] font-medium tracking-tight text-foreground">
                    Nothing to preview yet
                  </p>
                  <p className="max-w-xs text-[13px] leading-relaxed text-muted">
                    Describe a site and the agent will build it here — sessions
                    survive refresh.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {mobileView === "preview" && (
        <div className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 px-3 md:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void build(prompt);
            }}
            className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-surface-2/95 p-1.5 pl-4 shadow-[0_12px_32px_-8px_rgba(62,44,26,0.3)] backdrop-blur"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isRunning ? "Agent is building…" : "Ask for changes…"
              }
              disabled={isRunning}
              autoComplete="off"
              enterKeyHint="send"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRunning || !prompt.trim()}
              aria-label="Build"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-button text-button-ink transition hover:bg-button-strong disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 19V5m0 0l-6.5 6.5M12 5l6.5 6.5"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
