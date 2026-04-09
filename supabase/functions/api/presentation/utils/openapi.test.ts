import "@test";

import { assertEquals } from "@std/assert";
import { z } from "@zod";
import { oas } from "./openapi.ts";

// =============================================================================
// oas.ok
// =============================================================================

Deno.test("oas.ok - 200 키 존재 및 description 기본값 '성공'", () => {
  const result = oas.ok(z.object({ id: z.string() }));

  assertEquals(typeof result[200], "object");
  assertEquals(result[200].description, "성공");
});

Deno.test("oas.ok - 커스텀 description 설정", () => {
  const result = oas.ok(z.object({ id: z.string() }), "사용자 조회 성공");

  assertEquals(result[200].description, "사용자 조회 성공");
});

Deno.test("oas.ok - envelope 스키마가 유효한 데이터를 파싱할 수 있는지", () => {
  const result = oas.ok(z.object({ id: z.string() }));
  const schema = result[200].content["application/json"].schema;

  const parsed = schema.parse({
    isSuccess: true,
    code: "COMMON_2000",
    message: "OK",
    data: { id: "1" },
    errors: null,
  });

  assertEquals(parsed.isSuccess, true);
  assertEquals(parsed.code, "COMMON_2000");
  assertEquals(parsed.message, "OK");
  assertEquals(parsed.data, { id: "1" });
  assertEquals(parsed.errors, null);
});

Deno.test("oas.ok - envelope 스키마가 잘못된 데이터를 거부하는지", () => {
  const result = oas.ok(z.object({ id: z.string() }));
  const schema = result[200].content["application/json"].schema;

  // isSuccess가 false인 경우 거부
  const invalidResult = schema.safeParse({
    isSuccess: false,
    code: "COMMON_2000",
    message: "OK",
    data: { id: "1" },
    errors: null,
  });

  assertEquals(invalidResult.success, false);
});

// =============================================================================
// oas.created
// =============================================================================

Deno.test("oas.created - 201 키 존재 및 description 기본값 '생성 성공'", () => {
  const result = oas.created(z.object({ id: z.string() }));

  assertEquals(typeof result[201], "object");
  assertEquals(result[201].description, "생성 성공");
});

// =============================================================================
// oas.params
// =============================================================================

Deno.test("oas.params - params 키 포함", () => {
  const schema = z.object({ id: z.string() });
  const result = oas.params(schema);

  assertEquals(typeof result.params, "object");
  assertEquals(result.params, schema);
});

// =============================================================================
// oas.query
// =============================================================================

Deno.test("oas.query - query 키 포함", () => {
  const schema = z.object({ page: z.string().optional() });
  const result = oas.query(schema);

  assertEquals(typeof result.query, "object");
  assertEquals(result.query, schema);
});

// =============================================================================
// oas.jsonBody
// =============================================================================

Deno.test("oas.jsonBody - application/json content 구조", () => {
  const schema = z.object({ name: z.string() });
  const result = oas.jsonBody(schema);

  assertEquals(typeof result.body, "object");
  assertEquals(typeof result.body.content["application/json"], "object");
  assertEquals(result.body.content["application/json"].schema, schema);
});

// =============================================================================
// oas.formBody
// =============================================================================

Deno.test("oas.formBody - multipart/form-data content 구조", () => {
  const schema = z.object({ file: z.instanceof(File) });
  const result = oas.formBody(schema);

  assertEquals(typeof result.body, "object");
  assertEquals(typeof result.body.content["multipart/form-data"], "object");
  assertEquals(result.body.content["multipart/form-data"].schema, schema);
});
