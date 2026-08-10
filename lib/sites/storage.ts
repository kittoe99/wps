import { promises as fs } from "fs";
import path from "path";
import type { SiteFile, SiteMeta } from "../agent/types";
import { buildOpenCodeConfig } from "../agent/opencode-config";

const WORKSPACES_ROOT = path.join(process.cwd(), "workspaces");

const AGENT_META_FILES = new Set([
  "site.json",
  "AGENTS.md",
  "BRIEF.md",
  "opencode.json",
  ".git",
]);

const SITE_BOOTSTRAP = `# Atelier project workspace

This directory is a full OpenCode agent workspace.

## Role
You are a coding agent with tools. Read, search, create, and surgically edit files here.
Prefer precise patches over rewriting whole files on follow-ups.
Do not truncate output to save tokens. Ship fully functional websites.

## Stack
- Static HTML + Tailwind CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`
- Optional CSS/JS assets as needed
- No React/Next app scaffolding unless explicitly requested

## Firecrawl research (full toolkit — use freely)
You have authenticated Firecrawl MCP. Prefer MCP tools; use bash \`node firecrawl.mjs …\` only if MCP fails.

- \`firecrawl_search\` — web/news/image search (default when no URL). Use for inspiration, competitors, industry copy.
- \`firecrawl_scrape\` — one URL (markdown, links, branding, summary, screenshots, JSON)
- \`firecrawl_map\` — list site URLs / discover IA
- \`firecrawl_crawl\` (+ status) — multi-page crawl for depth
- \`firecrawl_extract\` — structured facts (menu, pricing, hours, features)
- \`firecrawl_parse\` — PDFs and documents
- \`firecrawl_agent\` (+ status) — multi-source research synthesis when worth the wait
- \`firecrawl_interact\` — live browser when static scrape misses UI
- \`firecrawl_developer_search\` / GitHub research — when coding/docs help

Always research before building when a URL is given, when matching a competitor, or when real-world content would improve the site. Rewrite findings into original HTML — never dump scraped markup.

Bash fallback: \`node firecrawl.mjs scrape|search|map|crawl|extract …\`

## Multi-page sites (required when the brief needs more than one page)
- Create real HTML pages, not only in-page anchors. Examples: \`index.html\`, \`about.html\`, \`menu.html\`, \`contact.html\`, or \`pages/about.html\`
- Wire navigation with **relative** links between pages, e.g. \`href="about.html"\`, \`href="./contact.html"\`, \`href="pages/menu.html"\`
- Never use absolute root paths like \`href="/about"\` or \`href="/about.html"\` — they break in preview
- Keep shared nav/footer consistent across pages (same links, active state on the current page)
- Every linked page file must exist and be a complete HTML document
- Assets (CSS/JS/images) also use relative paths: \`href="styles.css"\`, \`src="assets/logo.svg"\`

## Fully functional site bar
- Real nav that links to real pages and/or sections
- Multiple finished sections on the home page + extra pages when useful
- Working interactions (mobile menu, forms, filters/tabs when useful)
- Real brand copy — no lorem, no TODOs, no stub pages
- Responsive mobile + desktop
- Purposeful motion (2–3 animations)

## Design
- Expressive fonts, atmospheric backgrounds
- Avoid purple-on-white, cream+terracotta clichés, newspaper layouts
- Hero: brand, one headline, one support line, CTA group, dominant visual
- No decorative cards in the hero

## Rules
- Always leave a working \`index.html\` as the home page
- Stay inside this workspace
- On iterations: inspect existing files first, then edit surgically
- When adding a new page, update nav links on every existing page that should reach it
`;

export function getWorkspacesRoot() {
  return WORKSPACES_ROOT;
}

export function getWorkspaceDir(siteId: string) {
  return path.join(WORKSPACES_ROOT, siteId);
}

/** @deprecated use getWorkspaceDir */
export function getSiteDir(siteId: string) {
  return getWorkspaceDir(siteId);
}

export function getGeneratedRoot() {
  return WORKSPACES_ROOT;
}

async function ensureRoot() {
  await fs.mkdir(WORKSPACES_ROOT, { recursive: true });
}

function isSafeRelativePath(filePath: string) {
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return (
    !path.isAbsolute(normalized) &&
    !normalized.split(path.sep).includes("..") &&
    normalized.length > 0
  );
}

function isPublicSiteFile(relativePath: string) {
  const base = path.basename(relativePath);
  if (AGENT_META_FILES.has(base)) return false;
  if (
    relativePath.startsWith(".git/") ||
    relativePath.startsWith(".atelier/") ||
    relativePath.includes("/.atelier/")
  ) {
    return false;
  }
  return (
    /\.(html|css|js|svg|png|jpg|jpeg|webp|ico|woff2?|json)$/i.test(
      relativePath,
    ) && !/(^|\/)firecrawl(\.mjs|-scrape\.mjs)$/i.test(relativePath)
  );
}

