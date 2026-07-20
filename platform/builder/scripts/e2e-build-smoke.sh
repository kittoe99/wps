#!/usr/bin/env bash
# End-to-end orchestration smoke (API + OpenClaw must be reachable).
# Usage:
#   API_TOKEN=... OPENCLAW_URL=http://DROPLET:18789 \
#   ./platform/builder/scripts/e2e-build-smoke.sh [slug]
set -euo pipefail

API="${PLATFORM_API_URL:-http://127.0.0.1:8080}"
TOKEN="${API_TOKEN:-${PLATFORM_API_TOKEN:-}}"
SLUG="${1:-demo-$(date +%s)}"
AUTH=()
if [ -n "$TOKEN" ]; then AUTH=(-H "Authorization: Bearer $TOKEN"); fi

echo "== Create site $SLUG =="
curl -sS -X POST "$API/sites" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"title\":\"E2E Demo\"}" | tee /tmp/wps-site.json

echo
echo "== Queue build =="
BUILD=$(curl -sS -X POST "$API/sites/$SLUG/build" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{
    "brief": {
      "businessName": "Acme Dental",
      "industry": "dentist",
      "tone": "calm professional",
      "researchUrls": []
    }
  }')
echo "$BUILD" | tee /tmp/wps-build.json
BUILD_ID=$(echo "$BUILD" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("buildId",""))')

if [ -z "$BUILD_ID" ]; then
  echo "Failed to queue build"
  exit 1
fi

echo "== Poll build $BUILD_ID =="
for i in $(seq 1 60); do
  STATUS_JSON=$(curl -sS "$API/sites/$SLUG/builds/$BUILD_ID" "${AUTH[@]}")
  STATUS=$(echo "$STATUS_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["build"]["status"])')
  echo "[$i] status=$STATUS"
  if [ "$STATUS" = "published" ] || [ "$STATUS" = "failed" ]; then
    echo "$STATUS_JSON"
    break
  fi
  sleep 15
done

DOMAIN="${PUBLIC_SITE_DOMAIN:-wpscanvas.com}"
echo "== Public URL: https://${SLUG}.${DOMAIN} =="
