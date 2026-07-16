#!/usr/bin/env bash
set -euo pipefail

KEY_PATH="${HOME}/.ssh/id_ed25519_github"
PUB_PATH="${KEY_PATH}.pub"
GITHUB_SSH_URL="https://github.com/settings/ssh/new"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "${HOME}/.ssh/sockets"
chmod 700 "${HOME}/.ssh" "${HOME}/.ssh/sockets"

if [[ ! -f "$PUB_PATH" ]]; then
  echo "Generating a new SSH key..."
  ssh-keygen -t ed25519 -C "kofikittoe35@gmail.com" -f "$KEY_PATH" -N ""
  chmod 600 "$KEY_PATH"
  chmod 644 "$PUB_PATH"
fi

cat > "${HOME}/.ssh/config" << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
  ControlMaster auto
  ControlPath ~/.ssh/sockets/%r@%h-%p
  ControlPersist 10m
  Compression no
  ServerAliveInterval 60
EOF
chmod 600 "${HOME}/.ssh/config"

cp "$PUB_PATH" "${REPO_DIR}/github-ssh-public-key.pub"

echo ""
echo "=== GitHub SSH setup ==="
echo ""
echo "1. Open: ${GITHUB_SSH_URL}"
echo "2. Title: wps-canvas (or any name you like)"
echo "3. Key type: Authentication Key"
echo "4. Paste the public key below (also saved to github-ssh-public-key.pub)"
echo ""
echo "--- PUBLIC KEY START ---"
cat "$PUB_PATH"
echo "--- PUBLIC KEY END ---"
echo ""
echo "Fingerprint:"
ssh-keygen -lf "$PUB_PATH"
echo ""
read -r -p "Press Enter after you've added the key on GitHub..." _

echo "Testing GitHub SSH..."
if ssh -T git@github.com 2>&1 | tee /tmp/github-ssh-test.txt; then
  true
fi

if grep -qi "successfully authenticated" /tmp/github-ssh-test.txt; then
  echo ""
  echo "SSH is working. Push with:"
  echo "  cd ${REPO_DIR} && git push -u origin main"
else
  echo ""
  echo "SSH test did not succeed yet."
  echo "Double-check the key was pasted fully on GitHub, then run:"
  echo "  ssh -T git@github.com"
fi
