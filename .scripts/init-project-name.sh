#!/bin/bash
# 프로젝트 초기화: 플레이스홀더를 실제 값으로 치환
# 사용법: .scripts/init-project-name.sh <project-name> <tf-org-name>

set -euo pipefail

PROJECT_NAME="${1:-}"
TF_ORG="${2:-}"

if [[ -z "$PROJECT_NAME" || -z "$TF_ORG" ]]; then
  echo "Usage: $0 <project-name> <tf-org-name>"
  echo "Example: $0 my-app my-org"
  exit 1
fi

# 치환 대상 파일
FILES=(
  package.json
  supabase/config.toml
  infra/environments/staging/main.tf
  infra/environments/production/main.tf
)

sed -i '' \
  -e "s/__PROJECT_NAME__/$PROJECT_NAME/g" \
  -e "s/__TF_ORG__/$TF_ORG/g" \
  "${FILES[@]}"

echo "✅ 프로젝트명: $PROJECT_NAME, Terraform 조직: $TF_ORG"
echo ""
echo "다음 단계:"
echo "  1. infra/.env.staging 생성 (infra/.env.example 참고)"
echo "  2. Terraform Cloud 워크스페이스 생성: $PROJECT_NAME-staging, $PROJECT_NAME-production"
echo "  3. .scripts/infra-tf.sh staging plan"
