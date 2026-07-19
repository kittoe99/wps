import express from "express"
import cors from "cors"
import { sitesRouter } from "./routes/sites.js"
import { webhooksRouter } from "./routes/webhooks.js"
import { integrationsRouter } from "./routes/integrations.js"
import { resolveRouter } from "./routes/resolve.js"
import { tenantsRouter } from "./routes/tenants.js"
import { requireApiToken } from "./lib/auth.js"

const app = express()
const port = Number(process.env.PORT || 8080)

app.use(cors())
app.use(express.json({ limit: "10mb" }))

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "wps-platform-api" })
})

// Public resolve endpoint for edge (optionally protect with network policy)
app.use("/resolve", resolveRouter)

app.use(requireApiToken)
app.use("/tenants", tenantsRouter)
app.use("/sites", sitesRouter)
app.use("/webhooks", webhooksRouter)
app.use("/integrations", integrationsRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(port, () => {
  console.log(`wps-platform-api listening on :${port}`)
})
