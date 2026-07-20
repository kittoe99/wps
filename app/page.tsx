"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SplitLayout from "@/components/builder/SplitLayout"
import ChatPanel from "@/components/builder/ChatPanel"
import PreviewPanel, { type SelectedElement } from "@/components/builder/PreviewPanel"
import { Loader2, LogOut, User, Plus, ChevronDown, Globe } from "lucide-react"

const CURRENT_SITE_KEY = "wps-current-site"

interface SiteInfo {
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

interface ApiSite {
  slug: string
  title?: string | null
  businessName?: string | null
  createdAt: string
  updatedAt: string
}

function mapSite(s: ApiSite): SiteInfo {
  return {
    name: s.businessName || s.title || s.slug,
    slug: s.slug,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function BuilderPage() {
  const router = useRouter()
  const [isPreviewOpen, setIsPreviewOpen] = useState(true)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [previewHtml, setPreviewHtmlState] = useState("")
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sites, setSites] = useState<SiteInfo[]>([])
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null)
  const [showSitePicker, setShowSitePicker] = useState(false)
  const [showNewSite, setShowNewSite] = useState(false)
  const [newSiteName, setNewSiteName] = useState("")
  const [creating, setCreating] = useState(false)

  // Load sites
  const loadSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites")
      if (res.ok) {
        const data = await res.json()
        const list = (data.sites || []).map(mapSite)
        setSites(list)
        return list
      }
    } catch {}
    return []
  }, [])

  // Restore or create current site
  useEffect(() => {
    const init = async () => {
      const sitesList = await loadSites()
      const saved = typeof window !== "undefined" ? localStorage.getItem(CURRENT_SITE_KEY) : null

      if (saved) {
        const found = sitesList.find((s: SiteInfo) => s.slug === saved)
        if (found) {
          setCurrentSite(found)
          // Load preview for this site
          fetch(`/api/session?site=${found.slug}`)
            .then((r) => r.json())
            .then((d) => { if (d.previewHtml) setPreviewHtmlState(d.previewHtml) })
            .catch(() => {})
          return
        }
      }

      if (sitesList.length > 0) {
        setCurrentSite(sitesList[0])
        localStorage.setItem(CURRENT_SITE_KEY, sitesList[0].slug)
        fetch(`/api/session?site=${sitesList[0].slug}`)
          .then((r) => r.json())
          .then((d) => { if (d.previewHtml) setPreviewHtmlState(d.previewHtml) })
          .catch(() => {})
      }
    }
    init()
  }, [loadSites])

  const setPreviewHtml = useCallback((html: string) => {
    setPreviewHtmlState(html)
  }, [])

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (!d.user) router.replace("/login"); else setUser(d.user) })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const switchSite = async (site: SiteInfo) => {
    setCurrentSite(site)
    setShowSitePicker(false)
    localStorage.setItem(CURRENT_SITE_KEY, site.slug)
    setPreviewHtmlState("")

    // Load site preview
    fetch(`/api/session?site=${site.slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.previewHtml) setPreviewHtmlState(d.previewHtml) })
      .catch(() => {})
  }

  const createSite = async () => {
    if (!newSiteName.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugify(newSiteName.trim()), title: newSiteName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const data = await res.json()
      const newSite = mapSite(data.site)
      setSites((prev) => [newSite, ...prev])
      setNewSiteName("")
      setShowNewSite(false)
      await switchSite(newSite)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create site")
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" })
    try { localStorage.clear() } catch {}
    router.replace("/login")
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#fcfbfa]"><Loader2 className="size-6 animate-spin text-[var(--accent)]" /></div>
  }
  if (!user) return null

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b border-[var(--border)] bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="size-5 sm:size-6 rounded-md bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
            <span className="text-[0.6rem] sm:text-xs font-bold text-[var(--accent)]">W</span>
          </div>

          {/* Site selector */}
          <div className="relative min-w-0 flex-1">
            <button
              onClick={() => setShowSitePicker(!showSitePicker)}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md hover:bg-[var(--panel-hover)] transition-colors max-w-full"
            >
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                {currentSite?.name || "No site"}
              </span>
              <ChevronDown className="size-2.5 sm:size-3 text-[var(--text-tertiary)] shrink-0" />
            </button>

            {showSitePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSitePicker(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-lg border border-[var(--border)] shadow-lg z-20 py-1">
                  <div className="px-3 py-1.5 text-[0.65rem] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Your Sites
                  </div>
                  {sites.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => switchSite(s)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                        currentSite?.slug === s.slug
                          ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--panel-hover)]"
                      }`}
                    >
                      <Globe className="size-3.5 shrink-0" />
                      <span className="truncate">{s.name}</span>
                      {currentSite?.slug === s.slug && (
                        <span className="ml-auto text-[0.6rem] text-[var(--accent)]">active</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-[var(--border)] mt-1 pt-1">
                    {showNewSite ? (
                      <div className="px-3 py-2 flex gap-2">
                        <input
                          autoFocus
                          value={newSiteName}
                          onChange={(e) => setNewSiteName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") createSite(); if (e.key === "Escape") setShowNewSite(false) }}
                          placeholder="Site name..."
                          className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={createSite}
                          disabled={!newSiteName.trim() || creating}
                          className="px-2 py-1 text-xs font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-focus)] disabled:opacity-50 transition-colors"
                        >
                          {creating ? <Loader2 className="size-3 animate-spin" /> : "Create"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewSite(true)}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors flex items-center gap-2"
                      >
                        <Plus className="size-3.5" />
                        New Site
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {previewHtml && (
            <span className="text-[0.55rem] sm:text-[0.6rem] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium shrink-0">Live</span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="size-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <User className="size-3 text-[var(--accent)]" />
            </div>
            <span className="hidden md:inline">{user.name || user.email}</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 sm:p-2 lg:p-1.5 rounded-md hover:bg-red-50 text-[var(--text-tertiary)] hover:text-red-600 transition-colors">
            <LogOut className="size-3.5 sm:size-4 lg:size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <SplitLayout
          leftPanel={
            <ChatPanel
              key={currentSite?.slug || "default"}
              isPreviewOpen={isPreviewOpen}
              onTogglePreview={() => setIsPreviewOpen((p) => !p)}
              onToggleChatCollapse={() => setIsChatCollapsed((p) => !p)}
              isChatCollapsed={isChatCollapsed}
              onHtmlGenerated={setPreviewHtml}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
              siteSlug={currentSite?.slug || "default"}
            />
          }
          rightPanel={
            <PreviewPanel
              previewHtml={previewHtml}
              onHtmlReset={() => setPreviewHtmlState("")}
              onElementSelected={setSelectedElement}
              selectedElement={selectedElement}
              siteSlug={currentSite?.slug || "default"}
              onBackToChat={() => setIsPreviewOpen(false)}
            />
          }
          leftCollapsed={isChatCollapsed}
          mobileView={isPreviewOpen ? "right" : "left"}
        />
      </div>
    </div>
  )
}
