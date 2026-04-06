/**
 * Example Routes
 * HTTP 요청/응답만 처리
 */

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Response } from "@middleware";
import { NotFoundError } from "@errors";
import { oas } from "@openapi";
import { ExampleService } from "./example.service.ts";
import {
  CreateExampleSchema,
  type CreateExampleInput,
} from "./example.schema.ts";

const exampleRoute = new OpenAPIHono();
const exampleService = new ExampleService();

// ============================================
// Route Definitions
// ============================================

const ExampleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

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

/**
 * GET /example/:id
 * 단일 조회
 */
exampleRoute.openapi(getExampleRoute, async (c) => {
  const { id } = c.req.valid("param");
  const result = await exampleService.getExample(id);

  if (!result) {
    throw new NotFoundError("Example을 찾을 수 없습니다");
  }

  return Response.ok(c, result.example);
});

/**
 * POST /example
 * 생성
 */
exampleRoute.openapi(createExampleRoute, async (c) => {
  const input = c.req.valid("json") as CreateExampleInput;
  const result = await exampleService.createExample(input);

  return Response.created(c, result.example);
});

export { exampleRoute };
