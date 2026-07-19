#!/usr/bin/env bash
set -euo pipefail

CLUSTER_ID="${1:-2a7f6a84-5c56-498d-ac99-6523023ab313}"
THRESHOLD_PERCENT="${2:-80}"
INCREMENT_GIB="${3:-10}"

if [[ -z "${DIGITALOCEAN_TOKEN:-}" ]]; then
  echo "DIGITALOCEAN_TOKEN is required."
  exit 1
fi

curl -sS -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
  -d "{\"storage\":{\"enabled\":true,\"threshold_percent\":${THRESHOLD_PERCENT},\"increment_gib\":${INCREMENT_GIB}}}" \
  "https://api.digitalocean.com/v2/databases/${CLUSTER_ID}/autoscale"

echo
echo "Storage autoscaling enabled for cluster ${CLUSTER_ID}."
