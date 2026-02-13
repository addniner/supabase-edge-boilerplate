#!/bin/bash

# Supabase DB 관리 스크립트
# 사용법: 
#   .scripts/db.sh check                    # DB diff 확인
#   .scripts/db.sh update migration_name     # 마이그레이션 생성
#   .scripts/db.sh update -r migration_name  # DB reset + 마이그레이션 생성

set -e

# 서브커맨드 확인
SUBCMD=${1:-}
if [ -z "$SUBCMD" ]; then
    echo "Error: 서브커맨드가 필요합니다."
    echo ""
    echo "사용법:"
    echo "  .scripts/db.sh check                    # DB diff 확인"
    echo "  .scripts/db.sh update migration_name     # 마이그레이션 생성"
    echo "  .scripts/db.sh update -r migration_name  # DB reset + 마이그레이션 생성"
    exit 1
fi

# check 커맨드
if [ "$SUBCMD" = "check" ]; then
    echo "🔍 DB diff를 확인합니다..."
    supabase db diff
    exit 0
fi

# update 커맨드
if [ "$SUBCMD" = "update" ]; then
    shift # update 제거
    
    # 옵션 및 인자 파싱
    RESET_DB=false
    MIGRATION_NAME=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--reset)
                RESET_DB=true
                shift
                ;;
            *)
                MIGRATION_NAME=$1
                shift
                ;;
        esac
    done
    
    # 마이그레이션 파일 이름 확인
    if [ -z "$MIGRATION_NAME" ]; then
        echo "Error: 마이그레이션 파일 이름이 필요합니다."
        echo "사용법: .scripts/db.sh update [옵션] migration_file_name"
        echo "옵션:"
        echo "  -r, --reset    DB를 reset 후 마이그레이션을 생성합니다"
        exit 1
    fi
    
    # 로컬 DB 재시작 (옵션이 있을 때만)
    if [ "$RESET_DB" = true ]; then
        echo "🚀 로컬 DB를 재시작합니다..."
        supabase db reset
    fi
    
    # diff로 마이그레이션 파일 생성
    echo "--------------------------------"
    echo "📦 마이그레이션 파일을 생성합니다..."
    echo "마이그레이션 이름: $MIGRATION_NAME"
    echo "실행된 명령어: supabase db diff -f $MIGRATION_NAME"
    
    # 명령어 실행 결과를 변수에 저장하고 출력
    DIFF_OUTPUT=$(supabase db diff -f "$MIGRATION_NAME" 2>&1)
    EXIT_CODE=$?
    echo "$DIFF_OUTPUT"

    # No schema changes found가 있는지 확인
    if echo "$DIFF_OUTPUT" | grep -q "No schema changes found"; then
        echo "❌ 변경사항이 없습니다."
        exit 1
    fi
    
    # 명령어 실행 실패 확인
    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ 마이그레이션 파일 생성 중 오류가 발생했습니다."
        exit 1
    fi
    
    # 타입 파일 생성
    echo "📝 타입 파일을 생성합니다..."
    .scripts/generate-types.sh
    
    exit 0
fi

# 잘못된 서브커맨드
echo "Error: 알 수 없는 서브커맨드 '$SUBCMD'"
echo ""
echo "사용법:"
echo "  .scripts/db.sh check                    # DB diff 확인"
echo "  .scripts/db.sh update migration_name     # 마이그레이션 생성"
echo "  .scripts/db.sh update -r migration_name  # DB reset + 마이그레이션 생성"
exit 1
