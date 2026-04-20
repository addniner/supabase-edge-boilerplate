---
name: migration-custom
description: RPC 함수, 트리거 등 schema.ts로 표현할 수 없는 SQL 마이그레이션. pnpm db:generate:custom으로 생성. pgPolicy/index/테이블 변경은 migration-new 사용.
---

# Migration Custom (RPC/트리거/확장)

## Instructions

1. `pnpm db:generate:custom --name=설명.custom` ( 접미사 필수)
2. 생성된 SQL 파일에 코드 작성
3. `supabase migration up`

## RPC 작성 패턴

```sql
-- 시그니처 변경 시 기존 함수 먼저 DROP
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
- ✅ 반드시 `pnpm db:generate:custom`으로 파일 생성 (snapshot이 함께 생성됨)
- ✅ snapshot이 없는 마이그레이션은 `migration-guard`에 의해 push/CI에서 차단됨
- ✅ 테이블/컬럼 변경은 이 skill이 아닌 `migration-new`를 사용 (schema.ts → db:generate)
