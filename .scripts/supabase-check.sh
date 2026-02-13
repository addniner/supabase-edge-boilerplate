#!/usr/bin/env bash
set -euo pipefail

# Start minimal supabase services, reset DB, and verify generated types are up to date.
# Names of containers to not start. [gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor]

# 나중에 확인
# SKIP_CONTAINERS="imgproxy,supavisor,realtime,storage-api,studio,mailpit,logflare,vector"
# SKIP_CONTAINERS="edge-runtime,imgproxy,supavisor,realtime,storage-api,studio,mailpit,logflare,vector"

# echo "==> Start Supabase (minimal services)"
supabase start -x $SKIP_CONTAINERS

# echo "==> Reset Supabase DB"
supabase db reset

TYPES_FILE="supabase/functions/_shared/types/supabase.types.ts"

# echo "==> Backup current types (if exists)"
cp "$TYPES_FILE" supabase.types.ts.backup 2>/dev/null || true

# echo "==> Generate types"
chmod +x .scripts/generate-types.sh
./.scripts/generate-types.sh

# echo "==> Verify types up-to-date"
if ! git diff --ignore-space-at-eol --exit-code --quiet "$TYPES_FILE"; then
  echo "❌ Generated types are out of date"
  exit 1
fi

# echo "✔ Types up-to-date"

# echo "==> Stop Supabase"
supabase stop
# echo "✔ Supabase stopped"


