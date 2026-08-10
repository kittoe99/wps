import { NextResponse } from "next/server";
import { deleteSite, getSite } from "@/lib/sites/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const site = await getSite(id);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }
  return NextResponse.json({ site });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await deleteSite(id);
  return NextResponse.json({ ok: true });
}
