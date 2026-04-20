#!/bin/bash
# 환경변수 파일 존재 여부 확인
# 모든 파일이 존재하면 silent (exit 0), 누락 시에만 출력 (exit 1)
# 사용법: .claude/skills/env/env-check.sh

set -euo pipefail

missing_files=()

check_file() {
  local file="$1"
  local desc="$2"
  if [ ! -f "$file" ]; then
    missing_files+=("  ❌ $file — $desc")
  fi
}

check_file "supabase/functions/.env" "cp supabase/functions/.env.example supabase/functions/.env"
check_file "supabase/functions/.env.staging" "staging secrets 파일"
check_file "supabase/functions/.env.production" "production secrets 파일"
check_file "supabase/.env" "cp supabase/.env.example supabase/.env"
check_file "infra/.env.staging" "staging 인프라 설정 (SUPABASE_PROJECT_ID 등)"
check_file "infra/.env.production" "production 인프라 설정 (SUPABASE_PROJECT_ID 등)"
check_file "supabase/seeds/00_vault.sql" "cp supabase/seeds/00_vault.sql.example supabase/seeds/00_vault.sql"

if [ ${#missing_files[@]} -gt 0 ]; then
  echo "⚠️  ${#missing_files[@]}개 환경변수 파일이 없습니다:"
  echo ""
  for line in "${missing_files[@]}"; do
    echo "$line"
  done
  echo ""
  echo "💡 Vault 설정 참고:"
  echo "   - supabase_project_url: 로컬은 http://host.docker.internal:54321"
  echo "     원격은 infra/.env.<env>의 SUPABASE_URL"
  echo "   - webhook_secret: supabase/functions/.env의 DB_WEBHOOK_SECRET과 동일"
  exit 1
fi
