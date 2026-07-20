#!/usr/bin/env bash
# Build the site-builder sandbox image (run on OpenClaw droplet or CI).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker build -t wps-site-builder-sandbox:latest -f "$ROOT/sandbox/Dockerfile" "$ROOT"
echo "Built wps-site-builder-sandbox:latest"
