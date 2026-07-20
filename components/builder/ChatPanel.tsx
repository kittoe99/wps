"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowDown, Eye, PanelLeftClose, PanelLeftOpen, RotateCcw, Sparkles, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import MessageList from "./MessageList"
import ChatInput from "./ChatInput"
import { DEEPSEEK_MODELS, type DeepSeekModelKey } from "@/lib/deepseek"
import type { SelectedElement } from "./PreviewPanel"

function storageKey(slug: string) { return `wps-chat-${slug}` }
function loadMessages(slug: string): ChatMessageType[] | null {
  try {
    const r = localStorage.getItem(storageKey(slug))
    if (!r) return null
    const parsed = JSON.parse(r)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].role) return parsed
    return null
  } catch { return null }
}
function saveMessages(slug: string, msgs: ChatMessageType[]) {
  try { localStorage.setItem(storageKey(slug), JSON.stringify(msgs)) } catch {}
}

interface ChatPanelProps {
  isPreviewOpen: boolean; onTogglePreview: () => void
  onToggleChatCollapse: () => void; isChatCollapsed: boolean
  onHtmlGenerated: (html: string) => void
  selectedElement: SelectedElement | null; onClearSelection: () => void
  siteSlug: string
}

export interface ChatMessageType {
  id: string; role: "user" | "assistant"; content: string; timestamp: number
}

const WELCOME: ChatMessageType = { id: "welcome", role: "assistant", content: "Hi! I'm your AI website builder. Describe what you want to build and I'll generate it for you.", timestamp: Date.now() }

const SUGGESTIONS = ["Build a modern SaaS landing page","Create a restaurant website","Design a dark-mode portfolio","Make a blog with newsletter"]

