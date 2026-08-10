import { spawn } from "child_process";
import path from "path";
import { randomUUID } from "crypto";
import { resolveProvider } from "./provider";
import { resolveAgentModel, toOpenCodeModel } from "./models";
import { buildAgentTask, SYSTEM_PROMPT } from "./prompts";
import { buildOpenCodeConfig } from "./opencode-config";
import {
  appendChat,
  appendRunEvent,
  clearChildPid,
  createRun,
  readOpenCodeSessionId,
  setActiveRun,
  trackChildPid,
  writeOpenCodeSessionId,
  writeRun,
  type AgentRun,
} from "./runs";
import { buildCompletionMessage } from "./completion";
import {
  collectWorkspaceFiles,
  createWorkspace,
  getSite,
  getWorkspaceDir,
  updateWorkspaceBrief,
  writeSiteMeta,
} from "../sites/storage";
import { promises as fs } from "fs";

function resolveOpenCodeBin(): string {
  return path.join(
    process.cwd(),
    "node_modules",
    "opencode-ai",
    "bin",
    process.platform === "win32" ? "opencode.exe" : "opencode",
  );
}

function extractTitleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

function parseOpenCodeLine(line: string): {
  sessionId?: string;
  tool?: string;
  toolStatus?: string;
  text?: string;
  type: string;
  raw: unknown;
} | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const evt = JSON.parse(trimmed) as {
      type?: string;
      sessionID?: string;
      part?: {
        type?: string;
        tool?: string;
        text?: string;
        state?: { status?: string; title?: string };
      };
      error?: { data?: { message?: string } };
    };
    return {
      type: evt.type || "event",
      sessionId: evt.sessionID,
      tool: evt.part?.tool,
      toolStatus: evt.part?.state?.status,
      text: evt.part?.text,
      raw: evt,
    };
  } catch {
    return null;
  }
}

async function finalizeSuccess(
  run: AgentRun,
  summary: string,
  title: string,
  chatContent?: string,
) {
  const files = await collectWorkspaceFiles(run.siteId);
  const existing = await getSite(run.siteId);
  const now = new Date().toISOString();
  await writeSiteMeta({
    id: run.siteId,
    title,
    prompt: run.prompt,
    summary,
    provider: run.provider,
    createdAt: existing?.createdAt ?? run.createdAt,
    updatedAt: now,
    files: files.map((f) => f.path),
    workspacePath: getWorkspaceDir(run.siteId),
  });

  const completed = await writeRun({
    ...run,
    status: "completed",
    summary,
    title,
    finishedAt: now,
    tools: run.tools,
  });

  await appendChat(run.siteId, {
    id: randomUUID(),
    role: "assistant",
    content: chatContent || summary,
    at: now,
    runId: run.id,
  });

  await setActiveRun(run.siteId, null);
  await appendRunEvent(run.siteId, run.id, {
    type: "completed",
    message: summary,
    text: summary,
  });
  return completed;
}

async function finalizeFailure(run: AgentRun, error: string) {
  const failed = await writeRun({
    ...run,
    status: "failed",
    error,
    finishedAt: new Date().toISOString(),
  });
  await appendChat(run.siteId, {
    id: randomUUID(),
    role: "assistant",
    content: `Build failed: ${error}`,
    at: new Date().toISOString(),
    runId: run.id,
  });
  await setActiveRun(run.siteId, null);
  await appendRunEvent(run.siteId, run.id, {
    type: "failed",
    message: error,
  });
  return failed;
}

/**
 * Start an agent run on the server. Returns immediately; work continues in-process
 * and is persisted under workspaces/<siteId>/.atelier so refresh can resume the UI.
 */
