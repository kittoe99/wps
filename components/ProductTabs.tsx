"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

type Product = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  visual: "chat" | "seo" | "leads"
}

const seoData = [
  { label: "Roofing repair cost", pct: 94 },
  { label: "Storm damage roofing estimate", pct: 82 },
  { label: "Roof replacement financing", pct: 71 },
  { label: "Commercial roofing contractors", pct: 58 },
]

const leadRows = [
  { source: "Chat — roofing site", score: 92, hot: true },
  { source: "Form — financing quote", score: 78, hot: true },
  { source: "Referral page visit", score: 45, hot: false },
  { source: "SMS nudge opened", score: 33, hot: false },
]

const products: Product[] = [
  {
    id: "chatbot",
    label: "AI Chatbot",
    eyebrow: "Canvas Conversational Engine",
    title: "Answers your buyers like your best rep on their best day.",
    description:
      "Trained on your product specs, sales calls, and support tickets. It qualifies leads 24/7, handles objection-handling logic, and only hands off to a human when the intent signal is hot — with full context attached.",
    bullets: [
      "Deflects 70%+ of routine inquiries without a human in the loop",
      "Objection-handling logic trained on your actual sales transcripts",
      "Full-context escalation that lands straight in your CRM",
    ],
    visual: "chat",
  },
  {
    id: "seo",
    label: "Semantic SEO",
    eyebrow: "Intent-Driven Discovery",
    title: "Rank for what your buyers search — before competitors do.",
    description:
      "We abandoned keyword-density thinking years ago. Topic clusters are built from real buyer-intent search data, and schema, internal linking, and content scaffolding are baked into the architecture — not bolted on post-launch.",
    bullets: [
      "Topic clusters built from real buyer-intent search data",
      "Automated internal linking and dynamic meta-generation",
      "Monthly market-share reporting, not vanity rankings",
    ],
    visual: "seo",
  },
  {
    id: "leads",
    label: "LeadFlow",
    eyebrow: "Lead Management as a Core Feature",
    title: "Every visitor leaves a trail. You read it in one dashboard.",
    description:
      "Behavioral signals — clicks, scroll depth, chat transcripts, form answers — route into your CRM with scoring logic attached. Your sales team only touches leads ready to talk.",
    bullets: [
      "Real-time behavioral capture, not just email addresses",
      "Custom scoring per lead, synced into HubSpot, Salesforce, or Pipedrive",
      "Abandoned-form recovery with automated email and SMS nudges",
    ],
    visual: "leads",
  },
]

function ChatVisual() {
  return (
    <div className="space-y-4">
      <p className="el-chat-bubble el-chat-user">
        Do you build sites for home-service businesses?
      </p>
      <p className="el-chat-bubble el-chat-bot">
        We do. I can answer pricing, book a slot, and route you to Peter when
        things get real. What trade are you in?
      </p>
      <p className="el-chat-bubble el-chat-user">Roofing. We operate in three cities.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="el-chip-score">Intent 92</span>
        <span className="el-chip-status">Qualified → CRM</span>
      </div>
    </div>
  )
}

function SeoVisual() {
  return (
    <div>
      <div className="space-y-5">
        {seoData.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <span className="text-sm text-[#3d3d3d]">{row.label}</span>
              <span className="el-eyebrow">{row.pct}%</span>
            </div>
            <div className="el-seo-track">
              <div className="el-seo-bar" style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-6">
        <span className="el-chip-score">Semantic cluster</span>
        <span className="el-chip-status">Snippet ready</span>
      </div>
    </div>
  )
}

function LeadsVisual() {
  return (
    <div>
      {leadRows.map((row) => (
        <div key={row.source} className="el-lead-row">
          <span className="el-lead-source">{row.source}</span>
          <span className={`el-chip-${row.hot ? "score" : "status"}`}>
            {row.hot ? `Score ${row.score} → hot` : `Score ${row.score}`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ProductTabs() {
  const [active, setActive] = useState(products[0].id)
  const product = products.find((p) => p.id === active) ?? products[0]

  return (
    <div>
      <div className="el-tabs" role="tablist" aria-label="Product suite">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === active}
            className={`el-tab ${p.id === active ? "el-tab-active" : ""}`}
            onClick={() => setActive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-10 md:mt-14 grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
        <div>
          <p className="el-eyebrow mb-4">{product.eyebrow}</p>
          <h3 className="el-section-title">{product.title}</h3>
          <p className="el-body mt-5 max-w-xl">{product.description}</p>
          <ul className="mt-7 space-y-3">
            {product.bullets.map((b) => (
              <li key={b} className="el-bullet">
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="el-btn-primary mt-9">
            Build this engine <span aria-hidden="true"><ArrowRight size={16} /></span>
          </Link>
        </div>
        <div className="el-panel-inset p-5 md:p-7">
          {product.visual === "chat" && <ChatVisual />}
          {product.visual === "seo" && <SeoVisual />}
          {product.visual === "leads" && <LeadsVisual />}
        </div>
      </div>
    </div>
  )
}