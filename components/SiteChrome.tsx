"use client"

import { usePathname } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

/** Marketing chrome (nav + footer). Hidden on immersive app routes like /builder. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const immersive = pathname === "/builder" || pathname.startsWith("/builder/") || pathname === "/"

  if (immersive) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
