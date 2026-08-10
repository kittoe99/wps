import { NextResponse } from "next/server";
import { getActiveProviderName, getAgentStatus } from "@/lib/agent";
import { resolveAgentModel } from "@/lib/agent/models";
import { startAgentRun } from "@/lib/agent/runner";

export const runtime = "nodejs";
export const maxDuration = 900;

export async function GET() {
  const provider = await getActiveProviderName();
  const status = getAgentStatus();
  return NextResponse.json({
    provider,
    codingAgent: process.env.CODING_AGENT || "auto",
    model: status.defaultModel,
    models: status.models,
    deepseekConfigured: status.deepseekConfigured,
    firecrawlConfigured: status.firecrawlConfigured,
  });
}

/**
 * Start an agent run on the server and return immediately.
 * Progress streams via GET /api/agent/runs/[runId]/stream.
 * Session/chat survive refresh via GET /api/sites/[id]/session.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      siteId?: string;
      model?: string;
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const { run, siteId } = await startAgentRun({
      prompt,
      siteId: body.siteId,
      model: body.model ? resolveAgentModel(body.model) : undefined,
    });

    return NextResponse.json({
      runId: run.id,
      siteId,
      status: run.status,
      provider: run.provider,
      model: run.model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent run failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
