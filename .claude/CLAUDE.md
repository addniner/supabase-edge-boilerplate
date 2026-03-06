# Supabase Edge Boilerplate

Supabase Edge Functions (Deno) + Hono + Drizzle ORM + Zod

## Tech Stack

- **Runtime**: Deno (Supabase Edge Functions)
- **Framework**: Hono ~4.7 with `@hono/zod-openapi`
- **ORM**: Drizzle ORM (beta) + postgres-js
- **Validation**: Zod ~3.23
- **Auth**: Supabase JWT + custom RBAC (JWT claims + DB permissions)
- **Infra**: Terraform (staging/production), GitHub Actions

## Commands

```bash
.scripts/serve.sh                   # local dev (hot reload)
.scripts/deno-check.sh              # type check + lint + test
.scripts/deno-check.sh -r           # with cache reload
deno test --allow-all --reporter=dot # tests only (run from supabase/functions/api/)
```

All commands must run from the repo root. Deno commands run in `supabase/functions/api/`.

## Architecture

```
supabase/functions/api/
├── index.ts          # Entry: createOpenAPIApp (jwt) + createHonoApp (webhook)
├── app/              # Framework layer (middleware, errors, utils, config)
├── clients/          # External service clients (Supabase)
├── db/               # Drizzle context, base repository, schema
├── domains/          # DDD domain modules
│   └── _example/     # Reference implementation
├── shared/           # Types, enums, interfaces, validation
└── __tests__/        # Test setup and fixtures
```

## Import Aliases (MUST use)

```typescript
import type { Context } from "@app";
import { Response, zValidator, getValidated } from "@app/middleware";
import { NotFoundError, BadRequestError } from "@app/errors";
import { Logger } from "@app/utils";
import { getConfig } from "@app/config";
import { getDrizzle } from "@db";
import { Permission, Role } from "@shared/enums";
import type { ApiEnvelope } from "@shared/types";
```

Never use relative paths across domain boundaries. Always register new domains in `deno.json` imports.

## Domain Pattern

Every domain follows this structure:

```
domains/your-domain/
├── index.ts                      # re-export only
├── your-domain.route.ts          # HTTP layer only
├── your-domain.schema.ts         # Zod schemas + inferred types
├── your-domain.service.ts        # Facade: orchestrates usecases
├── your-domain.repository.ts     # DB access only, extends BaseRepository
└── usecases/
    ├── index.ts
    └── create-your-domain.usecase.ts
```

After creating a domain, add to `deno.json` imports and register route in `index.ts`.

## Response Patterns

```typescript
return Response.ok(c, data);          // 200
return Response.created(c, data);     // 201
return Response.noContent(c);         // 204
throw new NotFoundError("message");   // 404 - auto-handled by errorHandler
throw new ValidationError("msg", errors); // 400
throw new ForbiddenError("msg");      // 403
```

Never use `c.json()` directly. Always use `Response.*` helpers.

## Request Validation

```typescript
route.post("/", zValidator("json", CreateSchema), async (c: Context) => {
  const input = getValidated<CreateInput>(c);
  // ...
});
route.get("/", zValidator("query", ListQuerySchema), async (c: Context) => {
  const query = getValidated<ListQueryInput>(c);
});
```

## Database Patterns

```typescript
// Extend BaseRepository
export class MyRepository extends BaseRepository {
  async findById(id: string) {
    return await this.db.select().from(myTable).where(eq(myTable.id, id)).limit(1);
  }
}

// Schema: use $inferSelect / $inferInsert for types
export type MyEntity = typeof myTable.$inferSelect;
export type NewMyEntity = typeof myTable.$inferInsert;
```

- `casing: "snake_case"` is set globally — DB columns are snake_case, TS is camelCase automatically.
- Transaction pooler (port 6543): `prepare: false` is handled automatically.
- Edge Function: `max: 1` connection per instance.

## Auth & RBAC

