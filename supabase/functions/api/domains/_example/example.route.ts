/**
 * Example Routes
 * HTTP 요청/응답만 처리
 */

import { Hono } from "@hono";
import type { Context } from "@app";
import { Response, zValidator, getValidated } from "@app/middleware";
import { NotFoundError } from "@app/errors";
import { ExampleService } from "./example.service.ts";
import {
  CreateExampleSchema,
  type CreateExampleInput,
} from "./example.schema.ts";

const exampleRoute = new Hono();
const exampleService = new ExampleService();

/**
 * GET /example/:id
 * 단일 조회
 */
exampleRoute.get("/:id", async (c: Context) => {
  const id = c.req.param("id");
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
exampleRoute.post(
  "/",
  zValidator("json", CreateExampleSchema),
  async (c: Context) => {
    const input = getValidated<CreateExampleInput>(c);
    const result = await exampleService.createExample(input);

    return Response.created(c, result.example);
  },
);

export { exampleRoute };
