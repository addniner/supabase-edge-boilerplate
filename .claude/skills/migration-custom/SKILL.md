---
name: migration-custom
description: RPC 함수, 트리거, moddatetime 등 Drizzle 범위 밖의 커스텀 SQL 마이그레이션. pnpm db:generate:custom으로 생성.
---

# Migration Custom (RPC/트리거/확장)

## Instructions

1. `pnpm db:generate:custom --name=설명`
2. 생성된 SQL 파일에 코드 작성
3. `supabase migration up`

## RPC 작성 패턴

```sql
DROP FUNCTION IF EXISTS my_function(text, text);

CREATE OR REPLACE FUNCTION my_function(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

GRANT EXECUTE ON FUNCTION my_function(...) TO authenticated;
```

## Important Notes

- ❌ SQL 파일이나 journal.json을 수동 생성/편집하지 마라
- ✅ 반드시 `pnpm db:generate:custom`으로 파일 생성
