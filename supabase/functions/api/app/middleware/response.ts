import type { Context } from "@hono";
import type { ApiEnvelope, ErrorItem } from "@shared/types";
/**
 * 응답 헬퍼 클래스
 * 모든 도메인에서 공통으로 사용할 수 있는 응답 생성 유틸리티
 */
export class Response {
  // ===== Public helpers (일관 인터페이스) =====

  static ok<T>(c: Context, data?: T) {
    return this.success(c, {
      data,
      code: "COMMON_2000",
      message: "OK",
    }, 200);
  }

  static created<T>(c: Context, data: T) {
    return this.success(c, {
      data,
      code: "COMMON_2001",
      message: "Created",
    }, 201);
  }

  static noContent(c: Context) {
    return this.success(c, { data: null }, 204);
  }

  static badRequest(c: Context, message: string, errors?: ErrorItem[] | null) {
    return this.error(c, {
      code: "COMMON_4000",
      message,
      errors: errors ?? null,
    }, 400);
  }

  static unauthorized(
    c: Context,
    message: string,
    errors?: ErrorItem[] | null,
  ) {
    return this.error(c, {
      code: "COMMON_4001",
      message,
      errors: errors ?? null,
    }, 401);
  }

  static forbidden(c: Context, message: string, errors?: ErrorItem[] | null) {
    return this.error(c, {
      code: "COMMON_4003",
      message,
      errors: errors ?? null,
    }, 403);
  }

  static notFound(
    c: Context,
    message = "Not Found",
    errors?: ErrorItem[] | null,
  ) {
    return this.error(c, {
      code: "COMMON_4004",
      message,
      errors: errors ?? null,
    }, 404);
  }

  static tooManyRequests(
    c: Context,
    message = "Too Many Requests",
    errors?: ErrorItem[] | null,
  ) {
    return this.error(c, {
      code: "COMMON_4029",
      message,
      errors: errors ?? null,
    }, 429);
  }

  static internalError(
    c: Context,
    message = "Internal Server Error",
    errors?: ErrorItem[] | null,
  ) {
    return this.error(c, {
      code: "COMMON_5000",
      message,
      errors: errors ?? null,
    }, 500);
  }

  // ===== Internal helpers (JSON 구조 고정) =====

  private static success<T>(
    c: Context,
    payload: { data: T | null; code?: string; message?: string },
    status: number,
  ) {
    if (status === 204) {
      return c.body(null, 204);
    }

    const data = payload.data ?? null;
    const code = payload.code ??
      (status === 201 ? "COMMON_2001" : "COMMON_2000");
    const message = payload.message ?? (status === 201 ? "Created" : "OK");

    const body: ApiEnvelope<typeof data> = {
      isSuccess: true,
      code,
      message,
      data,
      errors: null,
    };

    switch (status) {
      case 200:
        return c.json(body, 200);
      case 201:
        return c.json(body, 201);
      default:
        return c.json(body, 200);
    }
  }

  private static error(
    c: Context,
    payload: { code: string; message: string; errors?: ErrorItem[] | null },
    status: number = 500,
  ) {
    const body: ApiEnvelope = {
      isSuccess: false,
      code: payload.code,
      message: payload.message,
      data: null,
      errors: payload.errors ?? null,
    };

    switch (status) {
      case 400:
        return c.json(body, 400);
      case 401:
        return c.json(body, 401);
      case 403:
        return c.json(body, 403);
      case 404:
        return c.json(body, 404);
      case 429:
        return c.json(body, 429);
      default:
        return c.json(body, 500);
    }
  }
}
