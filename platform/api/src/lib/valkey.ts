import { Redis } from "ioredis"

let client: Redis | null = null

export function getValkey() {
  if (!client) {
    const url = process.env.VALKEY_URL
    if (!url) throw new Error("VALKEY_URL is not set")
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    })
  }
  return client
}

export type SiteCacheEntry = {
  siteId: string
  slug: string
  status: string
  version: number | null
  storagePrefix: string | null
}

export async function cacheSite(entry: SiteCacheEntry) {
  const redis = getValkey()
  const key = `site:slug:${entry.slug}`
  await redis.set(key, JSON.stringify(entry))
  if (entry.status !== "live") {
    await redis.del(`site:live:${entry.slug}`)
  } else {
    await redis.set(`site:live:${entry.slug}`, JSON.stringify(entry))
  }
}

export async function invalidateSiteCache(slug: string) {
  const redis = getValkey()
  await redis.del(`site:slug:${slug}`, `site:live:${slug}`)
}

export async function getLiveSite(slug: string): Promise<SiteCacheEntry | null> {
  const redis = getValkey()
  const raw = await redis.get(`site:live:${slug}`)
  if (!raw) return null
  return JSON.parse(raw) as SiteCacheEntry
}
