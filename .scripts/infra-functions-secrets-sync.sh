#!/bin/bash
# Functions 환경변수(secrets) 동기화
# 존재하는 환경의 .env 파일을 읽어 supabase secrets 배포
# 사용법:
#   .scripts/infra-functions-secrets-sync.sh -e staging     # 특정 환경
#   .scripts/infra-functions-secrets-sync.sh --env production
#   .scripts/infra-functions-secrets-sync.sh -a              # 전체 환경
#   .scripts/infra-functions-secrets-sync.sh --all

set -euo pipefail

FUNCTIONS_DIR="supabase/functions"

usage() {
  echo "Usage: $0 [-e|--env <environment>] [-a|--all]"
  echo ""
  echo "Options:"
  echo "  -e, --env <env>   특정 환경만 배포 (staging, production)"
  echo "  -a, --all         모든 환경 배포"
  exit 1
}

sync_env() {
  local env="$1"
  local ENV_FILE="infra/.env.$env"
  local SECRETS_FILE="$FUNCTIONS_DIR/.env.$env"

  if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE 없음 — $env 건너뜀"
    return 1
  fi

  if [ ! -f "$SECRETS_FILE" ]; then
    echo "⚠️  $SECRETS_FILE 없음 — $env 건너뜀"
    return 1
  fi

  # SUPABASE_PROJECT_ID 로드
  SUPABASE_PROJECT_ID=$(grep -E '^SUPABASE_PROJECT_ID=' "$ENV_FILE" | cut -d= -f2-)

  if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "⚠️  $ENV_FILE에 SUPABASE_PROJECT_ID 없음 — $env 건너뜀"
    return 1
  fi

  echo "🔄 [$env] secrets 동기화 중... (project: $SUPABASE_PROJECT_ID)"
  supabase secrets set --env-file "$SECRETS_FILE" --project-ref "$SUPABASE_PROJECT_ID"
  echo "  ✅ 완료"
  return 0
}

# 인자 파싱
TARGET_ENV=""
ALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      TARGET_ENV="$2"
      shift 2
      ;;
    -a|--all)
      ALL=true
      shift
      ;;
    *)
      usage
      ;;
  esac
done

# 인자 없으면 usage
if [ -z "$TARGET_ENV" ] && [ "$ALL" = false ]; then
  usage
fi

synced=0

if [ "$ALL" = true ]; then
  for ENV_FILE in infra/.env.*; do
    [ -f "$ENV_FILE" ] || continue
    env="${ENV_FILE#infra/.env.}"
    [[ "$env" == "example" || "$env" == *.example ]] && continue
    if sync_env "$env"; then
      ((synced++))
    fi
  done
else
  if sync_env "$TARGET_ENV"; then
    ((synced++))
  fi
fi

if [ "$synced" -eq 0 ]; then
  echo "❌ 동기화된 환경이 없습니다."
  exit 1
fi

echo ""
echo "✅ ${synced}개 환경 동기화 완료"