export async function startAgentRun(input: {
  prompt: string;
  siteId?: string;
  model?: string;
}): Promise<{ run: AgentRun; siteId: string }> {
  const provider = await resolveProvider();
  const modelId = resolveAgentModel(input.model);
  const isNew = !input.siteId;
  const siteId = input.siteId ?? randomUUID().slice(0, 8);
  const existing = input.siteId ? await getSite(input.siteId) : null;
  const workspacePath = isNew
    ? await createWorkspace(siteId, input.prompt, modelId)
    : getWorkspaceDir(siteId);

  if (!isNew) {
    await updateWorkspaceBrief(siteId, input.prompt);
  }

  const now = new Date().toISOString();
  if (isNew || !existing) {
    await writeSiteMeta({
      id: siteId,
      title: "Building…",
      prompt: input.prompt,
      summary: "Workspace created. Agent is writing files…",
      provider: provider.name,
      createdAt: now,
      updatedAt: now,
      files: [],
      workspacePath,
    });
  }

  await appendChat(siteId, {
    id: randomUUID(),
    role: "user",
    content: input.prompt,
    at: now,
  });

  const run = await createRun({
    siteId,
    prompt: input.prompt,
    model: modelId,
    provider: provider.name,
  });

  // Fire-and-forget background execution (survives client disconnect/refresh)
  void executeRun(run, workspacePath).catch(async (err) => {
    await finalizeFailure(
      run,
      err instanceof Error ? err.message : "Unknown agent error",
    );
  });

  return { run, siteId };
}

