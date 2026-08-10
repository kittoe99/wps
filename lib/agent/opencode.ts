import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { buildAgentTask, SYSTEM_PROMPT } from "./prompts";
import {
  resolveAgentModel,
  toOpenCodeModel,
  type AgentModelId,
} from "./models";
import { buildOpenCodeConfig } from "./opencode-config";
import { collectWorkspaceFiles } from "../sites/storage";
import type { GenerateRequest, ModelProvider, SiteFile } from "./types";

function extractTitleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

async function readSessionId(workspacePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.join(workspacePath, ".atelier", "opencode-session.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { sessionId?: string };
    return parsed.sessionId || null;
  } catch {
    return null;
  }
}

async function writeSessionId(workspacePath: string, sessionId: string) {
  const dir = path.join(workspacePath, ".atelier");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "opencode-session.json"),
    JSON.stringify({ sessionId, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

async function ensureWorkspaceAgentConfig(
  workDir: string,
  modelId: AgentModelId,
) {
  await fs.writeFile(
    path.join(workDir, "opencode.json"),
    JSON.stringify(buildOpenCodeConfig(toOpenCodeModel(modelId)), null, 2),
    "utf8",
  );
}

function summarizeEvents(raw: string): {
  summary: string;
  tools: string[];
  sessionId?: string;
} {
  const tools: string[] = [];
  let sessionId: string | undefined;
  let lastText = "";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const evt = JSON.parse(trimmed) as {
        type?: string;
        sessionID?: string;
        part?: {
          type?: string;
          tool?: string;
          text?: string;
          state?: { status?: string };
        };
      };
      if (evt.sessionID) sessionId = evt.sessionID;
      if (evt.type === "tool_use" && evt.part?.tool) {
        const status = evt.part.state?.status || "ran";
        tools.push(`${evt.part.tool}:${status}`);
      }
      if (evt.type === "text" && evt.part?.text) {
        lastText = evt.part.text.trim();
      }
    } catch {
      // ignore non-json lines
    }
  }

  const writeCount = tools.filter((t) =>
    /write|edit|apply|patch/i.test(t),
  ).length;
  const readCount = tools.filter((t) =>
    /read|glob|grep|list|bash/i.test(t),
  ).length;

  const summary =
    lastText.slice(0, 280) ||
    [
      "OpenCode agent",
      tools.length ? `${tools.length} tool call(s)` : null,
      readCount ? `${readCount} inspect` : null,
      writeCount ? `${writeCount} edit(s)` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return { summary, tools, sessionId };
}

function resolveOpenCodeBin(): string {
  const localExe = path.join(
    process.cwd(),
    "node_modules",
    "opencode-ai",
    "bin",
    process.platform === "win32" ? "opencode.exe" : "opencode",
  );
  return localExe;
}

/**
 * Full OpenCode coding agent — tools, surgical edits, session continuity.
 * Runs `opencode run --auto` inside the project workspace.
 */
export class OpenCodeProvider implements ModelProvider {
  name = "opencode";

  async generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "DEEPSEEK_API_KEY is required for OpenCode. Set it in .env.local.",
      );
    }

    const workDir = request.workspacePath;
    const modelId = resolveAgentModel(request.model);
    const existing = await collectWorkspaceFiles(request.siteId);
    const isIteration = existing.length > 0;
    const task = buildAgentTask(request.prompt, isIteration);

    await ensureWorkspaceAgentConfig(workDir, modelId);

    const sessionId = isIteration ? await readSessionId(workDir) : null;
    const bin = resolveOpenCodeBin();

    const args = [
      "run",
      "-m",
      toOpenCodeModel(modelId),
      "--dir",
      workDir,
      "--auto",
      "--format",
      "json",
    ];
    if (sessionId) {
      args.push("-s", sessionId);
    }
    args.push(`${SYSTEM_PROMPT}\n\n${task}`);

    let result = await this.spawnOpenCode(bin, args, workDir, apiKey);

    // If session resume fails, retry with a fresh session
    if (
      sessionId &&
      /session not found|failed to load session|unknown session/i.test(
        result.stdout + result.stderr,
      )
    ) {
      const freshArgs = args.filter(
        (a, i) => a !== "-s" && a !== sessionId && args[i - 1] !== "-s",
      );
      result = await this.spawnOpenCode(bin, freshArgs, workDir, apiKey);
    }

    const events = summarizeEvents(result.stdout);
    if (events.sessionId) {
      await writeSessionId(workDir, events.sessionId);
    }

    if (
      /Authentication Fails|Your api key:.*is invalid|"statusCode"\s*:\s*401/i.test(
        result.stdout + result.stderr,
      )
    ) {
      throw new Error(
        "OpenCode DeepSeek authentication failed. Check DEEPSEEK_API_KEY in .env.local.",
      );
    }

    const files = await collectWorkspaceFiles(request.siteId);
    const html =
      files.find((f) => f.path === "index.html") ??
      files.find((f) => f.path.endsWith(".html"));

    if (!html) {
      throw new Error(
        `OpenCode finished without HTML in the workspace.\n${(
          result.stderr ||
          result.stdout ||
          "No output"
        ).slice(0, 1200)}`,
      );
    }

    return {
      title: extractTitleFromHtml(html.content, "OpenCode Site"),
      summary: `${events.summary} · ${modelId}${
        events.tools.length
          ? ` · tools: ${events.tools.slice(0, 8).join(", ")}`
          : ""
      }`,
      files,
    };
  }

  private spawnOpenCode(
    bin: string,
    args: string[],
    workDir: string,
    apiKey: string,
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(bin, args, {
        cwd: workDir,
        env: {
          ...process.env,
          DEEPSEEK_API_KEY: apiKey,
          FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || "",
          OPENCODE_DISABLE_AUTOUPDATE: "1",
          // Do not throttle model output — allow full DeepSeek V4 generation budget
          OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX: "384000",
          OPENCODE_DISABLE_AUTOCOMPACT: "1",
        },
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (c) => {
        stdout += c.toString();
      });
      child.stderr.on("data", (c) => {
        stderr += c.toString();
      });
      child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
      child.on("error", (err) =>
        resolve({ code: 1, stdout, stderr: err.message }),
      );
    });
  }
}
