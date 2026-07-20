"use client"

import { useRef, useEffect, useState, useCallback } from "react"

interface SplitLayoutProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultLeftSize?: number
  leftCollapsed?: boolean
  onLeftCollapsedChange?: (collapsed: boolean) => void
  /** Which panel fills the screen on mobile/tablet (< lg). Desktop always shows both. */
  mobileView?: "left" | "right"
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])
  return matches
}

export default function SplitLayout({
  leftPanel,
  rightPanel,
  defaultLeftSize = 48,
  leftCollapsed = false,
  mobileView = "left",
}: SplitLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftPercent, setLeftPercent] = useState(defaultLeftSize)
  const [isDragging, setIsDragging] = useState(false)
  const previousPercentRef = useRef(defaultLeftSize)

  // Clear stale localStorage
  useEffect(() => {
    try { localStorage.removeItem("builder-split") } catch {}
  }, [])

  // Handle collapse/expand
  useEffect(() => {
    if (leftCollapsed) {
      previousPercentRef.current = leftPercent
      setLeftPercent(3)
    } else if (previousPercentRef.current !== leftPercent && leftPercent < 5) {
      setLeftPercent(previousPercentRef.current)
    }
    // Only fire on collapse change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftCollapsed])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const initialPercent = ((e.clientX - rect.left) / rect.width) * 100

    // Prevent iframe from capturing mouse events during drag
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    const iframes = document.querySelectorAll("iframe")
    iframes.forEach((f) => { (f as HTMLElement).style.pointerEvents = "none" })

    const handleMove = (ev: MouseEvent) => {
      const x = ev.clientX - rect.left
      const percent = Math.max(3, Math.min(80, (x / rect.width) * 100))
      setLeftPercent(percent)
    }

    const handleUp = () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      iframes.forEach((f) => { (f as HTMLElement).style.pointerEvents = "" })
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    setIsDragging(true)
  }, [])

  // Mobile/tablet: one full-width panel at a time. Both stay mounted
  // (CSS-hidden) so chat state and streaming survive view switches.
  if (!isDesktop) {
    return (
      <div ref={containerRef} className="flex h-full">
        <div className={`h-full w-full overflow-hidden ${mobileView === "left" ? "flex" : "hidden"}`}>
          {leftPanel}
        </div>
        <div className={`h-full w-full overflow-hidden ${mobileView === "right" ? "flex" : "hidden"}`}>
          {rightPanel}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex h-full">
      <div
        className="h-full overflow-hidden flex-shrink-0"
        style={{ width: `${leftPercent}%` }}
      >
        {leftPanel}
      </div>

      <div
        onMouseDown={handleDragStart}
        className="relative w-2 bg-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors cursor-col-resize shrink-0 group z-10"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-[var(--border)] group-hover:bg-[var(--accent)]/50 group-active:bg-[var(--accent)] transition-colors" />
      </div>

      <div className="h-full overflow-hidden flex-1 min-w-0">
        {rightPanel}
      </div>
    </div>
  )
}
