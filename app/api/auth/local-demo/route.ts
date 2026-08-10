import { NextResponse } from "next/server"
import { createSessionToken, createUser, ensureAuthSchema, findUserByEmail, setSessionCookie } from "@/lib/auth"

const DEMO_EMAIL = "local-demo@wpscanvas.test"

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  try {
    await ensureAuthSchema()
    const existing = await findUserByEmail(DEMO_EMAIL)
    const user = existing
      ? { id: existing.id, email: existing.email, name: existing.name }
      : await createUser({ email: DEMO_EMAIL, password: "local-demo-not-for-production", name: "Local demo" })
    await setSessionCookie(await createSessionToken(user))
    return NextResponse.json({ user })
  } catch (error) {
    console.error("local demo login failed:", error)
    return NextResponse.json({ error: "Could not create a local demo session" }, { status: 500 })
  }
}