async function executeRun(initial: AgentRun, workspacePath: string) {
  let run = await writeRun({
    ...initial,
    status: "running",
    startedAt: new Date().toISOString(),
  });

  await appendRunEvent(run.siteId, run.id, {
    type: "status",
    message: "OpenCode agent started",
  });

  if (run.provider !== "opencode") {
    // Fallback: use provider.generate synchronously in background
    const { getProvider } = await import("./provider");
    const provider = getProvider();
    try {
      const result = await provider.generate({
        prompt: run.prompt,
        siteId: run.siteId,
        workspacePath,
        model: run.model,
      });
      run = {
        ...run,
        tools: [],
      };
      await finalizeSuccess(run, result.summary, result.title);
    } catch (err) {
      await finalizeFailure(
        run,
        err instanceof Error ? err.message : "Provider failed",
      );
    }
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    await finalizeFailure(run, "DEEPSEEK_API_KEY is not set.");
    return;
  }

  const filesBefore = await collectWorkspaceFiles(run.siteId);
  const isIteration = filesBefore.length > 0;
  const task = buildAgentTask(run.prompt, isIteration);

  await fs.writeFile(
    path.join(workspacePath, "opencode.json"),
    JSON.stringify(
      buildOpenCodeConfig(toOpenCodeModel(resolveAgentModel(run.model))),
      null,
      2,
    ),
    "utf8",
  );

  const priorSession = isIteration
    ? await readOpenCodeSessionId(run.siteId)
    : null;
  const bin = resolveOpenCodeBin();

  const args = [
    "run",
    "-m",
    toOpenCodeModel(resolveAgentModel(run.model)),
    "--dir",
    workspacePath,
    "--auto",
    "--format",
    "json",
  ];
  if (priorSession) args.push("-s", priorSession);
  args.push(`${SYSTEM_PROMPT}\n\n${task}`);

  const tools: string[] = [];
  let lastText = "";
  let bestText = "";
  let sessionId = priorSession || undefined;
  let stdout = "";
  let stderr = "";

  await appendRunEvent(run.siteId, run.id, {
    type: "status",
    message: priorSession
      ? `Resuming OpenCode session ${priorSession}`
      : "Starting new OpenCode session",
  });

  if (process.env.FIRECRAWL_API_KEY?.trim()) {
    await appendRunEvent(run.siteId, run.id, {
      type: "status",
      message:
        "Firecrawl full toolkit enabled (search, scrape, map, crawl, extract, …)",
    });
  }

  const result = await new Promise<{ code: number }>((resolve) => {
    const child = spawn(bin, args, {
      cwd: workspacePath,
      env: {
        ...process.env,
        DEEPSEEK_API_KEY: apiKey,
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || "",
        OPENCODE_DISABLE_AUTOUPDATE: "1",
        OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX: "384000",
        OPENCODE_DISABLE_AUTOCOMPACT: "1",
      },
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    trackChildPid(run.id, child.pid);
    let buffer = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      buffer += text;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        void handleLine(line);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (buffer.trim()) void handleLine(buffer);
      clearChildPid(run.id);
      resolve({ code: code ?? 1 });
    });

    child.on("error", (err) => {
      stderr += err.message;
      clearChildPid(run.id);
      resolve({ code: 1 });
    });

    async function handleLine(line: string) {
      const parsed = parseOpenCodeLine(line);
      if (!parsed) return;
      if (parsed.sessionId) {
        sessionId = parsed.sessionId;
        await writeOpenCodeSessionId(run.siteId, parsed.sessionId);
      }
      if (parsed.tool) {
        const label = `${parsed.tool}:${parsed.toolStatus || "ran"}`;
        tools.push(label);
        run = { ...run, tools: [...tools], opencodeSessionId: sessionId };
        await writeRun(run);
        await appendRunEvent(run.siteId, run.id, {
          type: "tool",
          tool: parsed.tool,
          toolStatus: parsed.toolStatus,
          message: `${parsed.tool} ${parsed.toolStatus || ""}`.trim(),
          raw: parsed.raw,
        });
      } else if (parsed.text) {
        lastText = parsed.text.trim();
        if (lastText.length >= bestText.length) bestText = lastText;
        await appendRunEvent(run.siteId, run.id, {
          type: "text",
          text: lastText,
          message: lastText.slice(0, 200),
          raw: parsed.raw,
        });
      } else if (parsed.type === "error") {
        const msg =
          (parsed.raw as { error?: { data?: { message?: string } } })?.error
            ?.data?.message || "OpenCode error";
        await appendRunEvent(run.siteId, run.id, {
          type: "error",
          message: msg,
          raw: parsed.raw,
        });
      } else {
        await appendRunEvent(run.siteId, run.id, {
          type: parsed.type,
          message: parsed.type,
          raw: parsed.raw,
        });
      }
    }
  });

  // Retry once without session if resume failed
  if (
    priorSession &&
    /session not found|failed to load session|unknown session/i.test(
      stdout + stderr,
    )
  ) {
    await appendRunEvent(run.siteId, run.id, {
      type: "status",
      message: "Session resume failed — starting a fresh OpenCode session",
    });
    // Fall through to failure handling below if no HTML; user can retry
  }

  if (
    /Authentication Fails|Your api key:.*is invalid|"statusCode"\s*:\s*401/i.test(
      stdout + stderr,
    )
  ) {
    await finalizeFailure(
      { ...run, tools },
      "OpenCode DeepSeek authentication failed. Check DEEPSEEK_API_KEY.",
    );
    return;
  }

  const files = await collectWorkspaceFiles(run.siteId);
  const html =
    files.find((f) => f.path === "index.html") ??
    files.find((f) => f.path.endsWith(".html"));

  if (!html) {
    await finalizeFailure(
      { ...run, tools },
      (
        stderr ||
        stdout ||
        (result.code !== 0
          ? `OpenCode exited with code ${result.code}`
          : "OpenCode finished without writing HTML.")
      ).slice(0, 1200),
    );
    return;
  }

  const title = extractTitleFromHtml(html.content, "OpenCode Site");
  const { summary, chatContent } = buildCompletionMessage({
    title,
    files,
    agentText: bestText || lastText,
    model: run.model,
    provider: run.provider,
    siteId: run.siteId,
  });

  if (sessionId) await writeOpenCodeSessionId(run.siteId, sessionId);

  await finalizeSuccess(
    { ...run, tools, opencodeSessionId: sessionId },
    summary,
    title,
    chatContent,
  );
}
