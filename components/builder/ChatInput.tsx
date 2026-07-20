"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { X } from "lucide-react"
import type { SelectedElement } from "./PreviewPanel"

interface ChatInputProps {
  onSend: (content: string) => void
  isStreaming: boolean
  onStop: () => void
  selectedElement: SelectedElement | null
  onClearSelection: () => void
}

export default function ChatInput({ onSend, isStreaming, onStop, selectedElement, onClearSelection }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [value])

  const handleSend = () => {
    if (isStreaming) { onStop(); return }
    const t = value.trim(); if (!t) return
    onSend(t); setValue("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--panel)] p-2.5 sm:p-3">
      {selectedElement && (
        <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-[var(--accent-subtle)] rounded-lg border border-[var(--accent)]/20">
          <span className="text-[0.55rem] sm:text-[0.65rem] font-medium text-[var(--accent)] uppercase tracking-wide">Editing: {selectedElement.tagName}{selectedElement.id ? `#${selectedElement.id}` : selectedElement.className ? `.${selectedElement.className.split(" ")[0]}` : ""}</span>
          <span className="text-[0.55rem] sm:text-[0.6rem] text-[var(--text-tertiary)] flex-1 truncate">{selectedElement.text || selectedElement.selector}</span>
          <button onClick={onClearSelection} className="p-0.5 rounded hover:bg-[var(--accent-muted)] text-[var(--accent)] transition-colors shrink-0"><X className="size-3"/></button>
        </div>
      )}
      <div className="flex items-end gap-2 bg-white rounded-xl border border-[var(--border)] focus-within:border-[var(--accent)]/40 focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all px-3 py-2">
        <textarea ref={textareaRef} value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "Generating..." : selectedElement ? "Describe what to change..." : "Describe what you want to build..."}
          rows={1} className="flex-1 resize-none bg-transparent text-[0.875rem] sm:text-[0.9375rem] lg:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none py-1 min-h-[1.5rem] max-h-[200px]"/>
        <button onClick={handleSend}
          className={`shrink-0 p-1.5 sm:p-2 lg:p-1.5 rounded-lg transition-all flex items-center justify-center ${isStreaming ? "bg-red-500 hover:bg-red-600 text-white" : value.trim() ? "bg-[var(--accent)] hover:bg-[var(--accent-focus)] text-white" : "bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed"}`}>
          {isStreaming ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
          )}
        </button>
      </div>
      <p className="text-center text-[0.55rem] sm:text-[0.65rem] text-[var(--text-tertiary)] mt-1 sm:mt-1.5">{selectedElement ? "Agent will edit the selected section" : "Powered by DeepSeek"}</p>
    </div>
  )
}
