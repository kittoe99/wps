import { NextResponse } from "next/server"
import {
  createSessionToken,
  ensureAuthSchema,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await ensureAuthSchema()
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    const email = body.email?.trim().toLowerCase() || ""
    const password = body.password || ""

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await findUserByEmail(email)
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (err) {
    console.error("login failed:", err)
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 })
  }
}
