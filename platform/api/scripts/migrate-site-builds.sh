#!/usr/bin/env bash
# Apply site_builds migration only (idempotent)
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx tsx -e "
import { readFileSync } from 'fs'
import pg from 'pg'
import { readFileSync as r } from 'fs'
const sql = \`
CREATE TABLE IF NOT EXISTS site_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'published', 'failed')),
  session_id TEXT NOT NULL,
  version INT,
  brief JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_site_builds_site ON site_builds (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_builds_status ON site_builds (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_builds_session ON site_builds (session_id);
\`;
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(sql);
await client.end();
console.log('site_builds migration applied');
"
