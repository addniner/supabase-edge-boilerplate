#!/bin/bash
# GitHub Secrets 설정 스크립트
# infra/.env (공통) + infra/.env.<env> (환경별)에서 값을 읽어 등록
# 사용법: ./.scripts/setup-github-secrets.sh

set -e

# 공통 환경변수 로드
COMMON_ENV="infra/.env"
if [ ! -f "$COMMON_ENV" ]; then
  echo "❌ $COMMON_ENV 파일이 없습니다."
  exit 1
fi

set -a
source "$COMMON_ENV"
set +a

echo "🔐 GitHub Secrets 설정 중..."
echo ""

# ========================
# 1. Repo-level secrets (공통)
# ========================
echo "📦 Repo-level secrets..."

repo_secrets=(
  "SUPABASE_ACCESS_TOKEN"
  "ORGANIZATION_ID"
  "TF_API_TOKEN"
)

for key in "${repo_secrets[@]}"; do
  value="${!key}"
  if [[ -n "$value" ]]; then
    echo "$value" | gh secret set "$key"
    echo "  ✅ $key"
  else
    echo "  ⏭️  $key (값 없음, 건너뜀)"
  fi
done

# ========================
# 2. Environment secrets (staging/production)
# ========================
for env in staging production; do
  ENV_FILE="infra/.env.$env"
  if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️ $ENV_FILE 파일이 없습니다. $env 환경 건너뜀."
    continue
  fi

  set -a
  source "$ENV_FILE"
  set +a

  echo ""
  if [[ "$env" == "staging" ]]; then
    echo "🟡 Staging environment secrets..."
  else
    echo "🔴 Production environment secrets..."
  fi

  # 환경별 파일 변수 → GitHub Secrets 매핑
  # (TF_VAR_* 형식을 GitHub Secrets 이름으로 변환)
  env_secrets=(
    "PROJECT_ID:PROJECT_ID"
    "DATABASE_PASSWORD:TF_VAR_database_password"
    "SITE_URL:TF_VAR_site_url"
    "EXTERNAL_GOOGLE_CLIENT_ID:TF_VAR_external_google_client_id"
    "EXTERNAL_GOOGLE_SECRET:TF_VAR_external_google_secret"
  )

  for entry in "${env_secrets[@]}"; do
    secret_name="${entry%%:*}"
    env_var="${entry##*:}"
    value="${!env_var}"
    if [[ -n "$value" ]]; then
      echo "$value" | gh secret set "$secret_name" --env "$env"
      echo "  ✅ $secret_name"
    else
      echo "  ⏭️  $secret_name (값 없음, 건너뜀)"
    fi
  done
done

echo ""
echo "✨ GitHub Secrets 설정 완료!"
echo ""
echo "📋 등록된 secrets:"
echo "  [Repo]       SUPABASE_ACCESS_TOKEN, ORGANIZATION_ID, TF_API_TOKEN"
echo "  [Env]        PROJECT_ID, DATABASE_PASSWORD, SITE_URL, EXTERNAL_GOOGLE_CLIENT_ID, EXTERNAL_GOOGLE_SECRET"
