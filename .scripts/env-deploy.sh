#!/bin/bash
# Edge Functions 환경변수 배포 스크립트
# 환경별 .env 파일에서 PROJECT_ID를 읽어 supabase secrets 배포
# 사용법: .scripts/env-deploy.sh

set -euo pipefail

options=("staging" "production")
selected=0
count=${#options[@]}

draw_menu() {
  tput civis
  for i in "${!options[@]}"; do
    if [ $i -eq $selected ]; then
      echo "  > ${options[$i]}"
    else
      echo "    ${options[$i]}"
    fi
  done
}

echo "Select environment: (use arrow keys)"
draw_menu

while read -rsn1 key; do
  [[ $key == "" ]] && break
  [[ $key == $'\x1b' ]] && read -rsn2 key
  case $key in
    '[A') ((selected = (selected - 1 + count) % count)) ;;
    '[B') ((selected = (selected + 1) % count)) ;;
    *) continue ;;
  esac
  for ((i = 0; i < count; i++)); do tput cuu1 && tput el; done
  draw_menu
done

tput cnorm

env="${options[$selected]}"
ENV_FILE="infra/.env.$env"

if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "❌ $ENV_FILE 파일이 없습니다."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${PROJECT_ID:-}" ]]; then
  echo ""
  echo "❌ $env 환경의 PROJECT_ID가 설정되지 않았습니다."
  echo "   $ENV_FILE에서 PROJECT_ID를 설정하세요."
  exit 1
fi

echo ""
echo "Deploying to $env..."
supabase secrets set --env-file "./supabase/functions/.env.$env" --project-ref "$PROJECT_ID" --debug
