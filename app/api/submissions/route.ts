import { NextRequest, NextResponse } from "next/server"
import { ensureSchema, getPool } from "@/lib/db"

type SubmissionPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
  source?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Submissions are not configured yet." },
      { status: 503 }
    )
  }

  let body: SubmissionPayload

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const subject = body.subject?.trim()
  const message = body.message?.trim()
  const source = body.source?.trim() || "contact"

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: "Name, email, subject, and message are required." },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 })
  }

  if (name.length > 200 || email.length > 320 || subject.length > 300 || message.length > 10000) {
    return NextResponse.json({ error: "One or more fields are too long." }, { status: 400 })
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  const userAgent = request.headers.get("user-agent")

  try {
    await ensureSchema()

    const pool = getPool()
    const result = await pool.query(
      `INSERT INTO contact_submissions (name, email, subject, message, source, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [name, email, subject, message, source, ipAddress, userAgent]
    )

    return NextResponse.json(
      {
        ok: true,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to save submission:", error)
    return NextResponse.json(
      { error: "Unable to save your message right now. Please try again." },
      { status: 500 }
    )
  }
}
