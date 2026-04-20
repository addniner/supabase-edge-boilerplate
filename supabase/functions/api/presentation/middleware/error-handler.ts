/**
 * 에러 핸들러
 * DomainError → HTTP 상태코드 매핑 후 직렬화
 */

import type { Context } from "@hono";
import type { ErrorEnvelope, ErrorItem } from "../errors/types.ts";
import {
  BadRequestError,
  ConflictError,
  DomainError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ProviderAuthError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
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
  extras?: Partial<Pick<ErrorEnvelope, "provider" | "providerStatus">>,
): ErrorEnvelope {
  return {
    isSuccess: false,
    code,
    message,
    data: null,
    errors,
    ...extras,
  };
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
  // ProviderAuthError — 외부 provider 가 사용자 키를 거부. 백엔드 자체 오류가
  // 아니므로 502(Bad Gateway) 매핑. 단 InternalServerError 체크보다 위에 둔다.
  if (error instanceof ProviderAuthError) return 502;
  if (error instanceof InternalServerError) return 500;
  return 500;
}

/** DomainError에서 errors 배열 추출 */
function extractDomainErrors(error: DomainError): ErrorItem[] | null {
  return error.errors;
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

    // ProviderAuthError 는 response body 에 provider/providerStatus 를 추가로 실어
    // 클라이언트가 "어떤 provider 키를 확인해야 하는지" 정확히 안내할 수 있게 한다.
    const extras = domainErr instanceof ProviderAuthError
      ? { provider: domainErr.provider, providerStatus: domainErr.providerStatus }
      : undefined;

    return c.json(
      createErrorEnvelope(domainErr.code, domainErr.message, errors, extras),
      status,
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
