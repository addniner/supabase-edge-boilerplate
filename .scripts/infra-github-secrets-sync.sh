#!/bin/bash
# GitHub Secrets 설정 스크립트
# infra/.env.<env> 에서 값을 읽어 환경별 secrets 등록
# GitHub Environment가 없으면 자동 생성
# 사용법:
#   .scripts/infra-github-secrets-sync.sh -e staging     # 특정 환경
#   .scripts/infra-github-secrets-sync.sh --env production
#   .scripts/infra-github-secrets-sync.sh -a              # 전체 환경
#   .scripts/infra-github-secrets-sync.sh --all

set -euo pipefail

echo "🔐 GitHub Secrets 설정 중..."

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

  if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE 없음 — $env 건너뜀"
    return 1
  fi

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

echo ""
if [ "$synced" -eq 0 ]; then
  echo "⚠️  환경별 .env 파일이 없습니다."
else
  echo "✨ GitHub Secrets 설정 완료! (${synced}개 환경)"
fi
