---
name: migration-new
description: schema.ts 변경 마이그레이션. 테이블, pgPolicy, index 등 Drizzle이 관리하는 모든 스키마 변경 시 사용. schema.ts 수정 후 pnpm db:generate로 생성.
---

# Migration New (Drizzle 스키마)

## Instructions

1. `.claude/rules/database/database.md` 규칙 확인
2. `supabase/functions/api/infrastructure/db/schema.ts` 수정 (테이블, pgPolicy, index 등)
3. `pnpm db:generate`
4. 생성된 SQL 확인
5. `supabase migration up`

## Important Notes

- ❌ DDL SQL을 직접 작성하지 마라
- ❌ SQL 파일이나 journal.json을 수동 생성/편집하지 마라
- TEXT 타입 사용 (VARCHAR 금지)
- timestamp는 `withTimezone: true`
- 타입 추론 (`$inferSelect`, `$inferInsert`) 추가
