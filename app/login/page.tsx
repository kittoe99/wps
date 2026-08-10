"use client"

import Link from "next/link"
import { ArrowUpRight, Check, LoaderCircle, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useState } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/builder"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<"login" | "demo" | null>(null)
  const destination = next.startsWith("/") ? next : "/builder"

  async function finish(res: Response) { const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not continue"); router.push(destination); router.refresh() }
  async function onSubmit(e: FormEvent) { e.preventDefault(); setError(null); setLoading("login"); try { await finish(await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })) } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong") } finally { setLoading(null) } }
  async function continueLocal() { setError(null); setLoading("demo"); try { await finish(await fetch("/api/auth/local-demo", { method: "POST" })) } catch (err) { setError(err instanceof Error ? err.message : "Could not start local demo") } finally { setLoading(null) } }

  return <div className="grid overflow-hidden rounded-[28px] border border-[#deded7] bg-white shadow-[0_30px_80px_rgba(24,24,20,.1)] lg:grid-cols-[.86fr_1.14fr]">
    <aside className="relative overflow-hidden bg-[#181817] p-7 text-white sm:p-10"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#d9ff4f]/30 shadow-[0_0_0_30px_rgba(217,255,79,.05),0_0_0_60px_rgba(217,255,79,.025)]" /><div className="relative"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9ff4f] text-[#171715]"><Sparkles size={19} /></span><h2 className="mt-10 max-w-xs text-3xl font-semibold tracking-[-.065em]">Your website starts with a clear brief.</h2><ul className="mt-8 space-y-4 text-sm text-[#c7c7c0]"><li className="flex gap-3"><Check size={17} className="shrink-0 text-[#d9ff4f]" />Save and resume anytime.</li><li className="flex gap-3"><Check size={17} className="shrink-0 text-[#d9ff4f]" />Build around your real business.</li><li className="flex gap-3"><Check size={17} className="shrink-0 text-[#d9ff4f]" />Review everything before handoff.</li></ul></div></aside>
    <div className="p-7 sm:p-10"><Link href="/" className="growth-brand"><span>WPS</span>canvas</Link><h1 className="mt-10 text-4xl font-semibold tracking-[-.07em] text-[#171715]">Welcome back.</h1><p className="mt-3 text-sm leading-relaxed text-[#64645e]">Sign in to continue building your website.</p>
      {process.env.NODE_ENV !== "production" && <div className="mt-7 rounded-2xl border border-[#d8e789] bg-[#f5facf] p-4"><p className="text-sm font-semibold text-[#3c4704]">Local development</p><p className="mt-1 text-xs leading-relaxed text-[#68750b]">Skip credentials and create a local demo session for testing.</p><button type="button" onClick={continueLocal} disabled={loading !== null} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#171715] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{loading === "demo" ? <LoaderCircle size={15} className="animate-spin" /> : "Continue to builder"}<ArrowUpRight size={15} /></button></div>}
      <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-[.14em] text-[#8a8a83]"><span className="h-px flex-1 bg-[#e4e4de]" />or sign in<span className="h-px flex-1 bg-[#e4e4de]" /></div>
      <form onSubmit={onSubmit} className="space-y-4"><label className="block text-sm font-medium text-[#292925]">Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d9d9d2] px-3 py-2.5 text-sm outline-none focus:border-[#94ad00] focus:ring-2 focus:ring-[#d9ff4f]/50" placeholder="you@business.com" /></label><label className="block text-sm font-medium text-[#292925]">Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d9d9d2] px-3 py-2.5 text-sm outline-none focus:border-[#94ad00] focus:ring-2 focus:ring-[#d9ff4f]/50" placeholder="Your password" /></label>{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}<button type="submit" disabled={loading !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171715] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{loading === "login" && <LoaderCircle size={15} className="animate-spin" />}Sign in <ArrowUpRight size={15} /></button></form><p className="mt-6 text-center text-sm text-[#6a6a64]">New here? <Link href={`/signup?next=${encodeURIComponent(destination)}`} className="font-medium text-[#607100]">Create an account</Link></p>
    </div>
  </div>
}

export default function LoginPage() { return <main className="min-h-screen bg-[#f7f7f4] px-4 py-10 sm:py-16"><div className="mx-auto w-full max-w-4xl"><Suspense fallback={<p className="text-center text-sm text-[#6a6a64]">Loading sign in…</p>}><LoginForm /></Suspense></div></main> }
