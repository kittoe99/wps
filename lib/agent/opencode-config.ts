/** DeepSeek V4 published caps — use full capacity, do not throttle. */
export const DEEPSEEK_CONTEXT_TOKENS = 1_000_000;
export const DEEPSEEK_OUTPUT_TOKENS = 384_000;

export function buildOpenCodeConfig(opencodeModel: string) {
  const modelLimits = {
    limit: {
      context: DEEPSEEK_CONTEXT_TOKENS,
      output: DEEPSEEK_OUTPUT_TOKENS,
    },
  };

  const firecrawlKey = process.env.FIRECRAWL_API_KEY?.trim();
  const firecrawlCommand =
    process.platform === "win32"
      ? ["cmd", "/c", "npx", "-y", "firecrawl-mcp"]
      : ["npx", "-y", "firecrawl-mcp"];

  return {
    $schema: "https://opencode.ai/config.json",
    model: opencodeModel,
    small_model: "deepseek/deepseek-v4-flash",
    instructions: ["AGENTS.md", "BRIEF.md"],
    compaction: {
      auto: false,
    },
    provider: {
      deepseek: {
        npm: "@ai-sdk/openai-compatible",
        name: "DeepSeek",
        options: {
          baseURL: "https://api.deepseek.com/v1",
          apiKey: "{env:DEEPSEEK_API_KEY}",
          timeout: 600000,
        },
        models: {
          "deepseek-v4-pro": {
            name: "DeepSeek V4 Pro",
            ...modelLimits,
          },
          "deepseek-v4-flash": {
            name: "DeepSeek V4 Flash",
            ...modelLimits,
          },
        },
      },
      moonshot: {
        npm: "@ai-sdk/openai-compatible",
        name: "Kimi",
        options: {
          baseURL: "https://api.moonshot.ai/v1",
          apiKey: "{env:MOONSHOT_API_KEY}",
          timeout: 600000,
        },
        models: {
          "kimi-k3": {
            name: "Kimi K3",
            limit: {
              context: 1048576,
              output: 131072,
            },
            options: {
              temperature: 1,
              top_p: 0.95,
              frequency_penalty: 0,
              presence_penalty: 0,
            },
          },
        },
      },
    },
    /**
     * Full Firecrawl MCP surface (search, scrape, map, crawl, extract, agent, interact, …).
     * Same API key as Cursor MCP (`FIRECRAWL_API_KEY`).
     */
    mcp: {
      firecrawl: {
        type: "remote",
        url: "https://mcp.firecrawl.dev/v2/mcp",
        enabled: Boolean(firecrawlKey),
        oauth: false,
        // Crawl / agent research can take a while
        timeout: 300000,
        headers: {
          Authorization: "Bearer {env:FIRECRAWL_API_KEY}",
        },
      },
      "firecrawl-local": {
        type: "local",
        command: firecrawlCommand,
        enabled: false,
        timeout: 300000,
        environment: {
          FIRECRAWL_API_KEY: "{env:FIRECRAWL_API_KEY}",
        },
      },
    },
    tools: {
      // Explicitly enable every Firecrawl capability (no tool denylist)
      "firecrawl*": true,
      "firecrawl_*": true,
      firecrawl_search: true,
      firecrawl_scrape: true,
      firecrawl_map: true,
      firecrawl_crawl: true,
      firecrawl_check_crawl_status: true,
      firecrawl_extract: true,
      firecrawl_parse: true,
      firecrawl_agent: true,
      firecrawl_agent_status: true,
      firecrawl_interact: true,
      firecrawl_interact_stop: true,
      firecrawl_developer_search: true,
      firecrawl_research_search_github: true,
      firecrawl_research_search_papers: true,
      firecrawl_research_inspect_paper: true,
      firecrawl_research_read_paper: true,
      firecrawl_research_related_papers: true,
    },
    permission: {
      "*": "allow",
      edit: "allow",
      bash: "allow",
      read: "allow",
      write: "allow",
      glob: "allow",
      grep: "allow",
      list: "allow",
      "firecrawl*": "allow",
      "mcp*": "allow",
    },
  };
}

export function hasFirecrawlConfigured() {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}
