#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Applying edge namespace + nginx config"
kubectl apply -f "$ROOT/edge/k8s/namespace-pvc.yaml"
kubectl apply -f "$ROOT/edge/k8s/nginx-configmap.yaml"

if ! kubectl -n wps-edge get secret edge-secrets >/dev/null 2>&1; then
  echo "Create edge-secrets first (see edge/k8s/secret.example.yaml)"
  exit 1
fi

echo "==> Deploying NGINX + sync sidecars"
kubectl apply -f "$ROOT/edge/k8s/deployment.yaml"

echo "==> Waiting for Load Balancer IP..."
kubectl -n wps-edge wait --for=jsonPath='{.status.loadBalancer.ingress[0].ip}' svc/edge-nginx --timeout=600s || true
kubectl -n wps-edge get svc edge-nginx

echo "Done. Set EDGE_LB_IP and run infra/dns/provision-dns-tls.sh"
