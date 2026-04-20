---
name: add-feature
description: 새 API 기능 추가. presentation(route+schema) + application(usecase+dto) + domain(value-objects) + infrastructure(repository)를 클린 아키텍처 패턴에 맞게 생성. 새 API 엔드포인트나 기능 추가 시 사용.
---

# Add Feature

## Instructions

1. **요구사항 분석** — 새 기능인지, 기존 기능 확장인지 판단
2. **레이어별 파일 생성** (아래 구조 참고)
3. **등록 작업**:
   - `deno.json`에 alias 추가 (`@routes/{name}`, `@usecases/{name}`)
   - `index.ts`에 라우트 등록
   - 새 repository → `infrastructure/repositories/index.ts`에 export 추가
   - 새 도메인 타입 → `domain/value-objects/index.ts`에 export 추가
4. `.scripts/deno-check.sh`로 검증

## 새 기능 vs 기존 확장

| 케이스 | 작업 |
|---|---|
| 새 API 엔드포인트 그룹 | presentation/routes + application/usecases 새로 생성 |
| 기존 그룹에 엔드포인트 추가 | 기존 route에 핸들러 추가 + usecase 파일 추가 |
| 기존 usecase에 로직 변경 | usecase 파일만 수정 |

## 파일 구조

### Domain (비즈니스 규칙 — 필요 시)

```
domain/value-objects/
└── {name}.ts              # VO, enum, 도메인 규칙 함수

domain/gateways/
└── {name}-gateway.ts      # 외부 시스템 인터페이스 (필요 시)
```

### Application (비즈니스 로직)

```
application/usecases/{group}/
├── {action}.usecase.ts     # 비즈니스 로직 (1클래스 = 1파일)
├── {action}.usecase.test.ts # 테스트 필수
├── dto.ts                  # Input/Output 타입 정의 (필요 시)
├── mapper.ts               # 외부 → 내부 변환 (필요 시)
└── index.ts                # barrel export
```

### Presentation (HTTP 레이어)

```
presentation/routes/{name}/
├── {name}.route.ts         # HTTP 핸들러 — usecase 호출만
└── {name}.schema.ts        # Zod schema (검증 + OpenAPI)
```

### Infrastructure (필요 시)

```
infrastructure/repositories/{name}.repository.ts  # DB 접근
infrastructure/clients/{name}.client.ts            # 외부 API
```

## 테스트

- **usecase 테스트 필수** — 외부 의존성은 생성자 DI로 mock 주입
- 라우트 테스트 불필요 (라우트는 thin layer)

## Template: Route

```typescript
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Response, requirePermission } from "@middleware";
import { Permission } from "@domain";
import { oas } from "@openapi";
import { MyUseCase } from "@usecases/my-group";
import { MyParamsSchema, MyResponseSchema } from "./my.schema.ts";

const myRoute = new OpenAPIHono();
const myUseCase = new MyUseCase();

const getRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["My"],
  summary: "조회",
  middleware: [requirePermission(Permission.MY_READ)] as const,
  request: oas.params(MyParamsSchema),
  responses: oas.ok(MyResponseSchema),
});

myRoute.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  const result = await myUseCase.execute({ id });
  return Response.ok(c, result);
});

export { myRoute };
```

## Template: UseCase

```typescript
import { Logger } from "@logger";
import { NotFoundError } from "@domain/exceptions";
import type { MyRepository } from "@domain/repositories";
import { MyRepositoryImpl } from "@repositories";

export class MyUseCase {
  constructor(private repo: MyRepository = new MyRepositoryImpl()) {}

  async execute(input: { id: string }) {
    // business logic
  }
}
```

## Important

- `createRoute` + `.openapi()` + `oas` 헬퍼 사용
- `.openapi()` 핸들러에서 `c: Context` 타입 명시 금지 (자동 추론)
- `zValidator`/`getValidated` 사용 금지 → `c.req.valid()` 사용
- schema에서 `z.infer` 타입 export 금지 — 필요하면 usecase의 dto.ts에 정의
- 도메인 규칙(비즈니스 로직 함수, 공유 타입)은 `domain/value-objects/`에 정의
- 타입은 각 레이어가 소유 — shared 폴더 사용 금지