```typescript
// Middleware chain (auto-applied): JWT → RBAC → route handler
const userId = c.get("userId");
const user = c.get("user");         // JWT payload with custom claims
const userRole = c.get("userRole");
const permissions = c.get("permissions");

// Route-level permission guard
route.delete("/:id", requirePermission(Permission.RESOURCES_DELETE), handler);
route.post("/", requireAnyPermission([Permission.RESOURCES_CREATE, Permission.ALL]), handler);
```

Public routes: register in `WHITE_LISTED_ROUTES` in `app/config/routes.ts`.

## Logging

```typescript
Logger.info("message", { key: value });
Logger.warn("message", context, error);
Logger.debug("message");   // suppressed in production
Logger.error("message", context, err);
```

Never use `console.*` directly (lint rule: `no-console`).

## Lint Rules

- `no-console` — use `Logger`
- `no-explicit-any` — use proper types or `unknown`
- `no-throw-literal` — throw `Error` instances (use `CustomError` subclasses)
- `prefer-const` / `no-var`

## Do NOT

- Do not use `console.log/warn/error` — use `Logger.*`
- Do not use `c.json()` directly — use `Response.*`
- Do not throw plain strings — use `CustomError` subclasses from `@app/errors`
- Do not import across domains with relative paths — use `@domains/your-domain`
- Do not write to DB from route handlers — go through service → usecase → repository
- Do not add routes to `WHITE_LISTED_ROUTES` carelessly — authentication is bypassed
- Do not use `prepare: true` with transaction pooler (port 6543) — already handled in `drizzle.context.ts`

## Reference Docs

프로젝트 관련 문서는 `docs/` 폴더를 참고:
- `docs/project/` — 프로젝트 자체 문서 (개발, 인프라, RBAC, Drizzle 등)
- `docs/learn/` — 외부 라이브러리 참조 문서 (Hono, Drizzle, Terraform 등)

## Feature Request Workflow

기능 개발 요청을 받으면 아래 기준에 따라 작업 방식을 자동 결정한다:

### 판단 기준

| 조건 | 작업 방식 |
|---|---|
| 단일 기능, 기존 도메인 수정/확장 | **Solo** — 직접 처리 |
| 단일 기능, 새 도메인 1개 생성 | **Solo** — `_example` 참고하여 직접 생성 |
| 버그 수정, 리팩토링, 공유 코드 변경 | **Solo** — 직접 처리 |
| 독립적인 2개 이상 도메인의 새 기능 | **Team** — 도메인별 에이전트 병렬 배치 |
| 기능 간 의존성이 있는 복수 기능 | **순차 처리** — 의존 순서대로 Solo 또는 Team |

### 판단 프로세스

1. **요청 분석** — 몇 개 기능인지, 어떤 도메인에 해당하는지 파악
2. **독립성 평가** — 기능 간 공유 테이블/서비스 의존성 확인
3. **방식 결정** — 위 기준표에 따라 Solo/Team 결정
4. **사용자에게 고지** — 결정된 방식을 간단히 알린 후 진행 (예: "3개 독립 도메인이므로 팀으로 병렬 진행합니다")

### Team 구성 시

- 도메인별 에이전트 1명 (Sonnet, `general-purpose`, `bypassPermissions`)
- 각 에이전트는 자신의 도메인 파일만 생성/수정
- 공유 파일 통합은 리드(본인)가 담당
- 완료 후 `.scripts/deno-check.sh`로 전체 검증

## Agent Team Rules

코드를 수정하는 에이전트(팀원 포함)는 반드시 다음을 준수:

- **수정 후 검증 필수**: 코드 수정 완료 시 `.scripts/deno-check.sh` 실행하여 type check + lint + test 통과 확인
- **공유 파일 수정 금지 (팀 작업 시)**: 팀으로 병렬 작업 시, 각 에이전트는 자신의 도메인 파일만 수정. 공유 파일(`deno.json`, `index.ts`, `db/schema.ts`)은 팀 리드가 통합
- **모듈 최상위 레벨 주의**: `app/config/routes.ts` 등 최상위에서 실행되는 코드에서 `getConfig()` 사용 금지 (환경변수 미설정 시 테스트 실패). `Deno.env.get()` 직접 사용
