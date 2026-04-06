---
paths:
  - supabase/functions/api/presentation/routes/**/*route*.ts
---

# Route Layer Rules

## Purpose

Routes are **thin HTTP layer** — request validation, usecase call, response return. No business logic.

## Core Principles

- ✅ **createRoute + .openapi()** - Swagger 자동 생성
- ✅ **oas 헬퍼 사용** - `oas.ok()`, `oas.created()`, `oas.jsonBody()`, `oas.params()`, `oas.query()`
- ✅ **Response 헬퍼 사용** - `Response.ok(c, data)`, `Response.created(c, data)`
- ✅ **에러는 throw** - `throw new NotFoundError()` → errorHandler 처리
- ❌ **c: Context 타입 명시 금지** - `.openapi()` 핸들러에서 자동 추론
- ❌ **c.json() 직접 사용 금지** - Response 헬퍼 사용
- ❌ **zValidator/getValidated 금지** - `c.req.valid()` 사용
- ❌ **비즈니스 로직 금지** - usecase에 위임

## Template

```typescript
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Response, requirePermission } from "@middleware";
import { Permission } from "@domain";
import { oas } from "@openapi";
import { MyUseCase } from "@usecases/my-group";
import { MyParamsSchema, MyResponseSchema, CreateMySchema } from "./my.schema.ts";

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
```

## Schema Files

각 route 폴더에 `*.schema.ts` 파일로 Zod schema 정의:
- Zod schema만 export (검증 + OpenAPI 문서용)
- `z.infer` 타입은 export하지 않음 — route에서 `c.req.valid()` 타입 추론 사용
- 공유 타입이 필요하면 usecase의 dto.ts 또는 domain에 정의
