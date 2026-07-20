import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "wps_session"
const PROTECTED = ["/builder", "/preview"]

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) return null
  return new TextEncoder().encode(secret)
}

async function hasValidSession(token: string | undefined) {
  if (!token) return false
  const secret = getSecret()
  if (!secret) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return Boolean(payload.sub)
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (await hasValidSession(token)) return NextResponse.next()

  const login = new URL("/login", request.url)
  login.searchParams.set("next", pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/builder", "/builder/:path*", "/preview", "/preview/:path*"],
}
