# 개발 가이드

## 프로젝트 구조

```
supabase/functions/api/
├── index.ts               # Entry: createApp (jwt/webhook)
├── edge-runtime.d.ts      # Supabase Edge Runtime 전역 타입
│
├── domain/                # Domain Layer — 비즈니스 규칙, 타입
│   ├── value-objects/     # VO, enum, 도메인 규칙 함수
│   └── gateways/          # 외부 시스템 인터페이스 (PaymentGateway 등)
│
├── application/           # Application Layer — UseCase + DTO
│   └── usecases/          # 비즈니스 로직 (기능 단위 그룹)
│
├── presentation/          # Presentation Layer — HTTP 관심사
│   ├── errors/            # CustomError + types.ts
│   ├── middleware/         # JWT, RBAC, CORS, error-handler, response
│   ├── routes/            # OpenAPI route + schema (도메인별)
│   └── utils/             # oas 헬퍼
│
├── infrastructure/        # Infrastructure Layer — 외부 시스템 통신
│   ├── clients/           # 외부 API (portone, elevenlabs, openai, replicate 등)
│   ├── config/            # 환경변수
│   ├── db/                # Drizzle context, schema, BaseRepository
│   ├── factories/         # gateway factory (createTtsGateway, createStockVideoGateway)
│   ├── logger/            # Logger
│   ├── repositories/      # DB 접근 (BaseRepository 확장)
│   └── utils/             # ngrok, public-storage-url, image, performance
│
└── __tests__/             # Test setup and fixtures
```

상세 아키텍처와 규칙은 `.claude/CLAUDE.md`를 참고.

## 새 기능 추가하기

Clean Architecture 레이어 순서로 작성:

### 1. Domain (필요 시)

```
domain/value-objects/
└── my-feature.ts          # VO, enum, 도메인 규칙 함수
```

### 2. Application

```
application/usecases/my-feature/
├── do-something.usecase.ts
├── do-something.usecase.test.ts
├── dto.ts                 # Input/Output 타입
├── mapper.ts              # 외부 응답 → 내부 모델 변환 (필요 시)
└── index.ts               # barrel export
```

```typescript
export class DoSomethingUseCase {
  constructor(
    private myRepo = new MyRepository(),
    private externalClient = new ExternalClient(),
  ) {}

  async execute(input: DoSomethingInput): Promise<DoSomethingOutput> {
    // 비즈니스 로직
  }
}
```

### 3. Presentation

```
presentation/routes/my-feature/
└── my-feature.route.ts    # OpenAPI route + schema
```

```typescript
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Response, requirePermission } from "@middleware";
import { oas } from "@openapi";
import { DoSomethingUseCase } from "@usecases/my-feature";

const route = createRoute({
  method: "post",
  path: "/my-feature",
  middleware: [requirePermission(Permission.MY_FEATURE_CREATE)] as const,
  request: { body: oas.jsonBody(InputSchema) },
  responses: { 200: oas.json(OutputSchema) },
});

app.openapi(route, async (c) => {
  const input = c.req.valid("json");
  const usecase = new DoSomethingUseCase();
  const result = await usecase.execute(input);
  return Response.ok(c, result);
});
```

### 4. Infrastructure (필요 시)

```
infrastructure/repositories/my.repository.ts   # DB 접근
infrastructure/clients/external.client.ts      # 외부 API
```

### 5. Import 등록

`deno.json`의 imports에 alias 추가 후 `index.ts`에 라우트 등록.

## 로컬 개발

```bash
# Edge Functions 로컬 서빙 (핫 리로드)
.scripts/serve.sh

# 통합 검증: type check → lint → test + coverage
.scripts/deno-check.sh

# Deno 캐시 재로드 후 검증
.scripts/deno-check.sh -r
```

## API 문서

로컬 서버 실행 후 Swagger UI에서 확인:

- http://127.0.0.1:54321/functions/v1/api/docs
