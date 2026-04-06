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
.scripts/deno-check.sh              # 통합 검증: type check → lint → test + coverage
                                    #   출력: _coverage/lcov.info (lcov 리포트)
.scripts/deno-check.sh -r           # with cache reload
deno test --allow-all --reporter=dot # tests only (run from supabase/functions/api/)
```

All commands must run from the repo root. Deno commands run in `supabase/functions/api/`.

## Architecture (Clean Architecture)

```
supabase/functions/api/
├── index.ts               # Entry: createApp (jwt/webhook)
├── edge-runtime.d.ts      # Supabase Edge Runtime 전역 타입
│
├── domain/                # Domain Layer — 비즈니스 규칙, 타입
│   ├── value-objects/     # VO, enum, 도메인 규칙 함수
│   ├── gateways/          # 외부 시스템 인터페이스
│   ├── repositories/      # repository 인터페이스 (계약)
│   └── exceptions/        # DomainError + 하위 클래스 (HTTP 상태코드 없음)
│
├── application/           # Application Layer — UseCase + DTO
│   └── usecases/          # 비즈니스 로직 (기능 단위 그룹)
│       └── my-feature/    # 예시
│
├── presentation/          # Presentation Layer — HTTP 관심사
│   ├── errors/            # domain/exceptions re-export + HTTP 매핑
│   ├── middleware/         # JWT, RBAC, CORS, error-handler, response
│   │   └── auth/          # auth.types.ts 포함
│   ├── routes/            # OpenAPI route + schema (도메인별)
│   │   └── index.ts       # barrel export (@routes alias)
│   └── utils/             # oas 헬퍼 (openapi.ts)
│
├── infrastructure/        # Infrastructure Layer — 외부 시스템 통신
│   ├── clients/           # 외부 API 클라이언트
│   ├── config/            # 환경변수 + config.types.ts
│   ├── db/                # Drizzle context, schema(엔티티 타입), BaseRepository
│   ├── factories/         # gateway factory
│   ├── logger/            # Logger
│   ├── repositories/      # DB 접근 (BaseRepository 확장)
│   └── utils/             # ngrok, public-storage-url, image, performance
│
├── domains/               # Legacy domain modules (마이그레이션 대상)
│   └── _example/          # Reference implementation
│
└── __tests__/             # Test setup (env.ts)
```

## Import Aliases (MUST use)

```typescript
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Response, requirePermission } from "@middleware";
import { NotFoundError, BadRequestError } from "@domain/exceptions";
import { Logger } from "@logger";
import { getConfig } from "@config";
import { getDrizzle } from "@db";
import { oas } from "@openapi";
import { Permission, Role } from "@domain";
import type { MyGateway } from "@domain/gateways";
import type { MyRepository } from "@domain/repositories";
import { MyRepositoryImpl } from "@repositories";
import { MyGatewayFactory } from "@factories";
```

Never use relative paths across layer boundaries. Always register new aliases in `deno.json` imports.

## Layer Dependencies

```
presentation → application → domain ← infrastructure
                    ↓
              infrastructure (usecase에서 client/repo 직접 import — 생성자 기본값 DI)
```

- **domain**: 순수 비즈니스 규칙 + 타입. `import type` from `@db`만 허용 (엔티티 타입). gateway/repository 인터페이스 정의
- **application**: domain + infrastructure import (생성자 기본값 DI). 예외는 `@domain/exceptions`에서 import
- **presentation**: application(usecase) + domain import. infrastructure 직접 참조 금지
- **infrastructure**: domain import 가능. repository/client 구현체는 domain 인터페이스를 implements

## Route Pattern (OpenAPI)

`createRoute` + `.openapi()` + `oas` 헬퍼 패턴. 상세는 [routes.md](.claude/rules/layers/routes.md) 참고.

### Response (핸들러용)

```typescript
return Response.ok(c, data);          // 200
return Response.created(c, data);     // 201
return Response.noContent(c);         // 204
throw new NotFoundError("message");   // 404 - auto-handled by errorHandler
throw new ValidationError("msg", errors); // 400
throw new ForbiddenError("msg");      // 403
```

## Usecase Pattern

각 usecase 그룹은 자기 dto와 mapper를 소유:

```
application/usecases/my-feature/
├── do-something.usecase.ts
├── get-something.usecase.ts
├── dto.ts              # Input/Output 타입 정의
├── mapper.ts           # 외부 응답 → 내부 모델 변환
├── index.ts            # barrel export
└── *.usecase.test.ts
```

```typescript
export class DoSomethingUseCase {
  constructor(
    private myRepo: MyRepository = new MyRepositoryImpl(),
    private myGateway: MyGateway = new MyGatewayImpl(),
  ) {}

