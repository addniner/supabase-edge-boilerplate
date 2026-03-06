---
name: migration-new
description: 테이블 스키마 변경 마이그레이션. schema.ts 수정 후 pnpm db:generate로 생성. 테이블 CREATE/ALTER/DROP 시 사용.
---

# Migration New (테이블 스키마)

## Instructions

1. `.claude/rules/database/database.md` 규칙 확인
2. `supabase/functions/api/db/schema.ts` 수정
3. `pnpm db:generate`
4. 생성된 SQL 확인
5. `supabase migration up`

## Important Notes

- ❌ DDL SQL을 직접 작성하지 마라
- ❌ SQL 파일이나 journal.json을 수동 생성/편집하지 마라
- TEXT 타입 사용 (VARCHAR 금지)
- timestamp는 `withTimezone: true`
- 타입 추론 (`$inferSelect`, `$inferInsert`) 추가
