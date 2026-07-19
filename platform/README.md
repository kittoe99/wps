# WPS Static Multi-Site Platform

Hosts tens of thousands of static sites on `*.wpscanvas.com` via NGINX + DigitalOcean Spaces, with a control-plane API for publish and future AI builders.

## Layout

```
platform/
  infra/          # Spaces, DNS/TLS scripts + inventory
  api/            # wps-platform-api (Express)
  edge/           # NGINX + cache sync + DOKS manifests
```

## Quick start (local API)

```bash
cd platform/api
cp .env.example .env
# fill DATABASE_URL, VALKEY_URL, SPACES_*, API_TOKEN
npm install
DATABASE_ADMIN_URL=... npm run db:init
npm run dev
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
| CRUD | `/webhooks` | Event endpoints for agents/integrations |
| PUT | `/integrations/sites/:slug/:provider` | Per-site external services |

Auth: `Authorization: Bearer $API_TOKEN` (except `/health` and `/resolve`).

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
