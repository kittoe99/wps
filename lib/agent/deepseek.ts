import OpenAI from "openai";
import { SYSTEM_PROMPT, buildAgentTask } from "./prompts";
import {
  getDeepSeekApiKey,
  resolveAgentModel,
  type AgentModelId,
} from "./models";
import { collectWorkspaceFiles, writeWorkspaceFiles } from "../sites/storage";
import type { GenerateRequest, ModelProvider, SiteFile } from "./types";

function extractTitleFromHtml(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

function stripFences(text: string) {
  return text
    .replace(/^```(?:json|html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseFilesFromResponse(content: string): SiteFile[] {
  const cleaned = stripFences(content);

  try {
    const parsed = JSON.parse(cleaned) as {
      files?: SiteFile[];
      title?: string;
    };
    if (Array.isArray(parsed.files) && parsed.files.length > 0) {
      return parsed.files.filter(
        (f) => f && typeof f.path === "string" && typeof f.content === "string",
      );
    }
  } catch {
    // fall through to HTML extraction
  }

  const htmlMatch = cleaned.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
  if (htmlMatch) {
    return [{ path: "index.html", content: htmlMatch[0] }];
  }

  if (/<html[\s\S]*<\/html>/i.test(cleaned)) {
    return [{ path: "index.html", content: cleaned }];
  }

  throw new Error(
    "DeepSeek response did not include valid HTML or files JSON.",
  );
}

export class DeepSeekProvider implements ModelProvider {
  name = "deepseek";

  constructor(private readonly modelId?: AgentModelId) {}

  async generate(request: GenerateRequest): Promise<{
    title: string;
    summary: string;
    files: SiteFile[];
  }> {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not set.");
    }

    const model = resolveAgentModel(
      request.model || this.modelId || process.env.DEEPSEEK_MODEL,
    );

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const existing = await collectWorkspaceFiles(request.siteId);
    const existingNote =
      existing.length > 0
        ? `\n\nExisting workspace files:\n${existing
            .map((f) => `- ${f.path} (${f.content.length} chars)`)
            .join(
              "\n",
            )}\nIf this is an iteration, update those files rather than starting from scratch.`
        : "";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      max_tokens: 384000,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "title": "Site title",
  "summary": "One sentence summary",
  "files": [
    { "path": "index.html", "content": "<!DOCTYPE html>..." }
  ]
}

Build a fully functional website. Prefer multiple real HTML pages when the brief needs them (index.html + about.html, contact.html, etc.), linked with relative hrefs only (never /absolute paths). Do not truncate. Every HTML file must be a complete document using Tailwind CDN.`,
        },
        {
          role: "user",
          content: `${buildAgentTask(request.prompt, existing.length > 0)}${existingNote}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned an empty response.");
    }

    const files = parseFilesFromResponse(content);
    await writeWorkspaceFiles(request.siteId, files);

    const written = await collectWorkspaceFiles(request.siteId);
    const index =
      written.find((f) => f.path === "index.html") ??
      written.find((f) => f.path.endsWith(".html"));
    if (!index) {
      throw new Error("DeepSeek did not write an HTML file to the workspace.");
    }

    let title = extractTitleFromHtml(index.content, "DeepSeek Site");
    try {
      const parsed = JSON.parse(stripFences(content)) as { title?: string };
      if (parsed.title) title = parsed.title;
    } catch {
      // keep title from HTML
    }

    return {
      title,
      summary: `Built with DeepSeek ${model} in workspace ${request.siteId}.`,
      files: written,
    };
  }
}
