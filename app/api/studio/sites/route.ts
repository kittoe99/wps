import { NextResponse } from "next/server";
import { listSites } from "@/lib/sites/storage";

export const runtime = "nodejs";

export async function GET() {
  const sites = await listSites();
  return NextResponse.json({ sites });
}
