import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { buildAgentTask, SYSTEM_PROMPT } from "./prompts";
import { buildLocalSite } from "./local-builder";
import { DeepSeekProvider } from "./deepseek";
import { OpenCodeProvider } from "./opencode";
import { hasDeepSeekConfigured } from "./models";
import { collectWorkspaceFiles, writeWorkspaceFiles } from "../sites/storage";
import type { GenerateRequest, ModelProvider, SiteFile } from "./types";

function extractTitleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const bin =
      isWin && command === "npx"
        ? "npx.cmd"
        : isWin && command === "where"
          ? "where.exe"
          : command;

    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, ...env } as NodeJS.ProcessEnv,
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
    child.on("error", (err) => {
      resolve({ code: 1, stdout, stderr: err.message });
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = await runCommand(probe, [command], process.cwd());
  return result.code === 0;
}

async function readWorkspaceResult(
  siteId: string,
  fallbackTitle: string,
): Promise<{ title: string; files: SiteFile[] }> {
  const files = await collectWorkspaceFiles(siteId);
  const htmlFiles = files.filter((f) => f.path.endsWith(".html"));
  if (htmlFiles.length === 0) {
    throw new Error(
      "Agent finished but no HTML files were found in the workspace.",
    );
  }
  const index = files.find((f) => f.path === "index.html") ?? htmlFiles[0];
  return {
    title: extractTitleFromHtml(index.content, fallbackTitle),
    files,
  };
}

export { OpenCodeProvider };

/**
 * OpenHands CLI — competitive autonomous coding agent (when installed).
 */
export class OpenHandsProvider implements ModelProvider {
  name = "openhands";

  async generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }> {
    const workDir = request.workspacePath;
    const message = `${SYSTEM_PROMPT}\n\n${buildAgentTask(request.prompt, false)}`;
    const result = await runCommand(
      "openhands",
      [
        "--headless",
        "--json",
        "--override-with-envs",
        "--exit-without-confirmation",
        "-t",
        message,
      ],
      workDir,
      { OPENHANDS_SUPPRESS_BANNER: "1" },
    );

    try {
      const { title, files } = await readWorkspaceResult(
        request.siteId,
        "OpenHands Site",
      );
      return {
        title,
        summary: `Built with OpenHands in workspace ${request.siteId}.`,
        files,
      };
    } catch (error) {
      throw new Error(
        `OpenHands produced no HTML. ${result.stderr || result.stdout || (error instanceof Error ? error.message : "")}`,
      );
    }
  }
}

/**
 * Aider — git-native terminal coding agent (when installed).
 */
export class AiderProvider implements ModelProvider {
  name = "aider";

  async generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }> {
    const workDir = request.workspacePath;

    try {
      await fs.access(path.join(workDir, ".git"));
    } catch {
      await runCommand("git", ["init"], workDir);
    }

    const message = `${SYSTEM_PROMPT}\n\n${buildAgentTask(request.prompt, false)}`;
    const result = await runCommand(
      "aider",
      ["--yes", "--message", message, "index.html"],
      workDir,
    );

    try {
      const { title, files } = await readWorkspaceResult(
        request.siteId,
        "Aider Site",
      );
      return {
        title,
        summary: `Built with Aider in workspace ${request.siteId}.`,
        files,
      };
    } catch (error) {
      throw new Error(
        `Aider produced no HTML. ${result.stderr || result.stdout || (error instanceof Error ? error.message : "")}`,
      );
    }
  }
}

export class LocalProvider implements ModelProvider {
  name = "local";

  async generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const built = buildLocalSite(request.prompt);
    await writeWorkspaceFiles(request.siteId, built.files);
    const files = await collectWorkspaceFiles(request.siteId);
    return {
      title: built.title,
      summary: `${built.summary} Workspace: ${request.siteId}.`,
      files,
    };
  }
}

export type AgentBackend =
  "auto" | "opencode" | "deepseek" | "openhands" | "aider" | "local";

export async function resolveProvider(): Promise<ModelProvider> {
  const requested = (process.env.CODING_AGENT || "opencode") as AgentBackend;

  if (requested === "local") return new LocalProvider();
  if (requested === "deepseek") return new DeepSeekProvider();
  if (requested === "opencode") return new OpenCodeProvider();
  if (requested === "openhands") return new OpenHandsProvider();
  if (requested === "aider") return new AiderProvider();

  // auto → full OpenCode agent when DeepSeek is configured
  if (hasDeepSeekConfigured()) {
    return new OpenCodeProvider();
  }
  if (await commandExists("openhands")) {
    return new OpenHandsProvider();
  }
  if (await commandExists("aider")) {
    return new AiderProvider();
  }

  return new LocalProvider();
}

export function getProvider(): ModelProvider {
  const requested = (process.env.CODING_AGENT || "opencode") as AgentBackend;
  switch (requested) {
    case "deepseek":
      return new DeepSeekProvider();
    case "opencode":
      return new OpenCodeProvider();
    case "openhands":
      return new OpenHandsProvider();
    case "aider":
      return new AiderProvider();
    case "local":
    default:
      return new LocalProvider();
  }
}
