import "@test/env";
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Hono } from "@hono";
import { z } from "@zod";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@domain/exceptions";
import { errorHandler, notFoundHandler } from "./error-handler.ts";

// =============================================================================
// 테스트 헬퍼: Hono 앱 생성
// =============================================================================

function createApp() {
  const app = new Hono();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  return app;
}

// =============================================================================
// DomainError 서브클래스 → HTTP 상태 코드 매핑
// =============================================================================

describe("errorHandler - DomainError 상태 코드 매핑", () => {
  it("BadRequestError → 400, isSuccess:false, code:BAD_REQUEST", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new BadRequestError("잘못된 요청");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 400);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "BAD_REQUEST");
    assertEquals(body.message, "잘못된 요청");
  });

  it("NotFoundError → 404", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new NotFoundError("리소스 없음");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 404);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "NOT_FOUND");
  });

  it("UnauthorizedError → 401", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new UnauthorizedError("인증 실패");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 401);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "UNAUTHORIZED");
  });

  it("ForbiddenError → 403", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new ForbiddenError("접근 금지");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 403);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "FORBIDDEN");
  });

  it("ConflictError → 409", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new ConflictError("중복 충돌");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 409);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "CONFLICT");
  });

  it("InternalServerError → 500", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new InternalServerError("서버 내부 오류");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 500);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "INTERNAL_SERVER_ERROR");
  });
});

// =============================================================================
// ValidationError - errors 배열 포함
// =============================================================================

describe("errorHandler - ValidationError errors 배열", () => {
  it("ValidationError → 400, errors 배열에 field/reason 포함", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new ValidationError("유효성 검사 실패", [
        { field: "name", reason: "이름은 필수입니다" },
        { field: "email", reason: "이메일 형식이 올바르지 않습니다" },
      ]);
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 400);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "VALIDATION_ERROR");
    assertEquals(Array.isArray(body.errors), true);
    assertEquals(body.errors.length, 2);
    assertEquals(body.errors[0].field, "name");
    assertEquals(body.errors[0].reason, "이름은 필수입니다");
    assertEquals(body.errors[1].field, "email");
    assertEquals(body.errors[1].reason, "이메일 형식이 올바르지 않습니다");
  });
});

// =============================================================================
// ZodError → ValidationError 변환
// =============================================================================

describe("errorHandler - ZodError → ValidationError 변환", () => {
  it("ZodError → 400, field/reason 매핑", async () => {
    const app = createApp();
    app.get("/test", () => {
      try {
        z.object({ name: z.string(), age: z.number() }).parse({
          name: 123,
          age: "스물다섯",
        });
      } catch (e) {
        throw e;
      }
      return new Response("ok");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 400);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "VALIDATION_ERROR");
    assertEquals(Array.isArray(body.errors), true);

    const nameError = body.errors.find((e: { field: string }) => e.field === "name");
    const ageError = body.errors.find((e: { field: string }) => e.field === "age");

    assertEquals(nameError !== undefined, true);
    assertEquals(typeof nameError.reason, "string");
    assertEquals(ageError !== undefined, true);
    assertEquals(typeof ageError.reason, "string");
  });
});

// =============================================================================
// 일반 Error (시스템 에러) → COMMON_5000
// =============================================================================

describe("errorHandler - 일반 Error (시스템 에러)", () => {
  it("일반 Error → 500, code:COMMON_5000, errors에 message 포함 (non-production)", async () => {
    const app = createApp();
    app.get("/test", () => {
      throw new Error("예상치 못한 오류 발생");
    });

    const res = await app.request("/test");
    const body = await res.json();

    assertEquals(res.status, 500);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "COMMON_5000");
    assertEquals(body.message, "Internal Server Error");
    // non-production 환경이므로 errors 배열에 message 포함
    assertEquals(Array.isArray(body.errors), true);
    assertEquals(body.errors.length, 1);
    assertEquals(body.errors[0].reason, "예상치 못한 오류 발생");
  });
});

// =============================================================================
// notFoundHandler
// =============================================================================

describe("notFoundHandler - 존재하지 않는 경로", () => {
  it("notFoundHandler → 404, code:COMMON_4004, path 포함", async () => {
    const app = createApp();

    const res = await app.request("/존재하지-않는-경로");
    const body = await res.json();

    assertEquals(res.status, 404);
    assertEquals(body.isSuccess, false);
    assertEquals(body.code, "COMMON_4004");
    assertEquals(body.message, "Not Found");
    assertEquals(Array.isArray(body.errors), true);
    assertEquals(body.errors.length, 1);
    assertEquals(typeof body.errors[0].reason, "string");
    assertEquals(body.errors[0].reason.includes("/존재하지-않는-경로"), true);
  });
});
