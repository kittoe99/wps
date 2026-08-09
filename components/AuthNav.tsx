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
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-neutral-900 border border-neutral-300 hover:bg-black/5 transition-all"
        >
          Sign in
        </Link>
      )
    }
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-[#2b7fff] hover:text-[#1e6bf2] transition-colors"
      >
        Sign in
      </Link>
    )
  }

  if (mobile) {
    return (
      <button
        type="button"
        onClick={signOut}
        className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium text-white bg-[#2b7fff] hover:bg-[#1e6bf2] transition-all"
      >
        Sign out
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4">
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
