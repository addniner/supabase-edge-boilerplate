#!/usr/bin/env bash
set -euo pipefail

# Run deno check and lint for functions workspace without interactive prompts
# Usage: deno-check.sh [-r|--reload]
#   -r, --reload: Reload Deno cache before type checking

RELOAD_CACHE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--reload)
            RELOAD_CACHE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-r|--reload]"
            exit 1
            ;;
    esac
done

# api 디렉토리에서 직접 실행 (deno.json이 api에만 존재)
API_DIR="$(dirname "$0")/../supabase/functions/api"
cd "$API_DIR" || {
    echo "Error: Could not change to $API_DIR directory"
    exit 1
}

# Load environment variables from .env file (functions 폴더에 위치)
if [ -f "../.env" ]; then
    echo "==> Loading environment variables from .env"
    set -a  # automatically export all variables
    source "../.env"
    set +a  # stop automatically exporting
    echo "✔ Environment variables loaded"
else
    echo "Warning: .env file not found in supabase/functions"
fi

# Cache reload (optional)
if [ "$RELOAD_CACHE" = true ]; then
    echo "==> Reloading Deno cache"
    if [ -f "index.ts" ]; then
        DENO_NO_PROMPT=1 deno cache --reload "index.ts"
    fi
    echo "✔ Cache reloaded"
fi

# Type check
echo "==> Deno type check ($API_DIR)"
DENO_NO_PROMPT=1 deno check --allow-import .
echo "✔ Type check passed"

# Lint
echo "==> Deno lint ($API_DIR)"
deno lint
echo "✔ Lint passed"

# Test (환경변수 초기화 후 실행 - setup.ts의 TEST_ENV만 사용)
echo "==> Deno test ($API_DIR)"
env -i HOME="$HOME" PATH="$PATH" \
    deno test --allow-all --reporter=dot --coverage=_coverage
deno coverage _coverage --lcov --output=_coverage/lcov.info
echo "✔ Test passed"