  async execute(input: { userId: string; itemId: string }) {
    // 비즈니스 로직
  }
}
```

규칙:
- 클래스 1개 = 파일 1개, public 메서드는 `execute()` 하나만
- 여러 repository/client를 자유롭게 조합 가능
- DI 패턴: 생성자 기본값 (프로덕션), mock 주입 (테스트)
- gateway factory DI: `private gatewayFactory: typeof createMyGateway = createMyGateway`
- 테스트 파일 동위치: `*.usecase.test.ts`

상세는 [usecases.md](.claude/rules/layers/usecases.md) 참고.

## Database Patterns

```typescript
// domain/repositories/ — 인터페이스 정의
export interface MyRepository {
  findById(id: string): Promise<MyEntity | null>;
}

// infrastructure/repositories/ — 구현체 (Impl 접미사)
export class MyRepositoryImpl extends BaseRepository implements MyRepository {
  async findById(id: string) {
    return await this.db.select().from(myTable).where(eq(myTable.id, id)).limit(1);
  }
}

// infrastructure/db/schema.ts — 엔티티 타입
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

// Route-level permission guard (createRoute의 middleware에 지정)
middleware: [requirePermission(Permission.RESOURCES_DELETE)] as const,
```

Public routes: register in `WHITE_LISTED_ROUTES` in `infrastructure/config/routes.ts`.

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
- Do not use `c.json()` directly in route handlers — use `Response.*`
- Do not use `zValidator`/`getValidated` in `.openapi()` handlers — use `c.req.valid()`
- Do not annotate `c: Context` in `.openapi()` handlers — 타입 자동 추론 필요
- Do not throw plain strings — use `DomainError` subclasses from `@domain/exceptions`
- Do not import across layers with relative paths — use aliases
- Do not write to DB from route handlers — go through usecase → repository
- Do not create service files — all business logic goes in `usecases/`
- Do not add routes to `WHITE_LISTED_ROUTES` carelessly — authentication is bypassed
- Do not use `prepare: true` with transaction pooler (port 6543) — already handled in `drizzle.context.ts`
- Do not put types in `shared/` — each layer owns its types

## Detailed Rules

Path-specific rules are auto-loaded in `.claude/rules/`:

- **[database.md](.claude/rules/database/database.md)** - DB schema, RLS, timestamps, migrations
- **[repositories.md](.claude/rules/layers/repositories.md)** - Data access layer
- **[usecases.md](.claude/rules/layers/usecases.md)** - Business logic layer
- **[clients.md](.claude/rules/layers/clients.md)** - External API clients
- **[routes.md](.claude/rules/layers/routes.md)** - HTTP route layer (OpenAPI)
- **[testing.md](.claude/rules/layers/testing.md)** - Test conventions, mock patterns, coverage
- **[infra.md](.claude/rules/infra.md)** - Terraform infrastructure

## Reference Docs

프로젝트 관련 문서는 `docs/` 폴더를 참고:
- `docs/project/` — 프로젝트 자체 문서 (개발, 인프라, RBAC, Drizzle 등)
- `docs/learn/` — 외부 라이브러리 참조 문서 (Hono, Drizzle, Terraform 등)

## Feature Request Workflow

기능 개발 요청을 받으면 아래 기준에 따라 작업 방식을 자동 결정한다:

### 판단 기준

| 조건 | 작업 방식 |
|---|---|
| 단일 기능, 기존 usecase 수정/확장 | **Solo** — 직접 처리 |
| 단일 기능, 새 usecase 그룹 생성 | **Solo** — 직접 생성 |
| 버그 수정, 리팩토링, 공유 코드 변경 | **Solo** — 직접 처리 |
| 독립적인 2개 이상 usecase 그룹의 새 기능 | **Team** — 그룹별 에이전트 병렬 배치 |
| 기능 간 의존성이 있는 복수 기능 | **순차 처리** — 의존 순서대로 Solo 또는 Team |

### 판단 프로세스

1. **요청 분석** — 몇 개 기능인지, 어떤 usecase 그룹에 해당하는지 파악
2. **독립성 평가** — 기능 간 공유 테이블/서비스 의존성 확인
3. **방식 결정** — 위 기준표에 따라 Solo/Team 결정
4. **사용자에게 고지** — 결정된 방식을 간단히 알린 후 진행

### Team 구성 시

- usecase 그룹별 에이전트 1명 (Sonnet, `general-purpose`, `bypassPermissions`)
- 각 에이전트는 자신의 usecase 그룹 파일만 생성/수정
- 공유 파일 통합은 리드(본인)가 담당
- 완료 후 `.scripts/deno-check.sh`로 전체 검증

## Agent Team Rules

코드를 수정하는 에이전트(팀원 포함)는 반드시 다음을 준수:

- **수정 후 검증 필수**: 코드 수정 완료 시 `.scripts/deno-check.sh` 실행하여 type check + lint + test 통과 확인
- **공유 파일 수정 금지 (팀 작업 시)**: 팀으로 병렬 작업 시, 각 에이전트는 자신의 파일만 수정. 공유 파일(`deno.json`, `index.ts`, `db/schema.ts`)은 팀 리드가 통합
- **모듈 최상위 레벨 주의**: `infrastructure/config/routes.ts` 등 최상위에서 실행되는 코드에서 `getConfig()` 사용 금지 (환경변수 미설정 시 테스트 실패). `Deno.env.get()` 직접 사용