export async function createWorkspace(
  siteId: string,
  prompt: string,
  modelId = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro",
): Promise<string> {
  await ensureRoot();
  const dir = getWorkspaceDir(siteId);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(path.join(dir, "AGENTS.md"), SITE_BOOTSTRAP, "utf8");
  await writeFirecrawlHelper(dir);
  await fs.writeFile(
    path.join(dir, "BRIEF.md"),
    `# Site brief\n\n${prompt}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(dir, "opencode.json"),
    JSON.stringify(buildOpenCodeConfig(modelId), null, 2),
    "utf8",
  );

  return dir;
}

const FIRECRAWL_HELPER = `/**
 * Workspace Firecrawl CLI — full REST fallback when MCP tools are unavailable.
 *
 * Usage:
 *   node firecrawl.mjs scrape <url>
 *   node firecrawl.mjs search <query>
 *   node firecrawl.mjs map <url>
 *   node firecrawl.mjs crawl <url> [limit]
 *   node firecrawl.mjs extract <url> <prompt>
 */
const [cmd, ...rest] = process.argv.slice(2);
const key = process.env.FIRECRAWL_API_KEY?.trim();

if (!key) {
  console.error("FIRECRAWL_API_KEY is not set.");
  process.exit(1);
}

if (!cmd) {
  console.error(
    "Usage: node firecrawl.mjs <scrape|search|map|crawl|extract> ...",
  );
  process.exit(1);
}

async function api(path, body) {
  const res = await fetch("https://api.firecrawl.dev/v1/" + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

function out(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2));
}

if (cmd === "scrape") {
  const url = rest[0];
  if (!url) {
    console.error("Usage: node firecrawl.mjs scrape <url>");
    process.exit(1);
  }
  const data = await api("scrape", {
    url,
    formats: ["markdown", "links", "branding"],
    onlyMainContent: true,
  });
  const d = data?.data || data;
  out({
    ok: true,
    mode: "scrape",
    url,
    title: d?.metadata?.title || "",
    markdown: String(d?.markdown || "").slice(0, 60000),
    links: Array.isArray(d?.links) ? d.links.slice(0, 100) : [],
    branding: d?.branding || null,
  });
} else if (cmd === "search") {
  const query = rest.join(" ").trim();
  if (!query) {
    console.error("Usage: node firecrawl.mjs search <query>");
    process.exit(1);
  }
  const data = await api("search", {
    query,
    limit: 8,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
  });
  const results = data?.data || data?.web || data?.results || [];
  out({
    ok: true,
    mode: "search",
    query,
    results: (Array.isArray(results) ? results : []).slice(0, 8).map((r) => ({
      title: r.title || r.metadata?.title || "",
      url: r.url || r.metadata?.sourceURL || "",
      description: r.description || (r.markdown ? String(r.markdown).slice(0, 400) : ""),
      markdown: String(r.markdown || "").slice(0, 8000),
    })),
  });
} else if (cmd === "map") {
  const url = rest[0];
  if (!url) {
    console.error("Usage: node firecrawl.mjs map <url>");
    process.exit(1);
  }
  const data = await api("map", { url, limit: 80 });
  const links = data?.links || data?.data || [];
  out({
    ok: true,
    mode: "map",
    url,
    links: (Array.isArray(links) ? links : []).slice(0, 80),
  });
} else if (cmd === "crawl") {
  const url = rest[0];
  const limit = Number(rest[1] || 8);
  if (!url) {
    console.error("Usage: node firecrawl.mjs crawl <url> [limit]");
    process.exit(1);
  }
  const started = await api("crawl", {
    url,
    limit: Math.min(Math.max(limit, 1), 20),
    scrapeOptions: {
      formats: ["markdown", "links"],
      onlyMainContent: true,
    },
  });
  const id = started?.id || started?.data?.id;
  if (!id) {
    out({ ok: true, mode: "crawl", started });
    process.exit(0);
  }
  let final = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const statusRes = await fetch("https://api.firecrawl.dev/v1/crawl/" + id, {
      headers: { Authorization: "Bearer " + key },
    });
    final = await statusRes.json();
    const status = final?.status || final?.data?.status;
    if (status === "completed" || status === "failed") break;
  }
  const pages = final?.data || [];
  out({
    ok: true,
    mode: "crawl",
    url,
    id,
    status: final?.status,
    pages: (Array.isArray(pages) ? pages : []).slice(0, 20).map((p) => ({
      url: p.metadata?.sourceURL || p.url || "",
      title: p.metadata?.title || "",
      markdown: String(p.markdown || "").slice(0, 12000),
    })),
  });
} else if (cmd === "extract") {
  const url = rest[0];
  const prompt = rest.slice(1).join(" ").trim();
  if (!url || !prompt) {
    console.error("Usage: node firecrawl.mjs extract <url> <prompt>");
    process.exit(1);
  }
  const data = await api("extract", {
    urls: [url],
    prompt,
  });
  out({ ok: true, mode: "extract", url, prompt, data });
} else {
  console.error("Unknown command: " + cmd);
  process.exit(1);
}
`;

async function writeFirecrawlHelper(dir: string) {
  await fs.writeFile(path.join(dir, "firecrawl.mjs"), FIRECRAWL_HELPER, "utf8");
}

export async function syncWorkspaceAgents(siteId: string) {
  const dir = getWorkspaceDir(siteId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "AGENTS.md"), SITE_BOOTSTRAP, "utf8");
  await writeFirecrawlHelper(dir);
  // Keep OpenCode MCP wiring current (Firecrawl, model limits, etc.)
  const modelId = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
  await fs.writeFile(
    path.join(dir, "opencode.json"),
    JSON.stringify(buildOpenCodeConfig(modelId), null, 2),
    "utf8",
  );
}

export async function updateWorkspaceBrief(siteId: string, prompt: string) {
  const dir = getWorkspaceDir(siteId);
  await fs.mkdir(dir, { recursive: true });
  await syncWorkspaceAgents(siteId);
  await fs.writeFile(
    path.join(dir, "BRIEF.md"),
    `# Site brief\n\n${prompt}\n`,
    "utf8",
  );
}

