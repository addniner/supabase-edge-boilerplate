#!/bin/bash
# Edge Functions 로컬 서버 시작
# 사용법: .scripts/serve.sh [-i|--inspect|-ib|--inspect-brk]

INSPECT_FLAG=""
if [[ "$1" == "-i" || "$1" == "--inspect" ]]; then
  INSPECT_FLAG="--inspect"
elif [[ "$1" == "-ib" || "$1" == "--inspect-brk" ]]; then
  INSPECT_FLAG="--inspect-mode brk"
fi

supabase functions serve --no-verify-jwt $INSPECT_FLAG
