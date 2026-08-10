import { getSessionSnapshot } from "@/lib/agent/runs";
import { getSite } from "@/lib/sites/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const site = await getSite(id);
  if (!site) {
    return Response.json({ error: "Site not found." }, { status: 404 });
  }

  const snapshot = await getSessionSnapshot(id);
  return Response.json({
    site,
    chat: snapshot.chat,
    activeRun: snapshot.activeRun,
    events: snapshot.events,
    opencodeSessionId: snapshot.opencodeSessionId,
  });
}
