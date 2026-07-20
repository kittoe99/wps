"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"

const DEFAULT_CODE = `import React from "react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Build something beautiful
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Your AI-powered website is ready. Edit the code or keep chatting to refine it.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Get Started
        </a>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {["Fast", "Modern", "Reliable"].map((title) => (
            <div key={title} className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 text-center text-sm text-gray-400">
        Built with WPScanvas
      </footer>
    </div>
  )
}
`

const FILES: Record<string, string> = {
  "page.tsx": DEFAULT_CODE,
  "layout.tsx": `import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Site",
  description: "Built with WPScanvas",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
  "globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
}

export default function CodeView() {
  const [activeFile, setActiveFile] = useState("page.tsx")

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="w-48 shrink-0 border-r border-[var(--border)] bg-[var(--panel)] p-3">
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-2">
          Files
        </h3>
        {Object.keys(FILES).map((file) => (
          <button
            key={file}
            onClick={() => setActiveFile(file)}
            className={`
              w-full text-left px-2 py-1.5 rounded-md text-xs font-medium transition-colors
              ${
                activeFile === file
                  ? "bg-white text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)]"
              }
            `}
          >
            {file}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="light"
          value={FILES[activeFile]}
          onChange={() => {}}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 16 },
            tabSize: 2,
            renderLineHighlight: "none",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 8,
            lineNumbersMinChars: 3,
            guides: { indentation: false },
          }}
        />
      </div>
    </div>
  )
}
