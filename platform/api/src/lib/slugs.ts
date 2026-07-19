const DEFAULT_RESERVED = [
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
  "status",
  "docs",
  "support",
  "help",
  "blog",
  "shop",
]

export function reservedSlugs(): Set<string> {
  const fromEnv = (process.env.RESERVED_SLUGS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...DEFAULT_RESERVED, ...fromEnv])
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)
}

export function assertSlugAvailable(slug: string) {
  const normalized = slug.toLowerCase()
  if (!isValidSlug(normalized)) {
    throw new Error("Invalid slug. Use lowercase letters, numbers, and hyphens (3–63 chars).")
  }
  if (reservedSlugs().has(normalized)) {
    throw new Error(`Slug "${normalized}" is reserved.`)
  }
  return normalized
}
