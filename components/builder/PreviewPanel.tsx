"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PreviewToolbar, { type PreviewMode, type DeviceSize } from "./PreviewToolbar"
import CodeView from "./CodeView"
import { RotateCcw, RefreshCw, X } from "lucide-react"

const DEMO_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Site</title><script src="https://cdn.tailwindcss.com"><\\/script><style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#fdf5f2 0%,#fefefe 50%,#fcfbfa 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;}</style></head><body><div style="text-align:center;padding:2rem;"><div style="display:inline-flex;align-items:center;gap:.5rem;background:#fde6de;padding:.375rem 1rem;border-radius:9999px;font-size:.75rem;font-weight:500;color:#d97759;margin-bottom:1.5rem;"><span style="width:.375rem;height:.375rem;background:#d97759;border-radius:50%;animation:pulse 2s infinite;"></span>Ready to build</div><h1 style="font-size:3rem;font-weight:700;color:#0a0a0a;margin-bottom:1rem;">Describe your site</h1><p style="font-size:1.25rem;color:#6b6b6b;max-width:36rem;margin:0 auto;">Type what you want in the chat panel and watch this preview update in real-time.</p></div></body></html>`

const SELECTOR_SCRIPT = `
(function() {
  if (window.__wpsSelectorActive) return;
  window.__wpsSelectorActive = true;

  var style = document.createElement('style');
  style.id = 'wps-selector-style';
  style.textContent = 'html.wps-selecting *:hover{outline:2px solid #d97759!important;outline-offset:2px;background-color:rgba(217,119,89,0.08)!important}';
  document.head.appendChild(style);
  document.documentElement.classList.add('wps-selecting');

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el === document.body) return 'body';
    var path = [];
    var cur = el;
    while (cur && cur !== document.body) {
      var tag = cur.tagName.toLowerCase();
      if (cur.id) { path.unshift('#' + cur.id); break; }
      var parent = cur.parentElement;
      if (parent) {
        var sibs = Array.from(parent.children).filter(function(c){return c.tagName===cur.tagName});
        if (sibs.length > 1) tag += ':nth-of-type(' + (sibs.indexOf(cur) + 1) + ')';
      }
      path.unshift(tag);
      cur = parent;
    }
    return path.join(' > ');
  }

  function onClick(e) {
    if (!e.target || e.target === document.body || e.target === document.documentElement) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    var r = el.getBoundingClientRect();
    window.parent.postMessage({type:'wps-element-selected',data:{
      selector:getSelector(el),
      tagName:el.tagName.toLowerCase(),
      className:el.className||'',
      id:el.id||'',
      text:(el.textContent||'').trim().substring(0,150),
      html:(el.outerHTML||'').substring(0,800),
      rect:{top:r.top,left:r.left,width:r.width,height:r.height}
    }},'*');
  }

  document.addEventListener('click', onClick, true);

  window.__wpsSelectorCleanup = function() {
    document.removeEventListener('click', onClick, true);
    var s = document.getElementById('wps-selector-style');
    if (s) s.remove();
    document.documentElement.classList.remove('wps-selecting');
    window.__wpsSelectorActive = false;
  };
})();
`

export interface SelectedElement {
  selector: string
  tagName: string
  className: string
  id: string
  text: string
  html: string
  rect: { top: number; left: number; width: number; height: number }
}

interface PreviewPanelProps {
  previewHtml: string
  onHtmlReset: () => void
  onElementSelected: (el: SelectedElement | null) => void
  selectedElement: SelectedElement | null
  siteSlug: string
  onBackToChat?: () => void
}

