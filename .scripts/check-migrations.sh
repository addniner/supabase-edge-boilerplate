#!/bin/bash
# 마이그레이션 충돌 방지 스크립트

set -e

echo "🔍 마이그레이션 파일 검사 중..."

# 마이그레이션 디렉토리 확인
MIGRATIONS_DIR="supabase/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ 마이그레이션 디렉토리를 찾을 수 없습니다: $MIGRATIONS_DIR"
    exit 1
fi

# 새로 추가된 마이그레이션 파일들 확인
NEW_MIGRATIONS=$(git diff --cached --name-only --diff-filter=A | grep "supabase/migrations/.*\.sql$")

if [ -z "$NEW_MIGRATIONS" ]; then
    echo "✅ 새로운 마이그레이션 파일이 없습니다."
    exit 0
fi

echo "📝 새로 추가된 마이그레이션 파일들:"
echo "$NEW_MIGRATIONS"

# 타임스탬프 중복 체크
TIMESTAMPS=()
for file in $NEW_MIGRATIONS; do
    filename=$(basename "$file")
    timestamp=$(echo "$filename" | cut -d'_' -f1)
    
    # 타임스탬프 형식 검증 (YYYYMMDDHHMMSS)
    if ! [[ "$timestamp" =~ ^[0-9]{14}$ ]]; then
        echo "❌ 잘못된 마이그레이션 파일명 형식: $filename"
        echo "   올바른 형식: YYYYMMDDHHMMSS_description.sql"
        exit 1
    fi
    
    # 중복 체크
    if [[ " ${TIMESTAMPS[@]} " =~ " ${timestamp} " ]]; then
        echo "❌ 중복된 타임스탬프 발견: $timestamp"
        echo "   파일들:"
        for f in $NEW_MIGRATIONS; do
            if [[ "$(basename "$f")" =~ ^${timestamp}_ ]]; then
                echo "     - $f"
            fi
        done
        echo ""
        echo "💡 해결 방법:"
        echo "   1. 마이그레이션 파일명의 타임스탬프를 수정하세요"
        echo "   2. 또는 'supabase migration new' 명령으로 새로 생성하세요"
        exit 1
    fi
    
    TIMESTAMPS+=("$timestamp")
done

# 기존 마이그레이션과의 충돌 체크
echo "🔍 기존 마이그레이션과의 충돌 체크..."
for file in $NEW_MIGRATIONS; do
    filename=$(basename "$file")
    timestamp=$(echo "$filename" | cut -d'_' -f1)
    
    # 기존 파일들 중 같은 타임스탬프가 있는지 확인
    existing_files=$(find "$MIGRATIONS_DIR" -name "${timestamp}_*.sql" -not -path "*/.*")
    if [ -n "$existing_files" ]; then
        echo "❌ 기존 마이그레이션과 타임스탬프 충돌: $timestamp"
        echo "   기존 파일: $existing_files"
        echo "   새 파일: $file"
        exit 1
    fi
done

echo "✅ 마이그레이션 파일 검사 완료!"
echo "🎉 모든 마이그레이션이 안전합니다."
