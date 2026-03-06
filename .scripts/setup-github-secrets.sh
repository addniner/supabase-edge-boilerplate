#!/bin/bash
# GitHub Secrets 설정 스크립트
# infra/.env (공통) + infra/.env.<env> (환경별)에서 값을 읽어 등록
# gh CLI의 -f 옵션으로 dotenv 파일을 직접 파싱하여 등록
# 사용법: ./.scripts/setup-github-secrets.sh

set -e

echo "🔐 GitHub Secrets 설정 중..."
echo ""

# 1. Repo-level secrets (infra/.env)
COMMON_ENV="infra/.env"
if [ ! -f "$COMMON_ENV" ]; then
  echo "❌ $COMMON_ENV 파일이 없습니다."
  exit 1
fi

echo "📦 Repo-level secrets ($COMMON_ENV)..."
gh secret set -f "$COMMON_ENV"
echo "  ✅ 완료"

# 2. Environment-level secrets (infra/.env.<env>)
for env in staging production; do
  ENV_FILE="infra/.env.$env"
  if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️ $ENV_FILE 파일이 없습니다. $env 환경 건너뜀."
    continue
  fi

  echo ""
  if [[ "$env" == "staging" ]]; then
    echo "🟡 Staging environment secrets..."
  else
    echo "🔴 Production environment secrets..."
  fi

  gh secret set -f "$ENV_FILE" --env "$env"
  echo "  ✅ 완료"
done

echo ""
echo "✨ GitHub Secrets 설정 완료!"
