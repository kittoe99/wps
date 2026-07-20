# WPS Static Multi-Site Platform

Hosts tens of thousands of static sites on `*.wpscanvas.com` via NGINX + DigitalOcean Spaces, with a control-plane API for publish and future AI builders.

## Layout

```
platform/
  infra/          # Spaces, DNS/TLS scripts + inventory
  api/            # wps-platform-api (Express)
  edge/           # NGINX + cache sync + DOKS manifests
  builder/        # OpenClaw sandbox image, publish CLI, build prompts
```

## Quick start (local API)

```bash
cd platform/api
cp .env.example .env
# fill DATABASE_URL, VALKEY_URL, SPACES_*, API_TOKEN
npm install
DATABASE_ADMIN_URL=... npm run db:init
npm run dev
# optional workers:
npm run worker:publish
npm run worker:build
```

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health |
| GET | `/resolve/:slug` | Edge lookup (live sites) |
| GET/POST | `/sites` | List / create |
| GET/PATCH | `/sites/:slug` | Get / update status |
| POST | `/sites/:slug/upload-urls` | Presigned Spaces uploads |
| POST | `/sites/:slug/publish` | Activate version (sync or `async: true`) |
| POST | `/sites/:slug/build` | Queue OpenClaw sandbox site build |
| GET | `/sites/:slug/builds` | List builds |
| GET | `/sites/:slug/builds/:id` | Build status |
| CRUD | `/webhooks` | Event endpoints for agents/integrations |
| PUT | `/integrations/sites/:slug/:provider` | Per-site external services |

Auth: `Authorization: Bearer $API_TOKEN` (except `/health` and `/resolve`).

### Build example (OpenClaw agent)

```bash
curl -X POST https://api.wpscanvas.com/sites/acme/build \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": {
      "businessName": "Acme Dental",
      "industry": "dentist",
      "tone": "calm professional",
      "researchUrls": ["https://competitor.example"]
    }
  }'
# → 202 { buildId, sessionId, version }
```

### Publish example (AI agent / builder)

```bash
curl -X POST https://api.wpscanvas.com/sites/acme/publish \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "files": [
      { "path": "index.html", "content": "<h1>Hello</h1>", "contentType": "text/html" }
    ]
  }'
```

Site becomes live at `https://acme.wpscanvas.com`.

## OpenClaw website builder

Droplet `wps-openclaw-builder` runs the OpenClaw gateway with per-session Docker sandboxes (`wps-site-builder-sandbox`) and Moonshot Kimi (`moonshot/kimi-k3`).

```bash
# On droplet after secrets are set:
bash /opt/wps-builder/scripts/install-openclaw.sh
bash /opt/wps-builder/scripts/build-sandbox-image.sh
```

See `platform/builder/` and `platform/infra/INVENTORY.md`.

## Deploy edge (DOKS)

Cluster: `wps-sites-edge` (`b2f46004-a385-48b6-a615-7be664b5d9b7`)

```bash
doctl kubernetes cluster kubeconfig save wps-sites-edge
kubectl apply -f platform/edge/k8s/namespace-pvc.yaml
kubectl apply -f platform/edge/k8s/nginx-configmap.yaml
# create secrets from secret.example.yaml
kubectl apply -f platform/edge/k8s/deployment.yaml
kubectl apply -f platform/edge/k8s/platform-api.yaml
kubectl -n wps-edge get svc edge-nginx -w   # wait for EXTERNAL-IP
EDGE_LB_IP=... ./platform/infra/dns/provision-dns-tls.sh
```

## Infrastructure checklist

See [infra/INVENTORY.md](infra/INVENTORY.md).
