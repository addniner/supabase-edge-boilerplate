// 공통 미들웨어 핸들러들

import type { Context } from "@hono";
import { Response } from "./response.ts";
import { CustomError, ValidationError } from "@app/errors";
import { Logger } from "@app/utils";
import { isProduction } from "@app/config";
import { ZodError } from "@zod";

// 공통 에러 핸들러
export const errorHandler = (err: Error, c: Context) => {
  const userId = c.get("userId");

  const context = {
    userId,
    url: c.req.url,
    method: c.req.method,
    path: c.req.path,
  };

  // ZodError를 ValidationError로 변환
  if (err instanceof ZodError) {
    Logger.warn("Validation error", {
      ...context,
      zodErrors: err.errors,
    }, err);

    // Zod 에러를 ErrorItem 형식으로 변환
    const errors = err.errors.map((zodErr) => ({
      field: zodErr.path.join("."),
      reason: zodErr.message,
    }));

    // ValidationError로 변환
    err = new ValidationError("Validation failed", errors);
  }

  // CustomError 처리 - 비즈니스/도메인 에러 (ValidationError 포함)
  if (err instanceof CustomError) {
    const customErr = err as CustomError;
    Logger.warn("Business logic error", {
      ...context,
      code: customErr.code,
      statusCode: customErr.status,
      errors: customErr.errors,
      meta: customErr.meta,
    }, customErr);

    // Response 헬퍼가 status에 맞는 응답 반환
    const errors = customErr.errors ?? null;

    switch (customErr.status) {
      case 400:
        return Response.badRequest(c, customErr.message, errors);
      case 401:
        return Response.unauthorized(c, customErr.message, errors);
      case 403:
        return Response.forbidden(c, customErr.message, errors);
      case 404:
        return Response.notFound(c, customErr.message, errors);
      case 429:
        return Response.tooManyRequests(c, customErr.message, errors);
      default:
        return Response.internalError(c, customErr.message, errors);
    }
  }

  // 시스템 에러 - 예상치 못한 에러
  Logger.error("Unhandled system error", context, err);

  // 프로덕션에서는 스택 트레이스 숨기기

  const errors = isProduction() ? null : [{ reason: err.message }];
  return Response.internalError(c, "Internal Server Error", errors);
};

// 404 핸들러
export const notFoundHandler = (c: Context) => {
  Logger.warn("Route not found", {
    method: c.req.method,
    path: c.req.path,
  });

  return Response.notFound(
    c,
    "Not Found",
    [{ reason: `Path ${c.req.path} not found` }],
  );
};
