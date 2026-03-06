#!/bin/bash
# GitHub Secrets 설정 스크립트
# infra/.env (공통) + infra/.env.<env> (환경별)에서 값을 읽어 등록
# 사용법: ./.scripts/setup-github-secrets.sh
#
# ⚠️ 새 환경변수 추가 시 수정 필요:
#   1. 이 파일의 매핑 테이블 (아래 REPO_SECRETS, ENV_SECRETS)
#   2. .github/workflows/terraform-*.yml 의 Plan/Apply env 섹션

set -e

# =============================================================================
# 매핑 테이블 (새 변수 추가 시 여기만 수정)
# =============================================================================
# 형식: "GITHUB_SECRET_NAME=ENV_VAR_NAME"
#
# Repo-level: infra/.env 에서 읽음 (모든 환경 공통)
REPO_SECRETS=(
  "SUPABASE_ACCESS_TOKEN=TF_VAR_supabase_access_token"
  "ORGANIZATION_ID=TF_VAR_organization_id"
  "TF_API_TOKEN=TF_API_TOKEN"
)

# Environment-level: infra/.env.<env> 에서 읽음 (staging/production 각각)
ENV_SECRETS=(
  "PROJECT_ID=PROJECT_ID"
  "DATABASE_PASSWORD=TF_VAR_database_password"
  "EXTERNAL_GOOGLE_CLIENT_ID=TF_VAR_external_google_client_id"
  "EXTERNAL_GOOGLE_SECRET=TF_VAR_external_google_secret"
)
# =============================================================================

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

# 1. Repo-level secrets
echo "📦 Repo-level secrets..."
for entry in "${REPO_SECRETS[@]}"; do
  secret_name="${entry%%=*}"
  env_var="${entry##*=}"
  value="${!env_var}"
  if [[ -n "$value" ]]; then
    echo "$value" | gh secret set "$secret_name"
    echo "  ✅ $secret_name"
  else
    echo "  ⏭️  $secret_name (값 없음, 건너뜀)"
  fi
done

# 2. Environment-level secrets
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

  for entry in "${ENV_SECRETS[@]}"; do
    secret_name="${entry%%=*}"
    env_var="${entry##*=}"
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
