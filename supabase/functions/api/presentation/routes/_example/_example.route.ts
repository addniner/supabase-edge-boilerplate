/**
 * Example Routes
 * HTTP 요청/응답만 처리 — 비즈니스 로직은 usecase에 위임
 */

import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Response } from "@middleware";
import { NotFoundError } from "@domain/exceptions";
import { oas } from "@openapi";
import { GetExampleUseCase, CreateExampleUseCase } from "@usecases/_example";
import { ExampleResponseSchema, CreateExampleSchema } from "./_example.schema.ts";

const exampleRoute = new OpenAPIHono();
const getExampleUseCase = new GetExampleUseCase();
const createExampleUseCase = new CreateExampleUseCase();

// ============================================
// Route Definitions
// ============================================

import { z } from "@hono/zod-openapi";

const getExampleRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Example"],
  summary: "단일 조회",
  request: {
    ...oas.params(z.object({ id: z.string() })),
  },
  responses: oas.ok(ExampleResponseSchema),
});

const createExampleRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Example"],
  summary: "생성",
  request: {
    ...oas.jsonBody(CreateExampleSchema),
  },
  responses: oas.created(ExampleResponseSchema),
});

// ============================================
// Route Handlers
// ============================================

exampleRoute.openapi(getExampleRoute, async (c) => {
  const { id } = c.req.valid("param");
  const result = await getExampleUseCase.execute({ id });

  if (!result) {
    throw new NotFoundError("Example을 찾을 수 없습니다");
  }

  return Response.ok(c, result);
});

exampleRoute.openapi(createExampleRoute, async (c) => {
  const input = c.req.valid("json");
  const result = await createExampleUseCase.execute(input);

  return Response.created(c, result);
});

export { exampleRoute };
