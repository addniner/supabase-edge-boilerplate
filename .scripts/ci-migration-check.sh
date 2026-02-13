#!/bin/bash
# CI에서 마이그레이션 순서 검증 스크립트

set -e

echo "🔍 CI: 마이그레이션 순서 검증 중..."

MIGRATIONS_DIR="supabase/migrations"

# 마이그레이션 파일들을 타임스탬프 순으로 정렬
migration_files=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

echo "📝 마이그레이션 파일 순서:"
for file in $migration_files; do
    echo "  $(basename "$file")"
done

# 타임스탬프 중복 체크
timestamps=()
for file in $migration_files; do
    filename=$(basename "$file")
    timestamp=$(echo "$filename" | cut -d'_' -f1)
    
    if [[ " ${timestamps[@]} " =~ " ${timestamp} " ]]; then
        echo "❌ 중복된 타임스탬프 발견: $timestamp"
        echo "   충돌하는 파일들:"
        for f in $migration_files; do
            if [[ "$(basename "$f")" =~ ^${timestamp}_ ]]; then
                echo "     - $(basename "$f")"
            fi
        done
        exit 1
    fi
    
    timestamps+=("$timestamp")
done

echo "✅ 마이그레이션 순서 검증 완료!"

# 마이그레이션 적용 테스트
echo "🧪 마이그레이션 적용 테스트..."
supabase db reset --linked=false
echo "✅ 마이그레이션 적용 성공!"
