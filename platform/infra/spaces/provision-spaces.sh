#!/usr/bin/env bash
# Provision DigitalOcean Spaces bucket + CDN for static site storage.
# Requires: SPACES_KEY, SPACES_SECRET, and aws CLI (S3-compatible).
set -euo pipefail

REGION="${SPACES_REGION:-nyc3}"
BUCKET="${SPACES_BUCKET:-wps-sites}"
ENDPOINT="https://${REGION}.digitaloceanspaces.com"
CDN_ENDPOINT="${BUCKET}.${REGION}.cdn.digitaloceanspaces.com"

if [[ -z "${SPACES_KEY:-}" || -z "${SPACES_SECRET:-}" ]]; then
  echo "Set SPACES_KEY and SPACES_SECRET (API → Spaces Keys in DO control panel)."
  exit 1
fi

export AWS_ACCESS_KEY_ID="$SPACES_KEY"
export AWS_SECRET_ACCESS_KEY="$SPACES_SECRET"
export AWS_DEFAULT_REGION="$REGION"

echo "Creating bucket s3://${BUCKET} in ${REGION}..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  2>/dev/null || echo "Bucket may already exist — continuing."

# Block public ACLs; edge serves via NGINX, not public Spaces URLs
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --endpoint-url "$ENDPOINT" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  2>/dev/null || true

aws s3api put-bucket-cors \
  --bucket "$BUCKET" \
  --endpoint-url "$ENDPOINT" \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["https://api.wpscanvas.com", "https://wpscanvas.com"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }' 2>/dev/null || true

# Layout marker
echo "sites/" | aws s3 cp - "s3://${BUCKET}/sites/.keep" --endpoint-url "$ENDPOINT"

cat <<EOF

Spaces bucket ready:
  Bucket:   ${BUCKET}
  Endpoint: ${ENDPOINT}
  CDN:      https://${CDN_ENDPOINT}  (enable CDN in DO control panel → Spaces → ${BUCKET} → CDN)

Next:
  1. Enable CDN on the bucket in the DigitalOcean control panel
  2. Set SPACES_BUCKET=${BUCKET} SPACES_ENDPOINT=${ENDPOINT} SPACES_REGION=${REGION} in platform API env
  3. Point wildcard DNS *.wpscanvas.com at the edge Load Balancer (see ../dns/)

EOF
