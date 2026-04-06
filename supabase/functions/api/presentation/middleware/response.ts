import type { Context } from "@hono";
import type { SuccessEnvelope } from "../errors/types.ts";

/**
 * Success 응답 헬퍼
 * 라우트 핸들러에서 사용하는 성공 응답 유틸리티
 */
export class Response {
  private static successBody<T>(
    data: T,
    code: string,
    message: string,
  ): SuccessEnvelope<T> {
    return { isSuccess: true, code, message, data, errors: null };
  }

  static ok<T>(c: Context, data: T) {
    return c.json(
      this.successBody(data, "COMMON_2000", "OK"),
      200,
    );
  }

  static created<T>(c: Context, data: T) {
    return c.json(
      this.successBody(data, "COMMON_2001", "Created"),
      201,
    );
  }

  static noContent(c: Context) {
    return c.body(null, 204);
  }
}
