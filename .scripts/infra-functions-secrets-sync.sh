#!/bin/bash
# Functions 환경변수(secrets) 동기화
# 존재하는 환경의 .env 파일을 읽어 supabase secrets 배포
# 사용법: .scripts/infra-functions-secrets-sync.sh

set -euo pipefail

FUNCTIONS_DIR="supabase/functions"
synced=0

for ENV_FILE in infra/.env.*; do
  [ -f "$ENV_FILE" ] || continue
  env="${ENV_FILE#infra/.env.}"

  # example 파일 제외
  [[ "$env" == "example" || "$env" == *.example ]] && continue
  SECRETS_FILE="$FUNCTIONS_DIR/.env.$env"

  if [ ! -f "$SECRETS_FILE" ]; then
    echo "⚠️  $SECRETS_FILE 없음 — $env 건너뜀"
    continue
  fi

  # SUPABASE_PROJECT_ID 로드
  SUPABASE_PROJECT_ID=$(grep -E '^SUPABASE_PROJECT_ID=' "$ENV_FILE" | cut -d= -f2-)

  if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "⚠️  $ENV_FILE에 SUPABASE_PROJECT_ID 없음 — $env 건너뜀"
    continue
  fi

  echo "🔄 [$env] secrets 동기화 중... (project: $SUPABASE_PROJECT_ID)"
  supabase secrets set --env-file "$SECRETS_FILE" --project-ref "$SUPABASE_PROJECT_ID"
  echo "  ✅ 완료"
  ((synced++))
done

if [ "$synced" -eq 0 ]; then
  echo "❌ 동기화된 환경이 없습니다."
  exit 1
fi

echo ""
echo "✅ ${synced}개 환경 동기화 완료"
