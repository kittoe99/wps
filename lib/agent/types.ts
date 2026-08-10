export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface SiteFile {
  path: string;
  content: string;
}

export interface GenerateRequest {
  prompt: string;
  history?: ChatMessage[];
  siteId: string;
  /** Absolute path to the project's dedicated agent workspace */
  workspacePath: string;
  /** Model id, e.g. deepseek-v4-pro | deepseek-v4-flash */
  model?: string;
}

export interface GenerateResult {
  siteId: string;
  title: string;
  summary: string;
  files: SiteFile[];
  provider: string;
  workspacePath: string;
  model?: string;
}

export interface SiteMeta {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  files: string[];
  /** Absolute path to the project workspace on disk */
  workspacePath: string;
}

export interface ModelProvider {
  name: string;
  generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }>;
}
