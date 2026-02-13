#!/bin/bash
# Terraform 배포 스크립트
# infra/.env (공통) + infra/.env.<env> (환경별)을 로드하여 Terraform 실행
# 환경별 파일의 TF_VAR_*는 Terraform이 자동으로 인식
# 사용법: .scripts/infra-deploy.sh <staging|production> [plan|apply|destroy]

set -euo pipefail

ENV="${1:-}"
ACTION="${2:-plan}"

if [[ -z "$ENV" || ("$ENV" != "staging" && "$ENV" != "production") ]]; then
  echo "Usage: $0 <staging|production> [plan|apply|destroy]"
  exit 1
fi

# 공통 환경변수 로드
COMMON_ENV="infra/.env"
if [ ! -f "$COMMON_ENV" ]; then
  echo "❌ $COMMON_ENV 파일이 없습니다."
  exit 1
fi

# 환경별 환경변수 로드
ENV_FILE="infra/.env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE 파일이 없습니다."
  exit 1
fi

set -a
source "$COMMON_ENV"
source "$ENV_FILE"
set +a

# 공통 변수 → TF_VAR 매핑 (Terraform 변수명과 .env 변수명이 다른 것만)
export TF_VAR_supabase_access_token="$SUPABASE_ACCESS_TOKEN"
export TF_VAR_organization_id="$ORGANIZATION_ID"

WORK_DIR="infra/environments/$ENV"

echo "🚀 [$ENV] Terraform $ACTION..."
echo ""

terraform -chdir="$WORK_DIR" init

case "$ACTION" in
  plan)
    terraform -chdir="$WORK_DIR" plan
    ;;
  apply)
    terraform -chdir="$WORK_DIR" apply -auto-approve
    echo ""
    terraform -chdir="$WORK_DIR" output
    ;;
  destroy)
    terraform -chdir="$WORK_DIR" destroy
    ;;
  *)
    echo "❌ Unknown action: $ACTION (plan|apply|destroy)"
    exit 1
    ;;
esac
