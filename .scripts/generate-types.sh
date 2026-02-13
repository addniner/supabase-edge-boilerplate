#!/bin/bash

# Supabase 타입 생성 스크립트
# 사용법: ./.scripts/generate-types.sh
#
# 마이그레이션 변경 후 타입 재생성이 필요할 때 실행
# 생성된 타입: supabase/functions/_shared/types/supabase.types.ts

set -e

echo "🔧 Supabase 타입 생성 중..."

OUTPUT_PATH="supabase/functions/_shared/types/supabase.types.ts"

# 디렉토리가 없으면 생성
mkdir -p "$(dirname "$OUTPUT_PATH")"

# 타입 파일 생성
echo "📝 supabase.types.ts 생성 중..."
supabase gen types typescript --local > $OUTPUT_PATH

echo "✅ 타입 생성 완료!"
echo "📁 생성된 파일: $OUTPUT_PATH"
echo "🎉 완료!"
