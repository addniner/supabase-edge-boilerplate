#!/bin/bash
# Terraform Cloud 워크스페이스 생성 (없으면 생성, 있으면 스킵)
# 사용법: .scripts/infra-tf-cloud-init.sh <staging|production|all>

set -euo pipefail

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <staging|production|all>"
  exit 1
fi

# TF_API_TOKEN 로드
if [ -z "${TF_API_TOKEN:-}" ]; then
  for ENV_FILE in infra/.env.*; do
    [ -f "$ENV_FILE" ] || continue
    env="${ENV_FILE#infra/.env.}"
    [[ "$env" == "example" || "$env" == *.example ]] && continue
    TF_API_TOKEN=$(grep -E '^TF_API_TOKEN=' "$ENV_FILE" | cut -d= -f2-)
    [ -n "$TF_API_TOKEN" ] && break
  done
fi

if [ -z "${TF_API_TOKEN:-}" ]; then
  echo "❌ TF_API_TOKEN이 설정되지 않았습니다."
  exit 1
fi

# 대상 디렉토리 결정
if [ "$TARGET" = "all" ]; then
  DIRS=(infra/environments/*/)
else
  DIRS=("infra/environments/$TARGET")
  if [ ! -d "${DIRS[0]}" ]; then
    echo "❌ infra/environments/$TARGET 디렉토리가 없습니다."
    exit 1
  fi
fi

echo "☁️  Terraform Cloud 워크스페이스 조회 중..."

to_create=()

for ENV_DIR in "${DIRS[@]}"; do
  [ -d "$ENV_DIR" ] || continue
  MAIN_TF="$ENV_DIR/main.tf"
  [ -f "$MAIN_TF" ] || continue

  TF_ORG=$(grep -A1 'cloud {' "$MAIN_TF" | grep 'organization' | sed 's/.*"\(.*\)".*/\1/')
  TF_WORKSPACE=$(grep -A1 'workspaces {' "$MAIN_TF" | grep 'name' | sed 's/.*"\(.*\)".*/\1/')

  if [ -z "$TF_ORG" ] || [ -z "$TF_WORKSPACE" ]; then
    continue
  fi

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TF_API_TOKEN" \
    -H "Content-Type: application/vnd.api+json" \
    "https://app.terraform.io/api/v2/organizations/${TF_ORG}/workspaces/${TF_WORKSPACE}")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ $TF_ORG/$TF_WORKSPACE — 이미 존재"
  else
    echo "  🆕 $TF_ORG/$TF_WORKSPACE — 새로 생성 필요"
    to_create+=("$TF_ORG/$TF_WORKSPACE")
  fi
done

if [ ${#to_create[@]} -eq 0 ]; then
  exit 0
fi

echo ""
for item in "${to_create[@]}"; do
  TF_ORG="${item%%/*}"
  TF_WORKSPACE="${item##*/}"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TF_API_TOKEN" \
    -H "Content-Type: application/vnd.api+json" \
    "https://app.terraform.io/api/v2/organizations/${TF_ORG}/workspaces" \
    -d "{
      \"data\": {
        \"type\": \"workspaces\",
        \"attributes\": {
          \"name\": \"${TF_WORKSPACE}\",
          \"execution-mode\": \"local\",
          \"auto-apply\": false
        }
      }
    }")

  RESP_CODE=$(echo "$RESPONSE" | tail -1)

  if [ "$RESP_CODE" = "201" ]; then
    echo "  ✅ $TF_ORG/$TF_WORKSPACE 생성 완료"
  else
    RESP_BODY=$(echo "$RESPONSE" | sed '$d')
    echo "  ❌ $TF_ORG/$TF_WORKSPACE 생성 실패 (HTTP $RESP_CODE)"
    echo "$RESP_BODY"
  fi
done
