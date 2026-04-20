import "@test/env";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { TooManyRequestsError } from "./too-many-requests.error.ts";
import { DomainError } from "./domain-error.ts";

Deno.test("TooManyRequestsError - 기본 메시지", () => {
  const error = new TooManyRequestsError();

  assertInstanceOf(error, DomainError);
  assertEquals(error.code, "TOO_MANY_REQUESTS");
  assertEquals(error.message, "Too Many Requests");
  assertEquals(error.errors, null);
});

Deno.test("TooManyRequestsError - 커스텀 메시지 + errors", () => {
  const errors = [{ field: "api", reason: "rate limit exceeded" }];
  const error = new TooManyRequestsError("요청이 너무 많습니다", errors);

  assertEquals(error.code, "TOO_MANY_REQUESTS");
  assertEquals(error.message, "요청이 너무 많습니다");
  assertEquals(error.errors, errors);
});
