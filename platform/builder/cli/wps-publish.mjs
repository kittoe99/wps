#!/usr/bin/env node
/**
 * Publish /workspace static site files to WPS platform API.
 * Usage: wps-publish --slug <slug> --version <n> [--dir /workspace]
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

function arg(name, fallback) {
  const i = process.argv.indexOf(name)
  if (i === -1) return fallback
  return process.argv[i + 1]
}

function walk(dir, base = dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full, base))
    else out.push(full)
  }
  return out
}

function contentType(path) {
  if (path.endsWith(".html")) return "text/html; charset=utf-8"
  if (path.endsWith(".css")) return "text/css; charset=utf-8"
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8"
  if (path.endsWith(".json")) return "application/json"
  if (path.endsWith(".svg")) return "image/svg+xml"
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg"
  if (path.endsWith(".webp")) return "image/webp"
  if (path.endsWith(".woff2")) return "font/woff2"
  return "application/octet-stream"
}

const slug = arg("--slug")
const version = Number(arg("--version", "1"))
const dir = arg("--dir", "/workspace")
const apiUrl = (process.env.PLATFORM_API_URL || "http://host.docker.internal:8080").replace(/\/$/, "")
const token = process.env.PLATFORM_API_TOKEN || ""

if (!slug) {
  console.error("Usage: wps-publish --slug <slug> --version <n> [--dir /workspace]")
  process.exit(1)
}

const files = walk(dir).map((full) => {
  const path = relative(dir, full).replace(/\\/g, "/")
  const buf = readFileSync(full)
  // Inline text for HTML/CSS/JS; skip huge binaries in MVP (base64 later)
  const textLike = /\.(html|css|js|json|svg|txt|md)$/i.test(path)
  if (!textLike) {
    console.warn("Skipping binary for MVP publish:", path)
    return null
  }
  return {
    path,
    content: buf.toString("utf8"),
    contentType: contentType(path),
  }
}).filter(Boolean)

if (!files.length) {
  console.error("No publishable files found in", dir)
  process.exit(1)
}

const res = await fetch(`${apiUrl}/sites/${slug}/publish`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ version, files }),
})

const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error("Publish failed:", res.status, body)
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, ...body }, null, 2))
