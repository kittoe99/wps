import { createServer, type Server as HttpServer } from "node:http"
import { WebSocketServer, type WebSocket } from "ws"
import { verifyLiveWatchToken, agentWsListenPort } from "@/lib/agent-live-auth"
import { listenAgentRunProgress } from "@/lib/agent-run-bus"
import { buildRunWatchEvents, type WatchEvent } from "@/lib/agent-run-watch"

const globalWs = globalThis as unknown as {
  __wpsAgentWs?: { server: HttpServer; wss: WebSocketServer; port: number }
}

function send(ws: WebSocket, event: WatchEvent) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event))
  }
}

async function attachRunWatcher(
  ws: WebSocket,
  claims: { userId: string; runId: string; slug: string }
) {
  let lastUpdated = ""
  let lastTextLen = -1
  let lastStage = ""
  let lastEventCount = -1
  let closed = false
  let listener: { stop: () => Promise<void> } | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null

  const cleanup = async () => {
    if (closed) return
    closed = true
    if (pingTimer) clearInterval(pingTimer)
    pingTimer = null
    if (listener) {
      await listener.stop().catch(() => {})
      listener = null
    }
  }

  const pushLatest = async () => {
    const result = await buildRunWatchEvents({
      runId: claims.runId,
      userId: claims.userId,
      slug: claims.slug,
      lastUpdated,
      lastTextLen,
      lastStage,
      lastEventCount,
    })
    lastUpdated = result.lastUpdated
    lastTextLen = result.lastTextLen
    lastStage = result.lastStage
    lastEventCount = result.lastEventCount
    for (const event of result.events) send(ws, event)
    return result.done
  }

  send(ws, { type: "hello", transport: "ws" })

  try {
    const doneImmediately = await pushLatest()
    if (doneImmediately) {
      await cleanup()
      ws.close()
      return
    }

    listener = await listenAgentRunProgress({
      runId: claims.runId,
      onNotify: () => {
        void pushLatest().then(async (done) => {
          if (done) {
            await cleanup()
            ws.close()
          }
        })
      },
      onError: (err) => {
        send(ws, { type: "error", error: err.message })
      },
    })
  } catch (err) {
    send(ws, {
      type: "error",
      error: err instanceof Error ? err.message : "Live watch failed",
    })
    send(ws, { type: "done" })
    await cleanup()
    ws.close()
    return
  }

  pingTimer = setInterval(() => {
    if (closed) return
    send(ws, { type: "ping" })
  }, 15000)

  ws.on("close", () => {
    void cleanup()
  })
  ws.on("error", () => {
    void cleanup()
  })
}

export function startAgentWsServer() {
  if (process.env.VERCEL === "1") return null
  if (process.env.AGENT_WS_ENABLED === "0") return null
  if (globalWs.__wpsAgentWs) return globalWs.__wpsAgentWs

  const port = agentWsListenPort()
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("ok")
      return
    }
    res.writeHead(404)
    res.end()
  })

  const wss = new WebSocketServer({ server, path: "/agent-live" })

  wss.on("connection", (ws, req) => {
    void (async () => {
      try {
        const url = new URL(req.url || "/", "http://localhost")
        const token = url.searchParams.get("token") || ""
        const claims = await verifyLiveWatchToken(token)
        if (!claims) {
          send(ws, { type: "error", error: "Unauthorized" })
          send(ws, { type: "done" })
          ws.close()
          return
        }
        await attachRunWatcher(ws, claims)
      } catch (err) {
        send(ws, {
          type: "error",
          error: err instanceof Error ? err.message : "WS failed",
        })
        send(ws, { type: "done" })
        ws.close()
      }
    })()
  })

  server.listen(port, "0.0.0.0", () => {
    console.log(`[agent-ws] listening on ws://0.0.0.0:${port}/agent-live`)
  })

  server.on("error", (err) => {
    console.error("[agent-ws] server error:", err)
  })

  globalWs.__wpsAgentWs = { server, wss, port }
  return globalWs.__wpsAgentWs
}
