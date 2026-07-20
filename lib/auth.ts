import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getPool } from "@/lib/db"

export const SESSION_COOKIE = "wps_session"
const SESSION_DAYS = 30

export type AuthUser = {
  id: string
  email: string
  name: string | null
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)")
  }
  return new TextEncoder().encode(secret)
}

export async function ensureAuthSchema() {
  // Users live on DigitalOcean Managed Postgres (cluster wps-canvas-submissions).
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT to_regclass('public.app_users') AS table_name`
  )
  if (!rows[0]?.table_name) {
    throw new Error(
      "app_users table is missing on DigitalOcean Postgres. Run: DATABASE_URL=... npm run db:init"
    )
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(user: AuthUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || typeof payload.email !== "string") return null
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
    }
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

export async function findUserByEmail(email: string) {
  const pool = getPool()
  const { rows } = await pool.query<{
    id: string
    email: string
    name: string | null
    password_hash: string
  }>(
    `SELECT id, email, name, password_hash FROM app_users WHERE email = $1`,
    [email.toLowerCase()]
  )
  return rows[0] ?? null
}

export async function createUser(input: {
  email: string
  password: string
  name?: string
}) {
  const pool = getPool()
  const passwordHash = await hashPassword(input.password)
  const { rows } = await pool.query<{
    id: string
    email: string
    name: string | null
  }>(
    `INSERT INTO app_users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name`,
    [
      input.email.toLowerCase().trim(),
      passwordHash,
      input.name?.trim() || null,
    ]
  )
  return rows[0]
}
