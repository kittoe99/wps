import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import BuilderWorkspace from "@/components/BuilderWorkspace"

export const metadata: Metadata = {
  title: "Builder — wpscanvas",
  description: "Build and manage your WPS Canvas website with the AI agent.",
}

export default async function BuilderPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login?next=/builder")
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#fcfaf8]">
      <BuilderWorkspace userEmail={user.email} userName={user.name} />
    </main>
  )
}
