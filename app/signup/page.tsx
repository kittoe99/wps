"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useState, Suspense } from "react"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Sign up failed")
        return
      }
      router.push(next.startsWith("/") ? next : "/")
      router.refresh()
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block font-sans-ui text-sm font-medium text-[#141413] mb-1.5">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block font-sans-ui text-sm font-medium text-[#141413] mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none"
          placeholder="you@business.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-sans-ui text-sm font-medium text-[#141413] mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 focus:outline-none"
          placeholder="At least 8 characters"
        />
      </div>
      {error && (
        <p className="font-sans-ui text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 transition-colors"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="font-sans-ui text-sm text-[#6b6b6b] text-center">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[#d97759] hover:text-[#c46a4f] font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf8]">
      <section className="bg-[#fcfaf8] border-b border-[#dbd9d7]">
        <div className="u-container pt-14 md:pt-20 pb-10 md:pb-14 text-center">
          <h1 className="text-hero-sans max-w-xl mx-auto animate-fade-in">
            Create your <span className="hero-underline">account</span>
          </h1>
          <p className="font-sans-ui text-base text-[#3d3d3a] mt-4 max-w-md mx-auto animate-fade-in-delayed">
            Register to get started.
          </p>
        </div>
      </section>
      <section className="u-container py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <Suspense fallback={<p className="font-sans-ui text-sm text-[#6b6b6b] text-center">Loading…</p>}>
            <SignupForm />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
