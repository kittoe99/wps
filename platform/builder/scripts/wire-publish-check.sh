#!/usr/bin/env bash
# Wire-check: render prompt, start sandbox, publish fixture HTML via platform API.
# Does not require Kimi — validates sandbox CLI + publish path.
set -euo pipefail

API="${PLATFORM_API_URL:-http://127.0.0.1:8080}"
TOKEN="${API_TOKEN:-${PLATFORM_API_TOKEN:-}}"
SLUG="${1:-wire-$(date +%s)}"
AUTH=()
if [ -n "$TOKEN" ]; then AUTH=(-H "Authorization: Bearer $TOKEN"); fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROMPT="$ROOT/builder/prompts/build-site.md"
test -f "$PROMPT"

echo "== Prompt template OK ($(wc -l < "$PROMPT") lines) =="

# Prefer local docker sandbox if available
if ! docker image inspect wps-site-builder-sandbox:latest >/dev/null 2>&1; then
  echo "Building sandbox image locally..."
  bash "$ROOT/builder/scripts/build-sandbox-image.sh"
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
cat > "$WORKDIR/index.html" <<HTML
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Wire Test</title>
<style>body{font-family:Georgia,serif;margin:0;min-height:100vh;background:linear-gradient(160deg,#1a2a24,#0e1612);color:#f3efe6;display:grid;place-items:center}
main{max-width:36rem;padding:2rem}h1{font-size:clamp(2rem,6vw,3.5rem);margin:0 0 .5rem}p{opacity:.85}</style>
</head><body><main><h1>Wire Test Dental</h1><p>Sandbox publish path verified.</p>
<p><a href="#contact" style="color:#c8e6c9">Book a visit</a></p></main></body></html>
HTML

echo "== Create site $SLUG =="
curl -sS -X POST "$API/sites" "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"slug\":\"$SLUG\",\"title\":\"Wire Test\"}" || true

echo
echo "== Publish via sandbox container =="
docker run --rm \
  -e PLATFORM_API_URL="$API" \
  -e PLATFORM_API_TOKEN="$TOKEN" \
  -v "$WORKDIR:/workspace" \
  --network host \
  wps-site-builder-sandbox:latest \
  wps-publish --slug "$SLUG" --version 1 --dir /workspace

echo "== Done: https://${SLUG}.${PUBLIC_SITE_DOMAIN:-wpscanvas.com} =="
