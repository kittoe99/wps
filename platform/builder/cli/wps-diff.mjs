#!/usr/bin/env node
/**
 * Snapshot and diff site files for incremental editing.
 * Usage:
 *   wps-diff --slug <slug>                    show what changed since last snapshot
 *   wps-diff --slug <slug> --snapshot          save current state as reference
 *   wps-diff --slug <slug> --reset             reset reference to current state
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { createHash } from "node:crypto"

function arg(name, fallback) {
  const i = process.argv.indexOf(name)
  if (i === -1) return fallback
  return process.argv[i + 1] || ""
}

const slug = arg("--slug")
const doSnapshot = process.argv.includes("--snapshot")
const doReset = process.argv.includes("--reset")
const dir = arg("--dir", `/workspace/sites/${slug}`)

if (!slug) {
  console.error("Usage: wps-diff --slug <slug> [--snapshot|--reset] [--dir /path]")
  process.exit(1)
}

const snapDir = `/workspace/.wps-snapshots/${slug}`

function hashContent(buf) {
  return createHash("sha256").update(buf).digest("hex").slice(0, 12)
}

function walk(dir, base = dir) {
  const out = []
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full, base))
    else out.push(relative(base, full))
  }
  return out.sort()
}

function readFileSafe(p) {
  try { return readFileSync(p, "utf8") } catch { return null }
}

if (doSnapshot || doReset) {
  mkdirSync(snapDir, { recursive: true })
  const files = walk(dir)
  const manifest = {}
  for (const f of files) {
    const content = readFileSync(join(dir, f), "utf8")
    writeFileSync(join(snapDir, f), content)
    manifest[f] = hashContent(Buffer.from(content))
  }
  writeFileSync(join(snapDir, "__manifest__.json"), JSON.stringify(manifest, null, 2))
  const action = doReset ? "reset" : "saved"
  console.log(`Snapshot ${action} for /workspace/sites/${slug} (${files.length} files)`)
  process.exit(0)
}

// Diff mode
if (!existsSync(snapDir) || !existsSync(join(snapDir, "__manifest__.json"))) {
  console.error(`No snapshot found for ${slug}. Run: wps-diff --slug ${slug} --snapshot`)
  process.exit(1)
}

const prevManifest = JSON.parse(readFileSync(join(snapDir, "__manifest__.json"), "utf8"))
const currentFiles = walk(dir)
const currentManifest = {}
for (const f of currentFiles) {
  currentManifest[f] = hashContent(readFileSync(join(dir, f)))
}

const allFiles = new Set([...Object.keys(prevManifest), ...Object.keys(currentManifest)])
const changed = []
const added = []
const removed = []

for (const f of allFiles) {
  const was = prevManifest[f]
  const now = currentManifest[f]
  if (was && !now) removed.push(f)
  else if (!was && now) added.push(f)
  else if (was !== now) changed.push(f)
}

if (!changed.length && !added.length && !removed.length) {
  console.log(`No changes detected for /workspace/sites/${slug}`)
  process.exit(0)
}

console.log(`\n=== Changes in /workspace/sites/${slug} ===`)
if (added.length) console.log(`\nAdded: ${added.join(", ")}`)
if (removed.length) console.log(`\nRemoved: ${removed.join(", ")}`)
if (changed.length) {
  console.log(`\nChanged: ${changed.join(", ")}`)

  // Show line-level diffs for changed HTML/CSS/JS files
  for (const f of changed) {
    const prev = (readFileSafe(join(snapDir, f)) || "").split("\n")
    const curr = (readFileSafe(join(dir, f)) || "").split("\n")
    console.log(`\n--- ${f} ---`)

    let lineNum = 0
    const maxLen = Math.max(prev.length, curr.length)
    for (let i = 0; i < maxLen; i++) {
      lineNum++
      const p = prev[i] || ""
      const c = curr[i] || ""
      if (p === c) {
        // Print context lines around changes
        if (lineNum <= 3 || i >= maxLen - 3) {
          console.log(`  ${lineNum}: ${c}`)
        } else if (i > 3 && i === 4) {
          console.log(`  ...`)
        }
      } else {
        if (p && !c) {
          console.log(`- ${lineNum}: ${p}`)
        } else if (!p && c) {
          console.log(`+ ${lineNum}: ${c}`)
        } else {
          console.log(`- ${lineNum}: ${p}`)
          console.log(`+ ${lineNum}: ${c}`)
        }
      }
    }
  }
}
