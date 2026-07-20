import { NextResponse } from "next/server"
import {
  createSessionToken,
  createUser,
  ensureAuthSchema,
  findUserByEmail,
  setSessionCookie,
} from "@/lib/auth"

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    await ensureAuthSchema()
    const body = (await request.json()) as {
      email?: string
      password?: string
      name?: string
    }

    const email = body.email?.trim().toLowerCase() || ""
    const password = body.password || ""
    const name = body.name?.trim()

    if (!email || !email.includes("@")) {
      return badRequest("Enter a valid email address")
    }
    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters")
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return badRequest("An account with this email already exists", 409)
    }

    const user = await createUser({ email, password, name })
    const token = await createSessionToken(user)
    await setSessionCookie(token)

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (err) {
    console.error("signup failed:", err)
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 })
  }
}
