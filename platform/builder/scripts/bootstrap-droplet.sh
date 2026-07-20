#!/usr/bin/env bash
# Bootstrap OpenClaw + Docker sandbox on a fresh Ubuntu 24.04 droplet.
# Run as root on the droplet after SSH.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg jq ufw

# Docker
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# OpenClaw install (official docker setup)
export OPENCLAW_SANDBOX=1
if [ ! -d /opt/openclaw ]; then
  mkdir -p /opt/openclaw /var/lib/openclaw
fi

# Pull OpenClaw gateway image if using docker compose from docs
# Fallback: install openclaw CLI via npm if available
if ! command -v openclaw >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  npm install -g openclaw@latest || true
fi

# Firewall: SSH + gateway only
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 18789/tcp
ufw --force enable

echo "Bootstrap complete. Next: configure ~/.openclaw/openclaw.json and start gateway."
