#!/bin/bash
# Terraform 포맷팅 스크립트
# 사용법: .scripts/infra-tf-fmt.sh [check]
#   인자 없음: 자동 포맷팅 적용
#   check:    포맷 검사만 (CI용)

set -euo pipefail

ACTION="${1:-}"
INFRA_DIR="infra"

if [[ "$ACTION" == "check" ]]; then
  echo "🔍 Terraform 포맷 검사 중..."
  terraform fmt -check -recursive "$INFRA_DIR"
  echo "✅ 포맷 검사 통과!"
else
  echo "🔧 Terraform 포맷팅 중..."
  terraform fmt -recursive "$INFRA_DIR"
  echo "✅ 포맷팅 완료!"
fi
