import "@test/env";

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

// =============================================================================
// oas.noContent
// =============================================================================

Deno.test("oas.noContent - 204 키 존재 및 description 기본값", () => {
  const result = oas.noContent();

  assertEquals(typeof result[204], "object");
  assertEquals(result[204].description, "성공 (응답 본문 없음)");
});

Deno.test("oas.noContent - 커스텀 description", () => {
  const result = oas.noContent("삭제 완료");

  assertEquals(result[204].description, "삭제 완료");
});

// =============================================================================
// oas.okOrStream
// =============================================================================

Deno.test("oas.okOrStream - JSON + SSE 두 content type 포함", () => {
  const jsonSchema = z.object({ id: z.string() });
  const chunkSchema = z.object({ delta: z.string() });
  const result = oas.okOrStream(jsonSchema, chunkSchema, "스트리밍 설명");

  assertEquals(typeof result[200], "object");
  const contentTypes = Object.keys(result[200].content);
  assertEquals(contentTypes.includes("application/json"), true);
  assertEquals(contentTypes.includes("text/event-stream"), true);
  assertEquals(result[200].content["text/event-stream"].schema, chunkSchema);
});

Deno.test("oas.okOrStream - description에 SSE 설명 포함", () => {
  const result = oas.okOrStream(z.string(), z.string(), "chunk format", "조회 성공");

  assertEquals(result[200].description.includes("조회 성공"), true);
  assertEquals(result[200].description.includes("SSE Streaming"), true);
  assertEquals(result[200].description.includes("chunk format"), true);
});

Deno.test("oas.okOrStream - JSON envelope 스키마 파싱 가능", () => {
  const jsonSchema = z.object({ text: z.string() });
  const chunkSchema = z.object({ delta: z.string() });
  const result = oas.okOrStream(jsonSchema, chunkSchema, "설명");

  const schema = result[200].content["application/json"].schema;
  const parsed = schema.parse({
    isSuccess: true,
    code: "OK",
    message: "success",
    data: { text: "hello" },
    errors: null,
  });

  assertEquals(parsed.data, { text: "hello" });
});
