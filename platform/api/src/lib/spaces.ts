import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

let s3: S3Client | null = null

export function getSpaces() {
  if (!s3) {
    const key = process.env.SPACES_KEY
    const secret = process.env.SPACES_SECRET
    const endpoint = process.env.SPACES_ENDPOINT
    const region = process.env.SPACES_REGION || "nyc3"
    if (!key || !secret || !endpoint) {
      throw new Error("SPACES_KEY, SPACES_SECRET, and SPACES_ENDPOINT are required")
    }
    s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: key, secretAccessKey: secret },
      forcePathStyle: false,
    })
  }
  return s3
}

export function bucket() {
  return process.env.SPACES_BUCKET || "wps-sites"
}

export function versionPrefix(siteId: string, version: number) {
  return `sites/${siteId}/v${version}/`
}

export async function createUploadUrl(key: string, contentType: string, expiresIn = 900) {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(getSpaces(), command, { expiresIn })
}

export async function putObject(key: string, body: Buffer | string, contentType: string) {
  await getSpaces().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function listPrefix(prefix: string) {
  const client = getSpaces()
  const keys: { key: string; size: number }[] = []
  let token: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefix,
        ContinuationToken: token,
      })
    )
    for (const obj of res.Contents || []) {
      if (obj.Key) keys.push({ key: obj.Key, size: obj.Size || 0 })
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return keys
}

export async function writeCurrentPointer(siteId: string, version: number) {
  await putObject(
    `sites/${siteId}/current.json`,
    JSON.stringify({ version, prefix: versionPrefix(siteId, version), updatedAt: new Date().toISOString() }),
    "application/json"
  )
}

export async function objectExists(key: string) {
  try {
    await getSpaces().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

export { CopyObjectCommand, DeleteObjectsCommand }
