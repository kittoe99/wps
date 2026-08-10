import {
  findRun,
  readRun,
  readRunEvents,
  subscribeRun,
  type AgentRun,
  type RunEvent,
} from "@/lib/agent/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isTerminal(
  payload: RunEvent | { type: "status"; run: AgentRun },
): boolean {
  if (payload.type === "completed" || payload.type === "failed") return true;
  if (payload.type === "status" && "run" in payload) {
    return (
      payload.run.status === "completed" || payload.run.status === "failed"
    );
  }
  return false;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const { runId } = await context.params;
  const run = await findRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      send({ type: "status", run });

      const events = await readRunEvents(run.siteId, runId);
      for (const event of events) {
        send(event);
      }

      if (run.status === "completed" || run.status === "failed") {
        send({ type: "done", run });
        cleanup();
        return;
      }

      unsubscribe = subscribeRun(runId, (payload) => {
        send(payload);
        if (isTerminal(payload)) {
          send({
            type: "done",
            run: "run" in payload ? payload.run : undefined,
          });
          cleanup();
        }
      });

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);

      // Poll disk in case this process missed in-memory events (HMR / multi-instance)
      const poll = setInterval(async () => {
        if (closed) {
          clearInterval(poll);
          return;
        }
        const latest = await readRun(run.siteId, runId);
        if (!latest) return;
        if (latest.status === "completed" || latest.status === "failed") {
          send({ type: "status", run: latest });
          send({ type: "done", run: latest });
          clearInterval(poll);
          cleanup();
        }
      }, 2000);

      request.signal.addEventListener("abort", () => {
        clearInterval(poll);
        cleanup();
      });
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
