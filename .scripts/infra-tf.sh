#!/bin/bash
# Terraform 배포 스크립트
# infra/.env.<env> 를 로드하여 Terraform 실행
# 환경별 파일의 TF_VAR_*는 Terraform이 자동으로 인식
# 사용법: .scripts/infra-tf.sh <staging|production> [init|plan|apply|destroy]

set -euo pipefail

ENV="${1:-}"
ACTION="${2:-plan}"

if [[ -z "$ENV" || ("$ENV" != "staging" && "$ENV" != "production") ]]; then
  echo "Usage: $0 <staging|production> [init|plan|apply|destroy]"
  exit 1
fi

ENV_FILE="infra/.env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE 파일이 없습니다."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

WORK_DIR="infra/environments/$ENV"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# TF Cloud 워크스페이스 확인 (없으면 생성)
"$SCRIPT_DIR/infra-tf-cloud-init.sh" "$ENV"
echo ""

echo "🚀 [$ENV] Terraform $ACTION..."
echo ""

terraform -chdir="$WORK_DIR" init

case "$ACTION" in
  init)
    # init만 실행 (워크스페이스 생성 + terraform init)
    ;;
  plan)
    terraform -chdir="$WORK_DIR" plan
    ;;
  apply)
    terraform -chdir="$WORK_DIR" apply -auto-approve
    echo ""
    terraform -chdir="$WORK_DIR" output

    # SUPABASE_PROJECT_ID를 .env 파일에 자동 기록
    SUPABASE_PROJECT_ID=$(terraform -chdir="$WORK_DIR" output -raw project_id 2>/dev/null || true)
    if [ -n "$SUPABASE_PROJECT_ID" ]; then
      if grep -q "^SUPABASE_PROJECT_ID=" "$ENV_FILE"; then
        sed -i '' "s/^SUPABASE_PROJECT_ID=.*/SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID/" "$ENV_FILE"
      else
        echo "SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID" >> "$ENV_FILE"
      fi
      echo ""
      echo "📝 SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID → $ENV_FILE 저장 완료"
    fi
    ;;
  destroy)
    terraform -chdir="$WORK_DIR" destroy
    ;;
  *)
    echo "❌ Unknown action: $ACTION (init|plan|apply|destroy)"
    exit 1
    ;;
esac
