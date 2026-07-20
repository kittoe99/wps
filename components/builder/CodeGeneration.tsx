"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, ChevronDown, FileCode2, LayoutGrid, Sparkles } from "lucide-react"

/** Throttle a fast-changing value to at most one update per `interval` ms —
 *  keeps expensive renders (blur filters) from repainting on every token. */
function useThrottled<T>(value: T, interval = 200): T {
  const [display, setDisplay] = useState(value)
  const lastRef = useRef(0)
  useEffect(() => {
    const remaining = Math.max(0, interval - (Date.now() - lastRef.current))
    const t = setTimeout(() => {
      lastRef.current = Date.now()
      setDisplay(value)
    }, remaining)
    return () => clearTimeout(t)
  }, [value, interval])
  return display
}

export interface ContentSegment {
  type: "text" | "code"
  content: string
  closed: boolean
  lang: string
}

/** Split a message into text and fenced-code segments. A trailing unclosed
 *  fence (mid-stream) becomes a code segment with closed=false. */
export function parseSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let rest = content
  while (rest) {
    const start = rest.indexOf("```")
    if (start === -1) {
      segments.push({ type: "text", content: rest, closed: true, lang: "" })
      break
    }
    if (start > 0) {
      segments.push({ type: "text", content: rest.slice(0, start), closed: true, lang: "" })
    }
    let body = rest.slice(start + 3)
    const langMatch = body.match(/^([a-zA-Z0-9-]*)\n?/)
    const lang = langMatch?.[1] || ""
    body = body.slice(langMatch?.[0].length ?? 0)
    const end = body.indexOf("```")
    if (end === -1) {
      segments.push({ type: "code", content: body, closed: false, lang })
      break
    }
    segments.push({ type: "code", content: body.slice(0, end), closed: true, lang })
    rest = body.slice(end + 3)
  }
  return segments.filter((s) => s.content.trim().length > 0)
}

export function isHtmlDoc(code: string): boolean {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(code)
}

/** Small live container shown while code is being generated — the incoming
 *  code streams through a beautifully blurred, shimmer-swept window. */
export function StreamingCodePreview({ code }: { code: string }) {
  const smooth = useThrottled(code, 200)
  const lineCount = code.split("\n").length
  const tail = smooth.split("\n").slice(-14).join("\n")
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
        </span>
        <span className="text-[0.65rem] font-medium text-[var(--text-secondary)]">Generating code…</span>
        <span className="ml-auto font-mono text-[0.6rem] text-[var(--text-tertiary)]">{lineCount} lines</span>
      </div>
      <div className="relative h-36 overflow-hidden bg-[var(--panel)]">
        <pre className="whitespace-pre-wrap break-all p-3 font-mono text-[0.65rem] leading-relaxed text-[var(--text-primary)]">
          {tail}
        </pre>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[var(--panel)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--panel)] to-transparent" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-shimmer h-full w-1/2 bg-gradient-to-r from-transparent via-black/4 to-transparent" />
        </div>
      </div>
    </div>
  )
}

/** Completed code output, collapsed by default and expandable on click. */
export function CodeBlockCard({ code, lang }: { code: string; lang?: string }) {
  const [open, setOpen] = useState(false)
  const lineCount = code.split("\n").length
  const label = isHtmlDoc(code) ? "index.html" : lang ? `snippet.${lang}` : "code snippet"
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--panel-hover)]"
      >
        <FileCode2 className="size-3.5 shrink-0 text-[var(--accent)]" />
        <span className="font-mono text-xs font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-[0.65rem] text-[var(--text-tertiary)]">{lineCount} lines</span>
        <ChevronDown
          className={`ml-auto size-3 shrink-0 text-[var(--text-tertiary)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="max-h-72 overflow-auto border-t border-[var(--border)] bg-[#0d1117]">
          <pre className="whitespace-pre-wrap break-all p-3 font-mono text-[0.65rem] leading-relaxed text-gray-300">
            {code}
          </pre>
        </div>
      )}
    </div>
  )
}

interface CodeSummary {
  lines: number
  pages: string[]
  features: string[]
}

export function summarizeCode(code: string): CodeSummary | null {
  if (!isHtmlDoc(code)) return null
  const lines = code.split("\n").length
  const pages = new Set<string>()
  for (const m of code.matchAll(/<section[^>]*\sid=["']([^"']+)["']/gi)) pages.add(m[1])
  if (pages.size === 0) {
    for (const m of code.matchAll(/href=["']#([a-zA-Z0-9-]+)["']/gi)) pages.add(m[1])
  }
  const features: string[] = []
  if (/<nav[\s>]/i.test(code)) features.push("Navigation")
  if (/<form[\s>]/i.test(code)) features.push("Contact form")
  if (/tailwindcss/i.test(code)) features.push("Tailwind CSS")
  if (/name=["']viewport["']/i.test(code)) features.push("Responsive")
  if (/<script[\s>]/i.test(code)) features.push("Interactive JS")
  return { lines, pages: [...pages].slice(0, 8), features }
}

/** Post-generation recap of what was done and which files were generated. */
export function GenerationSummary({ code }: { code: string }) {
  const summary = useMemo(() => summarizeCode(code), [code])
  if (!summary) return null
  return (
    <div className="mt-2 rounded-lg border border-green-200 bg-green-50/70 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="size-3.5" />
        Generation complete
      </div>
      <div className="mt-1.5 space-y-1 text-[0.7rem] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="size-3 shrink-0 text-[var(--text-tertiary)]" />
          <span>
            File generated:{" "}
            <code className="rounded bg-white px-1 font-mono text-[0.65rem]">index.html</code> ·{" "}
            {summary.lines} lines
          </span>
        </div>
        {summary.pages.length > 0 && (
          <div className="flex items-start gap-1.5">
            <LayoutGrid className="mt-0.5 size-3 shrink-0 text-[var(--text-tertiary)]" />
            <span>Pages: {summary.pages.join(", ")}</span>
          </div>
        )}
        {summary.features.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Sparkles className="mt-0.5 size-3 shrink-0 text-[var(--text-tertiary)]" />
            <span>{summary.features.join(" · ")}</span>
          </div>
        )}
      </div>
    </div>
  )
}
