export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return
  // Long-lived WebSocket feeder for local / Node hosts (not on Vercel serverless).
  const { startAgentWsServer } = await import("@/lib/agent-ws-server")
  startAgentWsServer()
}
