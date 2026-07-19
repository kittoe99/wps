#!/usr/bin/env bash
# End-to-end smoke: create site + publish inline HTML (requires API running)
set -euo pipefail
API="${API_BASE:-http://127.0.0.1:8080}"
TOKEN="${API_TOKEN:-}"
SLUG="${1:-demo-$(date +%s)}"

AUTH=()
if [[ -n "$TOKEN" ]]; then
  AUTH=(-H "Authorization: Bearer ${TOKEN}")
fi

echo "Creating site ${SLUG}..."
curl -sS -X POST "$API/sites" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"slug\":\"${SLUG}\",\"title\":\"Demo Site\"}"
echo

echo "Publishing v1..."
curl -sS -X POST "$API/sites/${SLUG}/publish" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"version\":1,\"files\":[{\"path\":\"index.html\",\"content\":\"<!doctype html><html><body><h1>${SLUG}</h1><p>Published by WPS platform</p></body></html>\",\"contentType\":\"text/html\"}]}"
echo

echo "Resolve:"
curl -sS "$API/resolve/${SLUG}"
echo