export async function writeWorkspaceFiles(siteId: string, files: SiteFile[]) {
  const siteDir = getWorkspaceDir(siteId);
  await fs.mkdir(siteDir, { recursive: true });

  for (const file of files) {
    if (!isSafeRelativePath(file.path)) {
      throw new Error(`Unsafe file path: ${file.path}`);
    }
    const fullPath = path.join(siteDir, file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf8");
  }
}

export async function writeSiteMeta(meta: SiteMeta) {
  const siteDir = getWorkspaceDir(meta.id);
  await fs.mkdir(siteDir, { recursive: true });
  await fs.writeFile(
    path.join(siteDir, "site.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );
}

export async function saveSite(meta: SiteMeta, files: SiteFile[]) {
  await writeWorkspaceFiles(meta.id, files);
  await writeSiteMeta(meta);
}

export async function updateSite(
  siteId: string,
  meta: SiteMeta,
  files: SiteFile[],
) {
  await saveSite({ ...meta, id: siteId }, files);
}

export async function collectWorkspaceFiles(
  siteId: string,
): Promise<SiteFile[]> {
  const siteDir = getWorkspaceDir(siteId);
  const files: SiteFile[] = [];

  async function walk(current: string, base = "") {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".atelier"
      )
        continue;
      const rel = path.join(base, entry.name).replace(/\\/g, "/");
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
      } else if (isPublicSiteFile(rel)) {
        const content = await fs.readFile(full, "utf8");
        files.push({ path: rel, content });
      }
    }
  }

  await walk(siteDir);
  return files;
}

export async function listSites(): Promise<SiteMeta[]> {
  await ensureRoot();
  const entries = await fs.readdir(WORKSPACES_ROOT, { withFileTypes: true });
  const sites: SiteMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const metaPath = path.join(WORKSPACES_ROOT, entry.name, "site.json");
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      sites.push(JSON.parse(raw) as SiteMeta);
    } catch {
      // skip incomplete workspaces
    }
  }

  return sites.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getSite(siteId: string): Promise<SiteMeta | null> {
  try {
    const raw = await fs.readFile(
      path.join(getWorkspaceDir(siteId), "site.json"),
      "utf8",
    );
    return JSON.parse(raw) as SiteMeta;
  } catch {
    return null;
  }
}

export async function deleteSite(siteId: string) {
  await fs.rm(getWorkspaceDir(siteId), { recursive: true, force: true });
}

export async function readSiteFiles(siteId: string): Promise<SiteFile[]> {
  return collectWorkspaceFiles(siteId);
}

export async function resolveSiteFile(
  siteId: string,
  filePath: string,
): Promise<string | null> {
  const cleaned = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!cleaned || cleaned.includes("..")) return null;

  const siteRoot = path.resolve(getWorkspaceDir(siteId));
  const candidates = [
    cleaned,
    cleaned.endsWith("/") ? `${cleaned}index.html` : null,
    !path.extname(cleaned) ? `${cleaned}.html` : null,
    !path.extname(cleaned) ? `${cleaned}/index.html` : null,
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (!isSafeRelativePath(candidate)) continue;
    if (!isPublicSiteFile(candidate) && !candidate.endsWith(".html")) continue;
    // Allow resolving .html even if isPublicSiteFile is strict
    if (!isPublicSiteFile(candidate)) continue;

    const fullPath = path.join(getWorkspaceDir(siteId), candidate);
    if (!path.resolve(fullPath).startsWith(siteRoot)) continue;

    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      // try next candidate
    }
  }

  return null;
}

/** Rewrites HTML so relative links/assets resolve under the preview mount. */
export function injectPreviewBase(html: string, siteId: string): string {
  const baseHref = `/api/studio/sites/${siteId}/files/`;
  const baseTag = `<base href="${baseHref}">`;

  if (/<base\s/i.test(html)) {
    return html.replace(/<base\s[^>]*>/i, baseTag);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n  ${baseTag}`);
  }
  return `${baseTag}\n${html}`;
}
