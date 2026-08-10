import path from "path";
import type { SiteFile } from "./types";

function extractTitleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

function pageLabel(filePath: string, htmlTitle: string) {
  const base = path.basename(filePath, path.extname(filePath)).toLowerCase();
  if (base === "index" || base === "home") return "Home";
  if (htmlTitle && !/^untitled$/i.test(htmlTitle)) {
    // Prefer a short page name from the document title
    const short = htmlTitle.split(/[|–—·•-]/)[0]?.trim();
    if (short && short.length <= 48) return short;
  }
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Strip markdown tables / fences / excess noise from agent prose. */
export function cleanAgentProse(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  // Drop fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, "").trim();

  // Convert markdown tables into simple bullets when present
  if (/^\|.+\|/m.test(text)) {
    const lines = text.split("\n");
    const kept: string[] = [];
    const rows: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\|?\s*:?-+:?\s*\|/.test(trimmed)) continue; // separator
      if (/^\|.+\|/.test(trimmed)) {
        const cells = trimmed
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean);
        if (cells.length >= 2) {
          const file = cells[0].replace(/^[`*]+|[`*]+$/g, "");
          const desc = cells
            .slice(1)
            .join(" — ")
            .replace(/^[`*]+|[`*]+$/g, "");
          rows.push(`• ${file} — ${desc}`);
        }
        continue;
      }
      kept.push(line);
    }
    text = [...kept, ...(rows.length ? ["", ...rows] : [])]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // Soften leftover markdown
  text = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function clipAtSentence(text: string, max = 520): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const breakAt = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("\n"),
  );
  if (breakAt > max * 0.45) {
    return slice.slice(0, breakAt + 1).trim();
  }
  const sp = slice.lastIndexOf(" ");
  return `${(sp > 0 ? slice.slice(0, sp) : slice).trim()}…`;
}

export function buildCompletionMessage(input: {
  title: string;
  files: SiteFile[];
  agentText?: string;
  model: string;
  provider: string;
  siteId: string;
}): { summary: string; chatContent: string } {
  const htmlFiles = input.files
    .filter((f) => f.path.toLowerCase().endsWith(".html"))
    .sort((a, b) => {
      const rank = (p: string) =>
        /(^|\/)index\.html$/i.test(p) ? 0 : p.toLowerCase();
      const ra = rank(a.path);
      const rb = rank(b.path);
      if (ra === 0) return -1;
      if (rb === 0) return 1;
      return a.path.localeCompare(b.path);
    });

  const pages = htmlFiles.map((f) => {
    const docTitle = extractTitleFromHtml(f.content, f.path);
    return {
      path: f.path,
      label: pageLabel(f.path, docTitle),
    };
  });

  const cleaned = cleanAgentProse(input.agentText || "");
  // Prefer a short lead paragraph; drop page inventory if we'll rebuild it
  let lead = cleaned
    .split(/\n{2,}/)[0]
    ?.replace(/^here are the .*$/im, "")
    .replace(
      /\bhere(?:'s| is) what (?:changed|i (?:built|created|updated)).*$/im,
      "",
    )
    .replace(
      /^all pages created and linked\.?\s*/i,
      "All pages created and linked. ",
    )
    .replace(/\s*here are the \d+-?page site:?\s*/i, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Drop lead if it's just a leftover inventory intro
  if (/^(here are|below is|the following)\b/i.test(lead)) {
    lead = "";
  }

  if (!lead || lead.length < 12) {
    lead =
      pages.length > 1
        ? `${input.title} is ready — ${pages.length} linked pages.`
        : `${input.title} is ready.`;
  } else {
    lead = clipAtSentence(lead, 280);
    // Ensure it doesn't end mid-word awkwardly
    if (/[a-z]$/i.test(lead) && !/[.!?]$/.test(lead)) {
      lead = `${lead.replace(/[,:;–—-]\s*$/, "")}.`;
    }
  }

  const pageBlock =
    pages.length > 0
      ? pages.map((p) => `• ${p.path} — ${p.label}`).join("\n")
      : "• (no HTML pages found)";

  const modelLabel = input.model.replace(/^deepseek-/, "");
  const meta = `${pages.length} page${pages.length === 1 ? "" : "s"} · ${modelLabel}`;

  const chatContent = `${lead}\n\n${pageBlock}\n\n${meta}`;
  const summary = clipAtSentence(
    [lead, pages.map((p) => p.path).join(", ")].filter(Boolean).join(" · "),
    240,
  );

  return { summary, chatContent };
}
