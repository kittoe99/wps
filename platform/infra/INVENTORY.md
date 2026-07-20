# Platform infrastructure inventory (DigitalOcean)

## Provisioned resources

| Resource | ID / Name | Region | Status |
|----------|-----------|--------|--------|
| VPC | `0821db52-f865-47fe-ac26-2e6595c6f3eb` (`default-nyc3`) | nyc3 | ready |
| Postgres | `2a7f6a84-5c56-498d-ac99-6523023ab313` (`wps-canvas-submissions`) | nyc3 | online; DB `platform` schema applied |
| Valkey | `2094c71b-2df0-4af5-b3b5-0eb806e82d0c` (`wps-platform-valkey`) | nyc3 | online |
| DOKS | `b2f46004-a385-48b6-a615-7be664b5d9b7` (`wps-sites-edge`) | nyc3 | cluster created (nodes may still be provisioning); manifests in `platform/edge/k8s/` |
| DNS zone | `wpscanvas.com` | — | zone created; `*`, `www`, `api` A records (placeholder IP until LB exists) |
| Droplet | `585810927` (`wps-openclaw-builder`) | nyc3 | `s-2vcpu-4gb`, Ubuntu 24.04; OpenClaw gateway `:18789`; public IP `64.225.15.54` |
| Firewall | `e802e54f-16af-4888-8971-6e2827b3b782` (`wps-openclaw-builder-fw`) | — | SSH + 18789 restricted to admin IP |

## OpenClaw builder

- Config: `/root/.openclaw/openclaw.json` on droplet — default model `moonshot/kimi-k3`, sandbox `mode: all` / `scope: session`, image `wps-site-builder-sandbox:latest`
- Set `MOONSHOT_API_KEY` in `/opt/openclaw/.env` (Kimi Open Platform key), then restart gateway
- Cursor MCP `OPENCLAW_URL=http://64.225.15.54:18789`
- Platform: `POST /sites/:slug/build` → Valkey `build:jobs` → `npm run worker:build`

## Manual / script steps remaining

1. **Spaces** — create Spaces access key in DO control panel, then:
   ```bash
   export SPACES_KEY=... SPACES_SECRET=...
   ./platform/infra/spaces/provision-spaces.sh
   ```
   Enable CDN on bucket `wps-sites` in the control panel.

2. **Registrar NS** — point `wpscanvas.com` nameservers to DigitalOcean, then:
   ```bash
   export DIGITALOCEAN_TOKEN=... EDGE_LB_IP=<from kubectl get svc>
   ./platform/infra/dns/provision-dns-tls.sh
   ```
   Let's Encrypt wildcard cert requires DO nameservers.

3. **Deploy edge** after DOKS is running:
   ```bash
   doctl kubernetes cluster kubeconfig save wps-sites-edge
   # create edge-secrets
   ./platform/infra/scripts/deploy-edge.sh
   ```

4. **Storage autoscaling** (Postgres):
   ```bash
   DIGITALOCEAN_TOKEN=... ./scripts/enable-storage-autoscale.sh
   ```

## Env template

See `platform/api/.env.example` and `platform/edge/.env.example`.
