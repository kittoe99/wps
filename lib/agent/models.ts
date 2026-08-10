export const AGENT_MODELS = [
  {
    id: "deepseek-v4-flash",
    label: "V4 Flash",
    description: "Fast & affordable",
    opencode: "deepseek/deepseek-v4-flash",
  },
  {
    id: "deepseek-v4-pro",
    label: "V4 Pro",
    description: "Higher quality coding",
    opencode: "deepseek/deepseek-v4-pro",
  },
  {
    id: "kimi-k3",
    label: "Kimi K3",
    description: "Moonshot · 1M context",
    opencode: "moonshot/kimi-k3",
  },
] as const;

export type AgentModelId = (typeof AGENT_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: AgentModelId = "deepseek-v4-pro";

export function resolveAgentModel(input?: string | null): AgentModelId {
  const raw = (input || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL_ID).trim();
  const normalized = raw
    .replace(/^deepseek\//, "")
    .replace(/^moonshot\//, "")
    .replace(/^v4-/i, "deepseek-v4-")
    .toLowerCase();

  if (normalized === "deepseek-v4-flash" || normalized === "flash") {
    return "deepseek-v4-flash";
  }
  if (normalized === "deepseek-v4-pro" || normalized === "pro") {
    return "deepseek-v4-pro";
  }
  if (
    normalized === "kimi-k3" ||
    normalized === "kimi" ||
    normalized === "k3" ||
    normalized === "kimi k3"
  ) {
    return "kimi-k3";
  }
  if (raw.toLowerCase().includes("kimi")) return "kimi-k3";
  if (raw.includes("flash")) return "deepseek-v4-flash";
  return DEFAULT_MODEL_ID;
}

export function toOpenCodeModel(modelId: AgentModelId): string {
  return (
    AGENT_MODELS.find((m) => m.id === modelId)?.opencode ??
    `deepseek/${modelId}`
  );
}

export function getDeepSeekApiKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY || undefined;
}

export function hasDeepSeekConfigured(): boolean {
  return Boolean(getDeepSeekApiKey());
}

export function hasMoonshotConfigured(): boolean {
  return Boolean(process.env.MOONSHOT_API_KEY?.trim());
}
