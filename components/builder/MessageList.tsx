"use client"

import { useMemo } from "react"
import { ChatMessageType } from "./ChatPanel"
import {
  CodeBlockCard,
  GenerationSummary,
  StreamingCodePreview,
  isHtmlDoc,
  parseSegments,
} from "./CodeGeneration"

export default function MessageList({ messages, isStreaming }: { messages: ChatMessageType[]; isStreaming: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-3 sm:px-4 py-4">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1
        const isAssistant = msg.role === "assistant"
        const isEmpty = !msg.content
        const isLastStreaming = isLast && isStreaming && isAssistant

        return (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-[var(--accent)] text-white rounded-br-md" : "bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"}`}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm break-words">{safeText(msg.content)}</p>
              ) : isLastStreaming && isEmpty ? (
                <StreamingDots />
              ) : (
                <AssistantContent content={msg.content} streaming={isLastStreaming} />
              )}
              {isLastStreaming && !isEmpty && <StreamingDots small />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AssistantContent({ content, streaming }: { content: string; streaming: boolean }) {
  const segments = useMemo(() => parseSegments(content), [content])
  const summaryCode = useMemo(() => {
    if (streaming) return null
    const seg = segments.find((s) => s.type === "code" && isHtmlDoc(s.content))
    return seg ? seg.content : null
  }, [segments, streaming])

  return (
    <div className="text-sm leading-relaxed break-words">
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <TextContent key={i} text={seg.content} />
        ) : !seg.closed && streaming ? (
          <StreamingCodePreview key={i} code={seg.content} />
        ) : (
          <CodeBlockCard key={i} code={seg.content} lang={seg.lang} />
        )
      )}
      {summaryCode && <GenerationSummary code={summaryCode} />}
    </div>
  )
}

function TextContent({ text }: { text: string }) {
  const html = useMemo(() => renderContent(text), [text])
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function StreamingDots({ small }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${small ? "mt-2" : "py-1"}`}>
      <span className="size-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="size-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="size-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
      {!small && <span className="text-[0.6rem] text-[var(--text-tertiary)] ml-1">Generating...</span>}
    </div>
  )
}

function safeText(s: string): string {
  if (!s) return ""
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
}

function renderContent(content: string): string {
  if (!content) return ""
  let c = safeText(content)
  // Basic markdown
  c = c.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  c = c.replace(/`([^`]+)`/g, "<code class='bg-gray-100 px-1 rounded text-xs font-mono'>$1</code>")
  c = c.replace(/\n/g, "<br/>")
  return c
}