export default function PreviewPanel({ previewHtml, onHtmlReset, onElementSelected, selectedElement, siteSlug, onBackToChat }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>("preview")
  const [sandboxHtml, setSandboxHtml] = useState<string | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [loadingSandbox, setLoadingSandbox] = useState(true)
  const [selectorActive, setSelectorActive] = useState(false)
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch(`/api/preview?site=${siteSlug}`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => setSandboxHtml(html))
      .catch(() => setSandboxHtml(null))
      .finally(() => setLoadingSandbox(false))
  }, [])

  const displayHtml = previewHtml || sandboxHtml || DEMO_HTML
  const hasGenerated = !!(previewHtml || sandboxHtml)

  // Inject selector script when mode is active
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !hasGenerated) return

    let cancelled = false

    const inject = (): boolean => {
      if (cancelled) return true // stop retrying
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc || !doc.body) return false // body not parsed yet
        if (selectorActive) {
          const script = doc.createElement("script")
          script.textContent = SELECTOR_SCRIPT
          doc.body.appendChild(script)
        } else {
          const win = iframe.contentWindow as (Window & { __wpsSelectorCleanup?: () => void }) | null
          win?.__wpsSelectorCleanup?.()
        }
        return true
      } catch {
        return false
      }
    }

    let attempts = 0
    const tryInject = () => {
      if (cancelled || inject() || ++attempts > 30) return
      setTimeout(tryInject, 200)
    }
    setTimeout(tryInject, 100)

    return () => { cancelled = true }
  }, [selectorActive, hasGenerated, displayHtml, iframeKey])

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "wps-element-selected") {
        onElementSelected(e.data.data)
        setSelectorActive(false)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [onElementSelected])

  const handleRefresh = () => {
    setLoadingSandbox(true)
    setIframeKey((k) => k + 1)
    fetch(`/api/preview?site=${siteSlug}`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => { setSandboxHtml(html); setIframeKey((k) => k + 1) })
      .catch(() => {})
      .finally(() => setLoadingSandbox(false))
  }

  const deviceClasses = deviceSize === "mobile"
    ? "max-w-[375px]"
    : deviceSize === "tablet"
    ? "max-w-[768px]"
    : ""

  return (
    <div className="flex h-full flex-col bg-white">
      <PreviewToolbar
        mode={mode}
        onModeChange={setMode}
        hasGeneratedHtml={hasGenerated}
        selectorActive={selectorActive}
        onToggleSelector={() => setSelectorActive((p) => !p)}
        deviceSize={deviceSize}
        onDeviceSizeChange={setDeviceSize}
        onBackToChat={onBackToChat}
      />
      <div className="flex-1 overflow-hidden relative">
        {mode === "preview" && (
          <>
            <div className="h-full overflow-auto flex justify-center bg-gray-100">
              <div className={`h-full w-full transition-all duration-300 ${deviceClasses} ${deviceSize !== "desktop" ? "border-x border-gray-200 shadow-lg rounded-t-lg overflow-hidden" : ""}`}>
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  srcDoc={displayHtml}
                  className="w-full h-full border-0"
                  title="Site Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
            {selectorActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10">
                <div className="bg-white rounded-xl shadow-lg px-3 sm:px-4 py-2 pointer-events-auto flex flex-wrap items-center justify-center gap-2 mx-3 sm:mx-4 max-w-full">
                  <MousePointerIcon />
                  <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] text-center">Click any element to select it for editing</span>
                  <button onClick={() => setSelectorActive(false)} className="ml-1 p-1 rounded hover:bg-gray-100">
                    <X className="size-3.5 sm:size-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1">
              {hasGenerated && (
                <button onClick={handleRefresh} disabled={loadingSandbox}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/90 border border-[var(--border)] shadow-sm hover:bg-white text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                  title="Refresh preview">
                  <RefreshCw className={`size-3 sm:size-3.5 ${loadingSandbox ? "animate-spin" : ""}`} />
                </button>
              )}
              {hasGenerated && (
                <button onClick={onHtmlReset}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/90 border border-[var(--border)] shadow-sm hover:bg-white text-[var(--text-tertiary)] hover:text-red-600 transition-colors"
                  title="Reset preview">
                  <RotateCcw className="size-3 sm:size-3.5" />
                </button>
              )}
            </div>
          </>
        )}
        {mode === "code" && <CodeView />}
        {mode === "publish" && (
          <div className="flex items-center justify-center h-full p-4 sm:p-8">
            <div className="max-w-md w-full text-center">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Publish</h3>
              <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mb-4">Your site is saved to the sandbox. Publishing coming soon.</p>
              <button onClick={handleRefresh} disabled={loadingSandbox}
                className="px-4 sm:px-6 py-2 rounded-full bg-[var(--accent)] text-white text-xs sm:text-sm font-medium hover:bg-[var(--accent-focus)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
                <RefreshCw className={`size-3 sm:size-3.5 ${loadingSandbox ? "animate-spin" : ""}`} />
                Refresh Sandbox
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MousePointerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      <path d="m13 13 6 6"/>
    </svg>
  )
}
