#!/usr/bin/env bash
# Non-interactive OpenClaw + sandbox bootstrap for wps-openclaw-builder droplet.
# Usage (as root): MOONSHOT_API_KEY=... PLATFORM_API_TOKEN=... FIRECRAWL_API_KEY=... ./install-openclaw.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export OPENCLAW_SANDBOX=1
export OPENCLAW_SKIP_ONBOARDING=1
export OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:latest}"
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"

MOONSHOT_API_KEY="${MOONSHOT_API_KEY:?Set MOONSHOT_API_KEY}"
PLATFORM_API_URL="${PLATFORM_API_URL:-http://10.0.0.1:8080}"
PLATFORM_API_TOKEN="${PLATFORM_API_TOKEN:-}"
FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY:-}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(openssl rand -hex 32)}"

apt-get update
apt-get install -y ca-certificates curl gnupg jq ufw git openssl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# Firewall (host); cloud firewall should also restrict 18789
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 18789/tcp
ufw --force enable || true

mkdir -p /opt/openclaw /var/lib/openclaw /root/.openclaw
cd /opt/openclaw

if [ ! -f /opt/openclaw/scripts/docker/setup.sh ]; then
  # Prefer prebuilt image + minimal compose from docs clone
  git clone --depth 1 https://github.com/openclaw/openclaw.git /opt/openclaw-src || true
  if [ -d /opt/openclaw-src ]; then
    cp -a /opt/openclaw-src/. /opt/openclaw/
  fi
fi

# Write env for compose / gateway
cat > /opt/openclaw/.env <<EOF
OPENCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}
MOONSHOT_API_KEY=${MOONSHOT_API_KEY}
PLATFORM_API_URL=${PLATFORM_API_URL}
PLATFORM_API_TOKEN=${PLATFORM_API_TOKEN}
FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
OPENCLAW_SANDBOX=1
EOF

# Config with env substitution for sandbox env (literal keys written)
python3 - <<'PY'
import json, os
from pathlib import Path
cfg = {
  "agents": {
    "defaults": {
      "model": {"primary": "moonshot/kimi-k3"},
      "imageModel": "moonshot/kimi-k3",
      "sandbox": {
        "mode": "all",
        "scope": "session",
        "workspaceAccess": "rw",
        "backend": "docker",
        "docker": {
          "image": "wps-site-builder-sandbox:latest",
          "network": "bridge",
          "readOnlyRoot": False,
          "env": {
            "PLATFORM_API_URL": os.environ.get("PLATFORM_API_URL", ""),
            "PLATFORM_API_TOKEN": os.environ.get("PLATFORM_API_TOKEN", ""),
            "FIRECRAWL_API_KEY": os.environ.get("FIRECRAWL_API_KEY", ""),
          },
        },
        "prune": {"idleHours": 2, "maxAgeDays": 1},
      },
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "moonshot": {
        "baseUrl": "https://api.moonshot.ai/v1",
        "apiKey": os.environ["MOONSHOT_API_KEY"],
        "api": "openai-completions",
        "models": [{
          "id": "kimi-k3",
          "name": "Kimi K3",
          "reasoning": True,
          "input": ["text", "image", "video"],
          "contextWindow": 1048576,
          "maxTokens": 8192,
        }],
      }
    },
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 18789,
    "auth": {"mode": "token", "token": os.environ.get("GATEWAY_TOKEN", "")},
    "http": {"endpoints": {"chatCompletions": {"enabled": True}}},
    "controlUi": {"allowedOrigins": ["*"]},
  },
}
Path("/root/.openclaw").mkdir(parents=True, exist_ok=True)
Path("/root/.openclaw/openclaw.json").write_text(json.dumps(cfg, indent=2))
# Also mount path used by docker gateway (node user)
Path("/var/lib/openclaw").mkdir(parents=True, exist_ok=True)
Path("/var/lib/openclaw/openclaw.json").write_text(json.dumps(cfg, indent=2))
print("Wrote openclaw.json")
PY

# The gateway and sandbox image run as node (uid/gid 1000). A root-owned
# bind-mounted workspace is writable at the mount level but still rejects
# file creation for the agent process.
mkdir -p /var/lib/openclaw/workspace
chown -R 1000:1000 /var/lib/openclaw

export GATEWAY_TOKEN MOONSHOT_API_KEY PLATFORM_API_URL PLATFORM_API_TOKEN FIRECRAWL_API_KEY

if [ -x /opt/openclaw/scripts/docker/setup.sh ]; then
  cd /opt/openclaw
  OPENCLAW_IMAGE="$OPENCLAW_IMAGE" OPENCLAW_SANDBOX=1 OPENCLAW_SKIP_ONBOARDING=1 \
    ./scripts/docker/setup.sh || {
      echo "setup.sh failed; falling back to docker run gateway"
      docker pull "$OPENCLAW_IMAGE"
      docker rm -f openclaw-gateway 2>/dev/null || true
      docker run -d --name openclaw-gateway --restart unless-stopped \
        -p 18789:18789 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /var/lib/openclaw:/home/node/.openclaw \
        -e OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN" \
        -e MOONSHOT_API_KEY="$MOONSHOT_API_KEY" \
        "$OPENCLAW_IMAGE"
    }
else
  docker pull "$OPENCLAW_IMAGE"
  docker rm -f openclaw-gateway 2>/dev/null || true
  docker run -d --name openclaw-gateway --restart unless-stopped \
    -p 18789:18789 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /var/lib/openclaw:/home/node/.openclaw \
    -e OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN" \
    -e MOONSHOT_API_KEY="$MOONSHOT_API_KEY" \
    "$OPENCLAW_IMAGE"
fi

# Docker setup may create the host workspace after the initial config step.
# Keep every supported install layout writable by the node user used in
# generated sandbox containers.
for workspace in \
  /root/.openclaw/workspace \
  /home/node/.openclaw/workspace \
  /var/lib/openclaw/workspace
do
  mkdir -p "$workspace"
  chown -R 1000:1000 "$workspace"
done

echo "OPENCLAW_GATEWAY_TOKEN=${GATEWAY_TOKEN}"
echo "Gateway listening on :18789"
echo "Next: build sandbox image with platform/builder/scripts/build-sandbox-image.sh"
