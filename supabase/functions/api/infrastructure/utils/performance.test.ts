import "@test/env";

import { assertEquals, assertRejects } from "@std/assert";
import { measureTime } from "./performance.ts";

Deno.test("measureTime - 함수 결과를 정상 반환", async () => {
  const result = await measureTime("test-sync", () => Promise.resolve(42));
  assertEquals(result, 42);
});

Deno.test("measureTime - 비동기 함수 지원", async () => {
  const expected = { data: "async-result" };
  const result = await measureTime("test-async", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return expected;
  });
  assertEquals(result, expected);
});

Deno.test("measureTime - 에러 발생 시 에러 전파", async () => {
  await assertRejects(
    () =>
      measureTime("test-error", () => {
        return Promise.reject(new Error("test error"));
      }),
    Error,
    "test error",
  );
});

Deno.test("measureTime - async 함수 내 throw 시 에러 타입 보존", async () => {
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CustomError";
    }
  }

  await assertRejects(
    () =>
      measureTime("test-custom-error", async () => {
        await Promise.resolve();
        throw new CustomError("커스텀 에러 발생");
      }),
    CustomError,
    "커스텀 에러 발생",
  );
});
