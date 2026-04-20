#!/usr/bin/env bash
set -euo pipefail

# Migration Guard: drizzle-kit을 거치지 않은 SQL 마이그레이션을 차단
#
# 검증: 모든 SQL 마이그레이션 파일에 대응하는 snapshot이 있는지 확인
#   - db:generate (스키마 변경) → SQL + snapshot → 통과
#   - db:generate:custom (RPC/트리거) → SQL + snapshot → 통과
#   - *.custom.sql (수동 허용) → snapshot 없어도 통과
#   - 그 외 수동 SQL 생성 → snapshot 없음 → 차단

MIGRATIONS_DIR="supabase/migrations"
META_DIR="$MIGRATIONS_DIR/meta"

MISSING=()

for sql_file in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$sql_file" ] || continue

  # *.custom.sql은 수동 허용 (escape hatch)
  case "$sql_file" in *.custom.sql) continue ;; esac

  basename=$(basename "$sql_file" .sql)
  idx=$(echo "$basename" | grep -o '^[0-9]*')
  snapshot="$META_DIR/${idx}_snapshot.json"

  if [ ! -f "$snapshot" ]; then
    MISSING+=("$sql_file")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  exit 0
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  migration-guard: drizzle-kit을 거치지 않은 마이그레이션 감지  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "snapshot 없는 SQL 파일:"
for f in "${MISSING[@]}"; do
  echo "  - $f"
done
echo ""
echo "해결 방법:"
echo "  1) 스키마 변경 → schema.ts 수정 후 pnpm db:generate"
echo "  2) RPC/트리거  → pnpm db:generate:custom --name=설명"
echo ""
echo "❌ SQL 파일을 직접 생성하지 마세요. 반드시 drizzle-kit을 사용하세요."
echo ""
exit 1
