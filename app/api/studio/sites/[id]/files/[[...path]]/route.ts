import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { injectPreviewBase, resolveSiteFile } from "@/lib/sites/storage";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; path?: string[] }> },
) {
  const { id, path: parts = [] } = await context.params;
  const filePath = parts.length ? parts.join("/") : "index.html";
  const absolute = await resolveSiteFile(id, filePath);

  if (!absolute) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const ext = path.extname(absolute).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  if (
    ext === ".html" ||
    ext === ".css" ||
    ext === ".js" ||
    ext === ".json" ||
    ext === ".svg"
  ) {
    let body = await fs.readFile(absolute, "utf8");
    if (ext === ".html") {
      body = injectPreviewBase(body, id);
    }
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  }

  const body = await fs.readFile(absolute);
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
