"use client"

import { Code2, Eye, Globe, MousePointer2, Monitor, Tablet, Smartphone, MessageSquare } from "lucide-react"

export type PreviewMode = "preview" | "code" | "publish"
export type DeviceSize = "desktop" | "tablet" | "mobile"

interface PreviewToolbarProps {
  mode: PreviewMode
  onModeChange: (mode: PreviewMode) => void
  hasGeneratedHtml?: boolean
  selectorActive: boolean
  onToggleSelector: () => void
  deviceSize: DeviceSize
  onDeviceSizeChange: (size: DeviceSize) => void
  /** Shown only on mobile/tablet to switch back to the chat view */
  onBackToChat?: () => void
}

const modes: { id: PreviewMode; label: string; icon: React.ReactNode }[] = [
  { id: "preview", label: "Preview", icon: <Eye className="size-3 sm:size-3.5" /> },
  { id: "code", label: "Code", icon: <Code2 className="size-3 sm:size-3.5" /> },
  { id: "publish", label: "Publish", icon: <Globe className="size-3 sm:size-3.5" /> },
]

const devices: { id: DeviceSize; label: string; icon: React.ReactNode }[] = [
  { id: "desktop", label: "Desktop", icon: <Monitor className="size-3 sm:size-3.5" /> },
  { id: "tablet", label: "Tablet", icon: <Tablet className="size-3 sm:size-3.5" /> },
  { id: "mobile", label: "Mobile", icon: <Smartphone className="size-3 sm:size-3.5" /> },
]

export default function PreviewToolbar({
  mode, onModeChange, hasGeneratedHtml, selectorActive, onToggleSelector,
  deviceSize, onDeviceSizeChange, onBackToChat,
}: PreviewToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-[var(--border)] bg-[var(--panel)] shrink-0 overflow-x-auto">
      {onBackToChat && (
        <button
          onClick={onBackToChat}
          className="flex lg:hidden items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)] transition-colors shrink-0"
        >
          <MessageSquare className="size-3.5" />
          <span className="hidden min-[400px]:inline">Chat</span>
        </button>
      )}

      <div className="hidden md:flex items-center gap-1.5 mr-3" aria-hidden>
        <span className="size-2.5 rounded-full bg-red-400/60" />
        <span className="size-2.5 rounded-full bg-amber-400/60" />
        <span className="size-2.5 rounded-full bg-green-400/60" />
      </div>

      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          title={m.label}
          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 min-[480px]:px-3 py-1 rounded-md text-[0.65rem] sm:text-xs font-medium transition-colors whitespace-nowrap ${
            mode === m.id
              ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)]"
          }`}
        >
          {m.icon}
          <span className="hidden min-[480px]:inline">{m.label}</span>
        </button>
      ))}

      <div className="flex-1 mx-1 sm:mx-2 md:mx-3 min-w-0">
        <div className="hidden md:flex items-center gap-1.5 bg-white rounded-full border border-[var(--border)] px-3 py-1">
          <Globe className="size-3 text-[var(--text-tertiary)] shrink-0" />
          <span className="text-xs text-[var(--text-tertiary)] truncate">
            {hasGeneratedHtml ? "your-site.localhost" : "ready to build"}
          </span>
        </div>
      </div>

      {/* Device size toggle */}
      {hasGeneratedHtml && (
        <div className="flex items-center bg-[var(--panel-hover)] rounded-md p-0.5 shrink-0">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => onDeviceSizeChange(d.id)}
              className={`p-1 sm:p-1.5 rounded transition-colors ${
                deviceSize === d.id
                  ? "bg-white text-[var(--accent)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
              title={d.label}
            >
              {d.icon}
            </button>
          ))}
        </div>
      )}

      {hasGeneratedHtml && (
        <button
          onClick={onToggleSelector}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[0.65rem] sm:text-xs font-medium transition-colors whitespace-nowrap ${
            selectorActive
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
          }`}
          title={selectorActive ? "Exit selection mode" : "Select element to edit"}
        >
          <MousePointer2 className="size-3 sm:size-3.5" />
          <span className="hidden sm:inline">Select</span>
        </button>
      )}
    </div>
  )
}
