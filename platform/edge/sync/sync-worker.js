import { mkdir, writeFile, rm, rename } from "node:fs/promises"
import { dirname, join } from "node:path"
import Redis from "ioredis"
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"

const SITE_ROOT = process.env.SITE_ROOT || "/var/www/sites"
const CHANNEL = process.env.EDGE_SYNC_CHANNEL || "edge:sync"

const redis = new Redis(process.env.VALKEY_URL, {
  tls: process.env.VALKEY_URL?.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
  maxRetriesPerRequest: null,
})

const s3 = new S3Client({
  region: process.env.SPACES_REGION || "nyc3",
  endpoint: process.env.SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
})

const bucket = process.env.SPACES_BUCKET || "wps-sites"

async function listAll(prefix) {
  const keys = []
  let token
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      })
    )
    for (const obj of res.Contents || []) {
      if (obj.Key && !obj.Key.endsWith("/")) keys.push(obj.Key)
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function downloadKey(key, destPath) {
  await mkdir(dirname(destPath), { recursive: true })
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const body = res.Body
  if (!body) return
  const bytes = await body.transformToByteArray()
  await writeFile(destPath, Buffer.from(bytes))
}

async function activate({ slug, storagePrefix, version }) {
  if (!slug || !storagePrefix) throw new Error("slug and storagePrefix required")

  const staging = join(SITE_ROOT, slug, `.staging-v${version || "x"}`)
  const current = join(SITE_ROOT, slug, "current")
  const previous = join(SITE_ROOT, slug, "previous")

  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })

  const keys = await listAll(storagePrefix)
  console.log(`Syncing ${keys.length} objects for ${slug} from ${storagePrefix}`)

  for (const key of keys) {
    const rel = key.slice(storagePrefix.length)
    if (!rel || rel.includes("..")) continue
    await downloadKey(key, join(staging, rel))
  }

  // Ensure index.html exists or write a placeholder
  try {
    await writeFile(join(staging, ".version"), String(version || ""), { flag: "w" })
  } catch {
    /* ignore */
  }

  await rm(previous, { recursive: true, force: true }).catch(() => undefined)
  try {
    await rename(current, previous)
  } catch {
    /* no previous */
  }
  await rename(staging, current)
  console.log(`Activated ${slug} @ ${current}`)
}

async function suspend({ slug }) {
  if (!slug) return
  const current = join(SITE_ROOT, slug, "current")
  const suspended = join(SITE_ROOT, slug, "suspended")
  await rm(suspended, { recursive: true, force: true }).catch(() => undefined)
  try {
    await rename(current, suspended)
    console.log(`Suspended ${slug}`)
  } catch {
    console.log(`No current site to suspend for ${slug}`)
  }
}

async function handleMessage(raw) {
  const msg = JSON.parse(raw)
  if (msg.action === "activate") await activate(msg)
  else if (msg.action === "suspend") await suspend(msg)
  else console.warn("Unknown action", msg.action)
}

const sub = redis.duplicate()
await sub.subscribe(CHANNEL)
console.log(`Edge sync listening on ${CHANNEL}`)

sub.on("message", (_ch, message) => {
  handleMessage(message).catch((err) => console.error("sync failed", err))
})

// Keepalive
setInterval(() => {}, 1 << 30)
