#!/bin/bash
# GitHub Secrets 설정 스크립트
# infra/.env.<env> 에서 값을 읽어 환경별 secrets 등록
# GitHub Environment가 없으면 자동 생성
# 사용법: .scripts/infra-github-secrets-sync.sh

set -euo pipefail

echo "🔐 GitHub Secrets 설정 중..."

synced=0

for ENV_FILE in infra/.env.*; do
  [ -f "$ENV_FILE" ] || continue
  env="${ENV_FILE#infra/.env.}"

  # example 파일 제외
  [[ "$env" == "example" || "$env" == *.example ]] && continue

  echo ""
  echo "🌍 [$env] GitHub Environment 확인..."
  if gh api "repos/{owner}/{repo}/environments/${env}" --silent 2>/dev/null; then
    echo "  ✅ 이미 존재합니다."
  else
    gh api "repos/{owner}/{repo}/environments/${env}" -X PUT --silent
    echo "  ✅ 생성 완료"
  fi

  echo "🔐 [$env] environment secrets..."
  gh secret set -f "$ENV_FILE" --env "$env"
  echo "  ✅ 완료"
  ((synced++))
done

echo ""
if [ "$synced" -eq 0 ]; then
  echo "⚠️  환경별 .env 파일이 없습니다."
else
  echo "✨ GitHub Secrets 설정 완료! (${synced}개 환경)"
fi
