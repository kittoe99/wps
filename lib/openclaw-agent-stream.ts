import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign,
} from "node:crypto"
import WebSocket from "ws"

export type OpenClawAgentEvent = {
  runId: string
  sessionKey?: string
  sessionId?: string
  agentId?: string
  stream: string
  data: Record<string, unknown>
  seq?: number
  ts?: number
}

type RunResult = {
  text: string
  result?: Record<string, unknown>
}

function config() {
  const httpUrl = (process.env.OPENCLAW_URL || "").replace(/\/$/, "")
  const token = process.env.OPENCLAW_GATEWAY_TOKEN || ""
  const deviceId = process.env.OPENCLAW_DEVICE_ID || ""
  const privateKeyB64 = process.env.OPENCLAW_DEVICE_PRIVATE_KEY_B64 || ""
  const publicKeyB64 = process.env.OPENCLAW_DEVICE_PUBLIC_KEY_B64 || ""
  if (!httpUrl || !token || !deviceId || !privateKeyB64 || !publicKeyB64) {
    throw new Error("OpenClaw event-stream device is not configured")
  }
  return {
    wsUrl: httpUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:"),
    token,
    deviceId,
    privateKeyPem: Buffer.from(privateKeyB64, "base64").toString("utf8"),
    publicKeyPem: Buffer.from(publicKeyB64, "base64").toString("utf8"),
  }
}

export function hasOpenClawEventStreamConfig() {
  return Boolean(
    process.env.OPENCLAW_DEVICE_ID &&
      process.env.OPENCLAW_DEVICE_PRIVATE_KEY_B64 &&
      process.env.OPENCLAW_DEVICE_PUBLIC_KEY_B64
  )
}

export async function runOpenClawAgentStream(input: {
  runId: string
  sessionKey: string
  message: string
  thinking?: string
  timeoutMs: number
  signal?: AbortSignal
  onEvent: (event: OpenClawAgentEvent) => void | Promise<void>
  onText: (delta: string) => void | Promise<void>
}): Promise<RunResult> {
  const cfg = config()
  const privateKey = createPrivateKey(cfg.privateKeyPem)
  const publicKey = createPublicKey(cfg.publicKeyPem)
  const publicDer = publicKey.export({ type: "spki", format: "der" })
  const publicRaw = publicDer.subarray(publicDer.length - 32)
  const derivedId = createHash("sha256").update(publicRaw).digest("hex")
  if (derivedId !== cfg.deviceId) {
    throw new Error("OpenClaw event-stream device identity is invalid")
  }

  return new Promise<RunResult>((resolve, reject) => {
    const ws = new WebSocket(cfg.wsUrl)
    const requestId = randomUUID()
    let settled = false
    let accepted = false
    let text = ""
    let eventQueue = Promise.resolve()

    const cleanup = () => {
      clearTimeout(timer)
      input.signal?.removeEventListener("abort", onAbort)
      try {
        ws.close()
      } catch {
        /* already closed */
      }
    }

    const finish = (result?: Record<string, unknown>) => {
      if (settled) return
      settled = true
      void eventQueue.finally(() => {
        cleanup()
        resolve({ text: text.trim(), result })
      })
    }

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const send = (id: string, method: string, params: Record<string, unknown>) => {
      ws.send(JSON.stringify({ type: "req", id, method, params }))
    }

    const abortRun = (reason: unknown) => {
      if (ws.readyState === WebSocket.OPEN && accepted) {
        send(randomUUID(), "sessions.abort", { runId: input.runId })
      }
      fail(
        reason instanceof Error
          ? reason
          : new Error(typeof reason === "string" ? reason : "Cancelled")
      )
    }
    const onAbort = () => abortRun(input.signal?.reason)

    const timer = setTimeout(
      () => abortRun(new Error("OpenClaw agent timed out")),
      input.timeoutMs
    )
    if (input.signal) {
      if (input.signal.aborted) {
        onAbort()
        return
      }
      input.signal.addEventListener("abort", onAbort)
    }

    ws.on("message", (raw) => {
      let frame: {
        type?: string
        id?: string
        ok?: boolean
        event?: string
        payload?: Record<string, unknown>
        error?: { message?: string }
      }
      try {
        frame = JSON.parse(String(raw))
      } catch {
        return
      }

      if (frame.type === "event" && frame.event === "connect.challenge") {
        const challenge = frame.payload || {}
        const nonce = String(challenge.nonce || "")
        const signedAt = Date.now()
        const scopes = ["operator.read", "operator.write"]
        const payload = [
          "v2",
          cfg.deviceId,
          "cli",
          "cli",
          "operator",
          scopes.join(","),
          String(signedAt),
          cfg.token,
          nonce,
        ].join("|")
        const signature = sign(null, Buffer.from(payload), privateKey).toString(
          "base64url"
        )
        send("connect", "connect", {
          minProtocol: 4,
          maxProtocol: 4,
          client: {
            id: "cli",
            version: "0.1.0",
            platform: "linux",
            mode: "cli",
          },
          role: "operator",
          scopes,
          caps: ["tool-events"],
          commands: [],
          permissions: {},
          auth: { token: cfg.token },
          locale: "en-US",
          userAgent: "wps-canvas/0.1",
          device: {
            id: cfg.deviceId,
            publicKey: publicRaw.toString("base64url"),
            signature,
            signedAt,
            nonce,
          },
        })
        return
      }

      if (frame.type === "res" && frame.id === "connect") {
        if (!frame.ok) {
          fail(
            new Error(
              frame.error?.message || "OpenClaw event-stream connection failed"
            )
          )
          return
        }
        send(requestId, "agent", {
          message: input.message,
          sessionKey: input.sessionKey,
          thinking: input.thinking || "off",
          idempotencyKey: input.runId,
          timeout: Math.ceil(input.timeoutMs / 1000),
        })
        return
      }

      if (frame.type === "event" && frame.event === "agent") {
        const payload = frame.payload as OpenClawAgentEvent | undefined
        if (!payload || payload.runId !== input.runId) return
        eventQueue = eventQueue.then(() => input.onEvent(payload))
        if (payload.stream === "assistant") {
          const delta =
            typeof payload.data.delta === "string" ? payload.data.delta : ""
          const cumulative =
            typeof payload.data.text === "string" ? payload.data.text : ""
          const next = delta || (cumulative.startsWith(text) ? cumulative.slice(text.length) : "")
          if (next) {
            text += next
            eventQueue = eventQueue.then(() => input.onText(next))
          }
        }
        return
      }

      if (frame.type === "res" && frame.id === requestId) {
        if (!frame.ok) {
          fail(new Error(frame.error?.message || "OpenClaw agent failed"))
          return
        }
        const payload = frame.payload || {}
        const status = String(payload.status || "")
        if (status === "accepted" || status === "in_flight") {
          accepted = true
          return
        }
        const result = payload.result as Record<string, unknown> | undefined
        if (!text && result) {
          const payloads = result.payloads as
            | Array<{ text?: string }>
            | undefined
          text = payloads?.map((item) => item.text || "").join("") || ""
        }
        finish(result)
      }
    })

    ws.on("error", (error) => fail(error))
    ws.on("close", () => {
      if (!settled) fail(new Error("OpenClaw event stream disconnected"))
    })
  })
}
