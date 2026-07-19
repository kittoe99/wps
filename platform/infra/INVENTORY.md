# Platform infrastructure inventory (DigitalOcean)

## Provisioned resources

| Resource | ID / Name | Region | Status |
|----------|-----------|--------|--------|
| VPC | `0821db52-f865-47fe-ac26-2e6595c6f3eb` (`default-nyc3`) | nyc3 | ready |
| Postgres | `2a7f6a84-5c56-498d-ac99-6523023ab313` (`wps-canvas-submissions`) | nyc3 | online; DB `platform` schema applied |
| Valkey | `2094c71b-2df0-4af5-b3b5-0eb806e82d0c` (`wps-platform-valkey`) | nyc3 | online |
| DOKS | `b2f46004-a385-48b6-a615-7be664b5d9b7` (`wps-sites-edge`) | nyc3 | cluster created (nodes may still be provisioning); manifests in `platform/edge/k8s/` |
| DNS zone | `wpscanvas.com` | — | zone created; `*`, `www`, `api` A records (placeholder IP until LB exists) |

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
