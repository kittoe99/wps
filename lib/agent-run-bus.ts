import { Client } from "pg"
import { resolveDatabaseUrl } from "@/lib/db"
import { getDbSsl } from "@/lib/db-ssl"

export const AGENT_RUN_CHANNEL = "wps_agent_run"

export type AgentRunNotifyPayload = {
  runId: string
  siteId?: string
  at: string
}

function normalizeConnectionString(connectionString: string) {
  const url = new URL(connectionString)
  url.searchParams.delete("sslmode")
  url.searchParams.set("uselibpqcompat", "true")
  url.searchParams.set("sslmode", "require")
  return url.toString()
}

/** Fire-and-forget progress signal for live UI subscribers. */
export async function notifyAgentRunProgress(runId: string, siteId?: string) {
  try {
    const { getPool } = await import("@/lib/db")
    const payload: AgentRunNotifyPayload = {
      runId,
      siteId,
      at: new Date().toISOString(),
    }
    await getPool().query(`SELECT pg_notify($1, $2)`, [
      AGENT_RUN_CHANNEL,
      JSON.stringify(payload),
    ])
  } catch (err) {
    console.warn("notifyAgentRunProgress:", err)
  }
}

/**
 * Dedicated LISTEN connection. Call `stop()` when the subscriber disconnects.
 * Invokes `onNotify` for matching runId (or all if runId is null).
 */
export async function listenAgentRunProgress(input: {
  runId?: string | null
  onNotify: (payload: AgentRunNotifyPayload) => void
  onError?: (err: Error) => void
}): Promise<{ stop: () => Promise<void> }> {
  const client = new Client({
    connectionString: normalizeConnectionString(resolveDatabaseUrl()),
    ssl: getDbSsl(),
  })

  await client.connect()
  await client.query(`LISTEN ${AGENT_RUN_CHANNEL}`)

  const handler = (msg: { channel: string; payload?: string }) => {
    if (msg.channel !== AGENT_RUN_CHANNEL || !msg.payload) return
    try {
      const data = JSON.parse(msg.payload) as AgentRunNotifyPayload
      if (input.runId && data.runId !== input.runId) return
      input.onNotify(data)
    } catch {
      /* ignore bad payloads */
    }
  }

  client.on("notification", handler)
  client.on("error", (err) => {
    input.onError?.(err instanceof Error ? err : new Error(String(err)))
  })

  return {
    async stop() {
      try {
        client.removeListener("notification", handler)
        await client.query(`UNLISTEN ${AGENT_RUN_CHANNEL}`)
        await client.end()
      } catch {
        try {
          client.end()
        } catch {
          /* ignore */
        }
      }
    },
  }
}
