import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getWorkspaceDir } from "../sites/storage";

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface RunEvent {
  id: string;
  at: string;
  type: string;
  message?: string;
  tool?: string;
  toolStatus?: string;
  text?: string;
  raw?: unknown;
}

export interface AgentRun {
  id: string;
  siteId: string;
  prompt: string;
  model: string;
  provider: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  summary?: string;
  title?: string;
  opencodeSessionId?: string;
  tools: string[];
}

export interface ChatItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
  runId?: string;
}

const emitters = new Map<string, EventEmitter>();
const activeChildPids = new Map<string, number>();

function atelierDir(siteId: string) {
  return path.join(getWorkspaceDir(siteId), ".atelier");
}

function runDir(siteId: string, runId: string) {
  return path.join(atelierDir(siteId), "runs", runId);
}

function getEmitter(runId: string) {
  let emitter = emitters.get(runId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    emitters.set(runId, emitter);
  }
  return emitter;
}

export function subscribeRun(
  runId: string,
  listener: (event: RunEvent | { type: "status"; run: AgentRun }) => void,
) {
  const emitter = getEmitter(runId);
  emitter.on("event", listener);
  return () => emitter.off("event", listener);
}

export function emitRunUpdate(
  runId: string,
  payload: RunEvent | { type: "status"; run: AgentRun },
) {
  getEmitter(runId).emit("event", payload);
}

export async function ensureAtelier(siteId: string) {
  await fs.mkdir(atelierDir(siteId), { recursive: true });
}

export async function createRun(input: {
  siteId: string;
  prompt: string;
  model: string;
  provider: string;
}): Promise<AgentRun> {
  const id = randomUUID().slice(0, 10);
  const now = new Date().toISOString();
  const run: AgentRun = {
    id,
    siteId: input.siteId,
    prompt: input.prompt,
    model: input.model,
    provider: input.provider,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    tools: [],
  };

  await ensureAtelier(input.siteId);
  await fs.mkdir(runDir(input.siteId, id), { recursive: true });
  await writeRun(run);
  await fs.writeFile(path.join(runDir(input.siteId, id), "events.jsonl"), "");
  await setActiveRun(input.siteId, id);
  return run;
}

export async function writeRun(run: AgentRun) {
  await ensureAtelier(run.siteId);
  await fs.mkdir(runDir(run.siteId, run.id), { recursive: true });
  const next = { ...run, updatedAt: new Date().toISOString() };
  await fs.writeFile(
    path.join(runDir(run.siteId, run.id), "run.json"),
    JSON.stringify(next, null, 2),
    "utf8",
  );
  emitRunUpdate(run.id, { type: "status", run: next });
  return next;
}

export async function appendRunEvent(
  siteId: string,
  runId: string,
  event: Omit<RunEvent, "id" | "at"> & Partial<Pick<RunEvent, "id" | "at">>,
) {
  const full: RunEvent = {
    id: event.id ?? randomUUID().slice(0, 8),
    at: event.at ?? new Date().toISOString(),
    type: event.type,
    message: event.message,
    tool: event.tool,
    toolStatus: event.toolStatus,
    text: event.text,
    raw: event.raw,
  };
  const file = path.join(runDir(siteId, runId), "events.jsonl");
  await fs.appendFile(file, `${JSON.stringify(full)}\n`, "utf8");
  emitRunUpdate(runId, full);
  return full;
}

export async function readRun(
  siteId: string,
  runId: string,
): Promise<AgentRun | null> {
  try {
    const raw = await fs.readFile(
      path.join(runDir(siteId, runId), "run.json"),
      "utf8",
    );
    return JSON.parse(raw) as AgentRun;
  } catch {
    return null;
  }
}

export async function findRun(runId: string): Promise<AgentRun | null> {
  const root = path.join(process.cwd(), "workspaces");
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const run = await readRun(entry.name, runId);
    if (run) return run;
  }
  return null;
}

export async function readRunEvents(
  siteId: string,
  runId: string,
): Promise<RunEvent[]> {
  try {
    const raw = await fs.readFile(
      path.join(runDir(siteId, runId), "events.jsonl"),
      "utf8",
    );
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as RunEvent);
  } catch {
    return [];
  }
}

export async function setActiveRun(siteId: string, runId: string | null) {
  await ensureAtelier(siteId);
  const file = path.join(atelierDir(siteId), "active-run.json");
  if (!runId) {
    await fs.rm(file, { force: true });
    return;
  }
  await fs.writeFile(
    file,
    JSON.stringify({ runId, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

export async function getActiveRunId(siteId: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.join(atelierDir(siteId), "active-run.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { runId?: string };
    return parsed.runId ?? null;
  } catch {
    return null;
  }
}

export async function readChat(siteId: string): Promise<ChatItem[]> {
  try {
    const raw = await fs.readFile(
      path.join(atelierDir(siteId), "chat.json"),
      "utf8",
    );
    return JSON.parse(raw) as ChatItem[];
  } catch {
    return [];
  }
}

export async function writeChat(siteId: string, messages: ChatItem[]) {
  await ensureAtelier(siteId);
  await fs.writeFile(
    path.join(atelierDir(siteId), "chat.json"),
    JSON.stringify(messages, null, 2),
    "utf8",
  );
}

export async function appendChat(siteId: string, item: ChatItem) {
  const messages = await readChat(siteId);
  messages.push(item);
  await writeChat(siteId, messages);
  return messages;
}

export async function readOpenCodeSessionId(
  siteId: string,
): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.join(atelierDir(siteId), "opencode-session.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { sessionId?: string };
    return parsed.sessionId || null;
  } catch {
    return null;
  }
}

export async function writeOpenCodeSessionId(
  siteId: string,
  sessionId: string,
) {
  await ensureAtelier(siteId);
  await fs.writeFile(
    path.join(atelierDir(siteId), "opencode-session.json"),
    JSON.stringify({ sessionId, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

export function trackChildPid(runId: string, pid?: number) {
  if (pid) activeChildPids.set(runId, pid);
}

export function clearChildPid(runId: string) {
  activeChildPids.delete(runId);
}

export function getChildPid(runId: string) {
  return activeChildPids.get(runId);
}

export async function getSessionSnapshot(siteId: string) {
  const chat = await readChat(siteId);
  const activeRunId = await getActiveRunId(siteId);
  let activeRun: AgentRun | null = null;
  let events: RunEvent[] = [];
  if (activeRunId) {
    activeRun = await readRun(siteId, activeRunId);
    if (activeRun) {
      events = await readRunEvents(siteId, activeRunId);
      // If process died but status still running, mark interrupted on read
      if (
        activeRun.status === "running" &&
        !getChildPid(activeRunId) &&
        process.env.NODE_ENV !== "test"
      ) {
        // Keep as running if recently updated (< 2 min) — process may still exist after HMR
        const age = Date.now() - new Date(activeRun.updatedAt).getTime();
        if (age > 5 * 60_000) {
          activeRun = await writeRun({
            ...activeRun,
            status: "failed",
            error:
              "Run interrupted (server restarted). Start a new message to continue the workspace session.",
            finishedAt: new Date().toISOString(),
          });
          await setActiveRun(siteId, null);
        }
      }
    }
  }
  return {
    chat,
    activeRun,
    events,
    opencodeSessionId: await readOpenCodeSessionId(siteId),
  };
}