export default function ChatPanel(props: ChatPanelProps) {
  const { isPreviewOpen, onTogglePreview, onToggleChatCollapse, isChatCollapsed, onHtmlGenerated, selectedElement, onClearSelection, siteSlug } = props

  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    const saved = loadMessages(siteSlug); return saved?.length ? saved : [WELCOME]
  })
  const [isStreaming, setIsStreaming] = useState(false)
  const [showScroll, setShowScroll] = useState(false)
  const [model, setModel] = useState<DeepSeekModelKey>("deepseek-v4-pro")
  const [showPicker, setShowPicker] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

  const scrollBottom = useCallback((b: ScrollBehavior = "smooth") => endRef.current?.scrollIntoView({ behavior: b }), [])

  useEffect(() => { saveMessages(siteSlug, messages.filter(m => m.id !== "welcome")) }, [messages, siteSlug])

  useEffect(() => {
    const c = containerRef.current; if (!c) return
    const onScroll = () => { const d = c.scrollHeight - c.scrollTop - c.clientHeight; atBottomRef.current = d <= 80; setShowScroll(!atBottomRef.current) }
    c.addEventListener("scroll", onScroll, { passive: true }); return () => c.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!atBottomRef.current) return
    // Coalesce rapid stream updates into one scroll per frame (prevents flicker)
    const id = requestAnimationFrame(() => scrollBottom("instant"))
    return () => cancelAnimationFrame(id)
  }, [messages, scrollBottom])

  const stop = useCallback(() => { abortRef.current?.abort(); abortRef.current = null }, [])

  const handleSend = useCallback(async (content: string) => {
    let msg = content
    if (selectedElement) msg = `Edit this element: ${selectedElement.selector}\nCurrent HTML:\n\`\`\`html\n${selectedElement.html}\n\`\`\`\n\nRequest: ${content}`

    const userMsg: ChatMessageType = { id: `u-${Date.now()}`, role: "user", content: msg, timestamp: Date.now() }
    const asstId = `a-${Date.now()}`
    const asstMsg: ChatMessageType = { id: asstId, role: "assistant", content: "", timestamp: Date.now() }
    setMessages(p => [...p, userMsg, asstMsg])
    atBottomRef.current = true; setIsStreaming(true)

    const history = messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content }))
    abortRef.current = new AbortController()
    let full = ""

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, message: msg, history, siteSlug }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed") }

      const reader = res.body?.getReader(); if (!reader) throw new Error("No stream")
      const decoder = new TextDecoder(); let buf = ""

      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n"); buf = lines.pop() || ""

        for (const line of lines) {
          const t = line.trim(); if (!t.startsWith("data: ")) continue
          const d = t.slice(6)

          // Check for done event
          if (d.startsWith("{")) {
            try {
              const p = JSON.parse(d)
              if (p.html) { onHtmlGenerated(p.html); continue }
              if (p.error) throw new Error(p.error)
            } catch (e) { if (e instanceof Error && e.message !== "Failed") throw e }
          }

          // DeepSeek chunk
          try {
            const p = JSON.parse(d)
            const delta = p.choices?.[0]?.delta?.content
            if (delta) { full += delta; setMessages(p => p.map(m => m.id === asstId ? { ...m, content: full } : m)) }
          } catch {}
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setMessages(p => p.map(m => m.id === asstId && !m.content ? { ...m, content: `**Error:** ${err instanceof Error ? err.message : "Failed"}. Try again.` } : m))
    } finally {
      setIsStreaming(false); abortRef.current = null
    }
  }, [messages, model, onHtmlGenerated, selectedElement, siteSlug])

  const handleClear = useCallback(() => { stop(); setIsStreaming(false); setMessages([WELCOME]); try { localStorage.removeItem(storageKey(siteSlug)) } catch {} }, [stop, siteSlug])

  return (
    <div className="flex h-full flex-col bg-[var(--panel)] relative">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="size-4 sm:size-5 rounded-md bg-[var(--accent)]/10 flex items-center justify-center">
              <Sparkles className="size-2.5 sm:size-3 text-[var(--accent)]"/>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Builder</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[0.55rem] sm:text-[0.65rem] font-medium bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors">{DEEPSEEK_MODELS[model].name}<ChevronDown className="size-2 sm:size-2.5"/></button>
            {showPicker && <><div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)}/><div className="absolute top-full left-0 mt-1 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-[var(--border)] shadow-lg z-20 py-1">{Object.entries(DEEPSEEK_MODELS).map(([k,m]) => (<button key={k} onClick={() => { setModel(k as DeepSeekModelKey); setShowPicker(false) }} className={`w-full text-left px-3 py-2 text-sm transition-colors ${model===k?"bg-[var(--accent-subtle)] text-[var(--accent)]":"text-[var(--text-secondary)] hover:bg-[var(--panel-hover)]"}`}><div className="font-medium">{m.name}</div><div className="text-[0.65rem] text-[var(--text-tertiary)] mt-0.5">{m.description}</div></button>))}</div></>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button onClick={handleClear} title="Clear chat" className="p-1.5 sm:p-2 lg:p-1.5 rounded-md hover:bg-[var(--panel-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><RotateCcw className="size-3.5 sm:size-4 lg:size-3.5"/></button>
          <button onClick={onTogglePreview} title="Toggle preview" className="p-1.5 sm:p-2 lg:p-1.5 rounded-md hover:bg-[var(--panel-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">{isPreviewOpen?<PanelLeftOpen className="size-3.5 sm:size-4"/>:<Eye className="size-3.5 sm:size-4"/>}<span className="text-[0.6rem] sm:text-xs font-medium lg:hidden">Preview</span></button>
          <button onClick={onToggleChatCollapse} title="Collapse chat" className="hidden lg:block p-1.5 rounded-md hover:bg-[var(--panel-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><PanelLeftClose className="size-4"/></button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isStreaming={isStreaming} />
        {messages.length <= 1 && <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-2"><p className="text-xs text-[var(--text-tertiary)] px-2 mb-3">Try asking me to:</p>{SUGGESTIONS.map(s=>(<button key={s} onClick={() => handleSend(s)} disabled={isStreaming} className="block w-full text-left px-3 py-2 sm:py-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent-subtle)] text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">{s}</button>))}</div>}
        <div ref={endRef}/>
      </div>

      <AnimatePresence>{showScroll && <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}} className="absolute bottom-[3.5rem] sm:bottom-[4.5rem] left-1/2 -translate-x-1/2 z-10"><button onClick={()=>{atBottomRef.current=true;setShowScroll(false);scrollBottom()}} className="rounded-full shadow-lg border border-[var(--border)] bg-white p-1.5 sm:p-2 hover:shadow-xl transition-all"><ArrowDown className="size-3.5 sm:size-4 text-[var(--text-secondary)]"/></button></motion.div>}</AnimatePresence>

      <ChatInput onSend={handleSend} isStreaming={isStreaming} onStop={stop} selectedElement={selectedElement} onClearSelection={onClearSelection}/>
    </div>
  )
}
