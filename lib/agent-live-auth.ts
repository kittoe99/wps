import { SignJWT, jwtVerify } from "jose"

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)")
  }
  return new TextEncoder().encode(secret)
}

export type LiveWatchClaims = {
  userId: string
  runId: string
  slug: string
}

export async function createLiveWatchToken(claims: LiveWatchClaims) {
  return new SignJWT({
    typ: "agent_live",
    runId: claims.runId,
    slug: claims.slug,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getSecret())
}

export async function verifyLiveWatchToken(
  token: string
): Promise<LiveWatchClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      payload.typ !== "agent_live" ||
      !payload.sub ||
      typeof payload.runId !== "string" ||
      typeof payload.slug !== "string"
    ) {
      return null
    }
    return {
      userId: payload.sub,
      runId: payload.runId,
      slug: payload.slug,
    }
  } catch {
    return null
  }
}

export function agentWsPublicUrl() {
  return (process.env.NEXT_PUBLIC_AGENT_WS_URL || "").replace(/\/$/, "")
}

export function agentWsListenPort() {
  return Number(process.env.AGENT_WS_PORT || 3001)
}
