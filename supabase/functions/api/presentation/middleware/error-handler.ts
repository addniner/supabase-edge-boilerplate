/**
 * 에러 핸들러
 * CustomError → HTTP 에러 응답 직렬화
 * DomainError → HTTP 상태코드 매핑 후 직렬화
 */

import type { Context } from "@hono";
import type { ErrorEnvelope, ErrorItem } from "../errors/types.ts";
import { CustomError, ValidationError } from "@errors";
import {
  BadRequestError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@domain/exceptions";
import { Logger } from "@logger";
import { isProduction } from "@config";
import { ZodError } from "@zod";
import type { ContentfulStatusCode } from "@hono/http-status";

/** ErrorEnvelope 생성 */
function createErrorEnvelope(
  code: string,
  message: string,
  errors: ErrorItem[] | null,
): ErrorEnvelope {
  return { isSuccess: false, code, message, data: null, errors };
}

/** DomainError → HTTP 상태코드 매핑 */
function domainErrorToStatus(error: DomainError): ContentfulStatusCode {
  if (error instanceof NotFoundError) return 404;
  if (error instanceof BadRequestError) return 400;
  if (error instanceof ValidationError) return 400;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof ConflictError) return 409;
  if (error instanceof TooManyRequestsError) return 429;
  if (error instanceof InternalServerError) return 500;
  return 500;
}

/** DomainError에서 errors 배열 추출 */
function extractDomainErrors(error: DomainError): ErrorItem[] | null {
  if (
    error instanceof BadRequestError ||
    error instanceof ValidationError ||
    error instanceof InternalServerError ||
    error instanceof TooManyRequestsError
  ) {
    return error.errors;
  }
  return null;
}

/** 공통 에러 핸들러 */
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

    const errors = err.errors.map((zodErr) => ({
      field: zodErr.path.join("."),
      reason: zodErr.message,
    }));

    err = new ValidationError("Validation failed", errors);
  }

  // DomainError 처리 - application 레이어에서 던진 비즈니스 예외
  if (err instanceof DomainError) {
    const domainErr = err as DomainError;
    const status = domainErrorToStatus(domainErr);
    const errors = extractDomainErrors(domainErr);

    Logger.warn("Domain error", {
      ...context,
      code: domainErr.code,
      statusCode: status,
      errors,
    }, domainErr);

    return c.json(
      createErrorEnvelope(domainErr.code, domainErr.message, errors),
      status,
    );
  }

  // CustomError 처리 - presentation 레이어 전용 에러 (하위 호환)
  if (err instanceof CustomError) {
    const customErr = err as CustomError;
    Logger.warn("Business logic error", {
      ...context,
      code: customErr.code,
      statusCode: customErr.status,
      errors: customErr.errors,
      meta: customErr.meta,
    }, customErr);

    const errors = customErr.errors ?? null;
    return c.json(
      createErrorEnvelope(customErr.code, customErr.message, errors),
      customErr.status,
    );
  }

  // 시스템 에러 - 예상치 못한 에러
  Logger.error("Unhandled system error", context, err);

  const errors = isProduction() ? null : [{ reason: err.message }];
  return c.json(
    createErrorEnvelope("COMMON_5000", "Internal Server Error", errors),
    500,
  );
};

/** 404 핸들러 */
export const notFoundHandler = (c: Context) => {
  Logger.warn("Route not found", {
    method: c.req.method,
    path: c.req.path,
  });

  return c.json(
    createErrorEnvelope("COMMON_4004", "Not Found", [{ reason: `Path ${c.req.path} not found` }]),
    404,
  );
};
