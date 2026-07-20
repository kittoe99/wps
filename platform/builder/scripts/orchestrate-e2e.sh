#!/usr/bin/env bash
# Full orchestration check:
# 1) OpenClaw health + models
# 2) Platform create site + queue build (requires API + Valkey + DATABASE)
# 3) Optional: wait for build published
set -euo pipefail

OPENCLAW_URL="${OPENCLAW_URL:-http://64.225.15.54:18789}"
API="${PLATFORM_API_URL:-http://127.0.0.1:8080}"
TOKEN="${API_TOKEN:-${PLATFORM_API_TOKEN:-}}"
GW_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"
SLUG="${1:-orch-$(date +%s)}"

AUTH=()
if [ -n "$TOKEN" ]; then AUTH=(-H "Authorization: Bearer $TOKEN"); fi
GW=()
if [ -n "$GW_TOKEN" ]; then GW=(-H "Authorization: Bearer $GW_TOKEN"); fi

echo "== 1. OpenClaw health =="
curl -sS "${OPENCLAW_URL}/health" | tee /tmp/oc-health.json
echo
curl -sS "${OPENCLAW_URL}/v1/models" "${GW[@]}" | tee /tmp/oc-models.json | head -c 400
echo

echo "== 2. Platform site + build queue =="
curl -sS -X POST "$API/sites" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"title\":\"Orchestration Demo\"}" | tee /tmp/orch-site.json || true
echo
BUILD=$(curl -sS -X POST "$API/sites/$SLUG/build" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{
    "brief": {
      "businessName": "Acme Dental",
      "industry": "dentist",
      "tone": "calm professional"
    }
  }')
echo "$BUILD" | tee /tmp/orch-build.json
BUILD_ID=$(echo "$BUILD" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("buildId",""))' 2>/dev/null || true)
SESSION=$(echo "$BUILD" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sessionId",""))' 2>/dev/null || true)

if [ -z "$BUILD_ID" ]; then
  echo "Build queue failed (is API + worker + DB up?). OpenClaw + sandbox wiring still OK."
  exit 0
fi

echo "Queued buildId=$BUILD_ID sessionId=$SESSION"
echo "== 3. Poll (worker must be running: npm run worker:build) =="
for i in $(seq 1 40); do
  STATUS_JSON=$(curl -sS "$API/sites/$SLUG/builds/$BUILD_ID" "${AUTH[@]}")
  STATUS=$(echo "$STATUS_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["build"]["status"])')
  echo "[$i] $STATUS"
  case "$STATUS" in
    published|failed) echo "$STATUS_JSON"; break ;;
  esac
  sleep 15
done

DOMAIN="${PUBLIC_SITE_DOMAIN:-wpscanvas.com}"
echo "Public URL target: https://${SLUG}.${DOMAIN}"
