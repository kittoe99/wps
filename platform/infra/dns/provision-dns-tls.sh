#!/usr/bin/env bash
# Register wpscanvas.com in DigitalOcean DNS and create wildcard LE certificate.
# Run AFTER the edge Load Balancer has a public IP (EDGE_LB_IP).
set -euo pipefail

DOMAIN="${PLATFORM_DOMAIN:-wpscanvas.com}"
EDGE_LB_IP="${EDGE_LB_IP:-}"
API_LB_IP="${API_LB_IP:-$EDGE_LB_IP}"

if [[ -z "$EDGE_LB_IP" ]]; then
  echo "Usage: EDGE_LB_IP=<load-balancer-ip> $0"
  echo "Optional: API_LB_IP=<api-ip> PLATFORM_DOMAIN=wpscanvas.com"
  exit 1
fi

if [[ -z "${DIGITALOCEAN_TOKEN:-}" ]]; then
  echo "DIGITALOCEAN_TOKEN is required."
  exit 1
fi

API="https://api.digitalocean.com/v2"
AUTH="Authorization: Bearer ${DIGITALOCEAN_TOKEN}"

echo "Ensuring domain ${DOMAIN} exists..."
curl -sS -X POST "$API/domains" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"${DOMAIN}\",\"ip_address\":\"${EDGE_LB_IP}\"}" \
  >/dev/null || true

create_record() {
  local type="$1" name="$2" data="$3"
  curl -sS -X POST "$API/domains/${DOMAIN}/records" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"type\":\"${type}\",\"name\":\"${name}\",\"data\":\"${data}\",\"ttl\":300}" \
    >/dev/null || true
  echo "  ${type} ${name}.${DOMAIN} -> ${data}"
}

echo "Creating DNS records..."
create_record A "@" "$EDGE_LB_IP"
create_record A "www" "$EDGE_LB_IP"
create_record A "*" "$EDGE_LB_IP"
create_record A "api" "${API_LB_IP}"

echo "Requesting Let's Encrypt wildcard certificate..."
CERT_RESP=$(curl -sS -X POST "$API/certificates" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"name\":\"wpscanvas-wildcard\",\"type\":\"lets_encrypt\",\"dns_names\":[\"${DOMAIN}\",\"*.${DOMAIN}\"]}")

echo "$CERT_RESP" | head -c 500
echo
echo
echo "Point your registrar NS records to DigitalOcean nameservers for ${DOMAIN},"
echo "then attach the certificate to the edge Load Balancer (TLS termination)."
