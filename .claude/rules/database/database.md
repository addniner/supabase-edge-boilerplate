---
paths:
  - supabase/migrations/**/*.sql
  - supabase/functions/api/db/**/*.ts
  - supabase/functions/api/domains/**/*repository*.ts
---

# Database Rules

## Database Schema Rules

### ❌ DO NOT use

- PostgreSQL ENUM types
- CHECK constraints (for value validation)
- VARCHAR(n) or CHAR(n)

### ✅ ALWAYS use

- TEXT for all string columns
- Application-level validation (TypeScript enums + Zod schemas)

## Data Access Pattern

| 접근 방식 | 용도 | 예시 |
|-----------|------|------|
| **PostgREST (직접 테이블 접근)** | 단순 CRUD | 조회/생성/수정/삭제 |
| **RPC (DB 함수)** | 트랜잭션이 필요한 복합 작업 | insert + 상태 갱신 한 번에 |
| **Edge Functions** | 외부 API 호출, 웹훅, 알림 등 서버 사이드 로직 | 외부 알림, 웹훅 처리 |

## RLS (Row Level Security) Policy

```sql
-- 기본 패턴: 본인 데이터만 접근 (auth.uid() subquery - performance optimized)
CREATE POLICY "Users can select own data" ON public.{table}
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own data" ON public.{table}
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own data" ON public.{table}
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own data" ON public.{table}
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

## RPC 함수 패턴

```sql
CREATE OR REPLACE FUNCTION my_function(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION my_function(...) TO authenticated;
```

## Database Timestamp Handling

**Problem**: Postgres driver returns `Date` objects, but Supabase types expect `string`.

```typescript
import { toISOString, toISOStringOrNull } from "@app/utils";

toISOString(entity.createdAt);       // Date → ISO string
toISOStringOrNull(entity.deletedAt); // nullable 처리
```

## Drizzle ORM 스키마

**위치**: `supabase/functions/api/db/schema.ts`

```typescript
import { pgTable, serial, text, timestamp } from "@drizzle-orm/pg-core";

export const myTable = pgTable("my_table", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MyEntity = typeof myTable.$inferSelect;
export type NewMyEntity = typeof myTable.$inferInsert;
```

## DB 마이그레이션

### 핵심 규칙

- ❌ **DDL SQL을 직접 작성하지 마라** → `schema.ts` 수정 → `pnpm db:generate`
- ✅ RPC / 트리거 / RLS 등 drizzle-kit 범위 밖 → `pnpm db:generate:custom --name=설명`

### 테이블 변경

```bash
# 1. schema.ts 수정
# 2. pnpm db:generate
# 3. supabase migration up
```

### RPC / 트리거 / 확장

```bash
# 1. pnpm db:generate:custom --name=설명
# 2. 생성된 SQL 파일에 코드 작성
# 3. supabase migration up
```

- ❌ SQL 파일이나 journal.json을 수동 생성/편집하지 마라
- ✅ 반드시 `db:generate:custom`으로 파일 생성

### 주의사항

- **Forward-only**: 롤백 없이 새 마이그레이션으로 수정
- **One purpose per migration**: 관련 없는 변경사항 분리
- **Test locally first**: 로컬에서 먼저 테스트
