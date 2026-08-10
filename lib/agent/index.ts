import { randomUUID } from "crypto";
import { resolveProvider } from "./provider";
import {
  AGENT_MODELS,
  hasDeepSeekConfigured,
  resolveAgentModel,
  toOpenCodeModel,
} from "./models";
import { hasFirecrawlConfigured } from "./opencode-config";
import {
  createWorkspace,
  getSite,
  getWorkspaceDir,
  updateWorkspaceBrief,
  writeSiteMeta,
} from "../sites/storage";
import type { GenerateRequest, GenerateResult } from "./types";

export async function runAgent(input: {
  prompt: string;
  siteId?: string;
  model?: string;
}): Promise<GenerateResult> {
  const provider = await resolveProvider();
  const isNew = !input.siteId;
  const siteId = input.siteId ?? randomUUID().slice(0, 8);
  const existing = input.siteId ? await getSite(input.siteId) : null;
  const modelId = resolveAgentModel(input.model);

  // Every project gets a dedicated on-disk workspace the agent owns.
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

  const request: GenerateRequest = {
    prompt: input.prompt,
    siteId,
    workspacePath,
    model: provider.name === "opencode" ? toOpenCodeModel(modelId) : modelId,
  };

  const generated = await provider.generate(request);

  const meta = {
    id: siteId,
    title: generated.title,
    prompt: input.prompt,
    summary: generated.summary,
    provider: provider.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: new Date().toISOString(),
    files: generated.files.map((f) => f.path),
    workspacePath,
  };

  await writeSiteMeta(meta);

  return {
    siteId,
    title: generated.title,
    summary: generated.summary,
    files: generated.files,
    provider: provider.name,
    workspacePath,
    model: modelId,
  };
}

export async function getActiveProviderName(): Promise<string> {
  const provider = await resolveProvider();
  return provider.name;
}

export function getAgentStatus() {
  return {
    models: AGENT_MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      description: m.description,
    })),
    deepseekConfigured: hasDeepSeekConfigured(),
    firecrawlConfigured: hasFirecrawlConfigured(),
    defaultModel: resolveAgentModel(process.env.DEEPSEEK_MODEL),
  };
}
