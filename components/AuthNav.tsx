"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type User = { id: string; email: string; name: string | null }

export default function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json()
        return data.user as User
      })
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
    router.refresh()
  }

  if (user === undefined) {
    return mobile ? null : (
      <span className="text-sm text-neutral-400 w-16 inline-block" aria-hidden />
    )
  }

  if (!user) {
    if (mobile) {
      return (
        <Link
          href="/login"
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-neutral-900 border border-neutral-300 hover:bg-white transition-all"
        >
          Sign in
        </Link>
      )
    }
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors"
      >
        Sign in
      </Link>
    )
  }

  if (mobile) {
    return (
      <>
        <Link
          href="/builder"
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-neutral-900 border border-neutral-300 hover:bg-white transition-all"
        >
          Builder
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-all"
        >
          Sign out
        </button>
      </>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/builder"
        className="text-sm font-medium text-[#d97759] hover:text-[#c46a4f] transition-colors"
      >
        Builder
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
