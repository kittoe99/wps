"use client";

import { useEffect, useMemo, useState } from "react";

export type LiveToolEvent = {
  id: string;
  tool?: string;
  toolStatus?: string;
  message?: string;
  at?: string;
};

const TOOL_LABELS: Record<string, string> = {
  read: "Reading",
  write: "Writing",
  edit: "Editing",
  bash: "Running",
  glob: "Searching",
  grep: "Searching",
  todowrite: "Planning",
  todo: "Planning",
  list: "Listing",
  webfetch: "Fetching",
  firecrawl_scrape: "Scraping",
  firecrawlscrape: "Scraping",
  firecrawl_map: "Mapping site",
  firecrawlmap: "Mapping site",
  firecrawl_search: "Web search",
  firecrawlsearch: "Web search",
  firecrawl_crawl: "Crawling",
  firecrawlcrawl: "Crawling",
  firecrawl_check_crawl_status: "Crawl status",
  firecrawlcheckcrawlstatus: "Crawl status",
  firecrawl_extract: "Extracting",
  firecrawlextract: "Extracting",
  firecrawl_parse: "Parsing doc",
  firecrawlparse: "Parsing doc",
  firecrawl_agent: "Research agent",
  firecrawlagent: "Research agent",
  firecrawl_agent_status: "Research status",
  firecrawlagentstatus: "Research status",
  firecrawl_interact: "Browsing",
  firecrawlinteract: "Browsing",
  firecrawl_interact_stop: "Closing browser",
  firecrawlinteractstop: "Closing browser",
  firecrawl_developer_search: "Dev search",
  firecrawldevelopersearch: "Dev search",
  firecrawl_research_search_github: "GitHub search",
  firecrawlresearchsearchgithub: "GitHub search",
  firecrawl_research_search_papers: "Paper search",
  firecrawlresearchsearchpapers: "Paper search",
  step_start: "Starting",
  step_finish: "Finishing",
};

function formatTool(name?: string) {
  if (!name) return "Working";
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (TOOL_LABELS[key]) return TOOL_LABELS[key];
  if (key.includes("firecrawl") && key.includes("scrape")) return "Scraping";
  if (key.includes("firecrawl") && key.includes("map")) return "Mapping site";
  if (
    key.includes("firecrawl") &&
    key.includes("search") &&
    key.includes("github")
  )
    return "GitHub search";
  if (
    key.includes("firecrawl") &&
    key.includes("search") &&
    key.includes("paper")
  )
    return "Paper search";
  if (key.includes("firecrawl") && key.includes("search")) return "Web search";
  if (key.includes("firecrawl") && key.includes("crawl")) return "Crawling";
  if (key.includes("firecrawl") && key.includes("extract")) return "Extracting";
  if (key.includes("firecrawl") && key.includes("parse")) return "Parsing doc";
  if (key.includes("firecrawl") && key.includes("interact")) return "Browsing";
  if (key.includes("firecrawl") && key.includes("agent"))
    return "Research agent";
  if (key.includes("firecrawl") && key.includes("developer"))
    return "Dev search";
  if (key.includes("firecrawl")) return "Firecrawl";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isNoise(tool?: string) {
  const key = (tool || "").toLowerCase();
  return key === "step_start" || key === "step_finish" || key === "step";
}

export function AgentActivity({
  model,
  tools = [],
  statusMessage,
  startedAt,
}: {
  model: string;
  provider?: string;
  tools?: LiveToolEvent[];
  statusMessage?: string | null;
  startedAt?: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [pulseKey, setPulseKey] = useState("");

  useEffect(() => {
    const base = startedAt ? new Date(startedAt).getTime() : Date.now();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - base) / 1000)));
    tick();
    const clock = window.setInterval(tick, 1000);
    return () => window.clearInterval(clock);
  }, [startedAt]);

  // Re-trigger the headline animation whenever activity changes
  const nextPulseKey = `${tools.length}|${statusMessage ?? ""}`;
  if (pulseKey !== nextPulseKey) {
    setPulseKey(nextPulseKey);
    setPulse((p) => p + 1);
  }

  const meaningful = useMemo(
    () => tools.filter((t) => !isNoise(t.tool)),
    [tools],
  );

  const recent = meaningful.slice(-5);
  const current = recent[recent.length - 1];
  const headline = current
    ? formatTool(current.tool)
    : statusMessage && !/^step[_-]?start$/i.test(statusMessage)
      ? statusMessage.slice(0, 48)
      : "Thinking";

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const modelLabel = model.replace(/^deepseek-/, "").replace(/-/g, " ");

  return (
    <div className="agent-live overflow-hidden rounded-xl border border-border bg-surface-2">
      <div className="agent-live-sheen" aria-hidden />

      <div className="relative px-4 pb-3.5 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="agent-orb" aria-hidden>
              <span className="agent-orb-core" />
            </span>
            <div className="min-w-0">
              <p
                key={`${pulse}-${headline}`}
                className="agent-headline truncate text-[13px] font-medium tracking-tight text-foreground"
              >
                {headline}
                <span className="agent-ellipsis" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-faint">
                {modelLabel}
                {meaningful.length > 0
                  ? ` · ${meaningful.length} step${meaningful.length === 1 ? "" : "s"}`
                  : " · starting"}
              </p>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
            {timeLabel}
          </span>
        </div>

        <div className="agent-track mt-3.5" aria-hidden>
          <div className="agent-track-fill" />
        </div>

        {recent.length > 0 && (
          <ul className="agent-flow mt-3.5">
            {recent.map((t, i) => {
              const active = i === recent.length - 1;
              return (
                <li
                  key={t.id}
                  className={
                    active ? "agent-flow-item is-active" : "agent-flow-item"
                  }
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="agent-flow-dot" />
                  <span className="agent-flow-label">{formatTool(t.tool)}</span>
                  {t.toolStatus === "completed" ||
                  t.toolStatus === "complete" ? (
                    <span className="agent-flow-check">done</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
