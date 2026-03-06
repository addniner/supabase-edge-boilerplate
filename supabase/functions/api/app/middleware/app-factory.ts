// Hono 앱 팩토리 - 공통 미들웨어가 적용된 앱 생성

import { type Context, Hono } from "@hono";
export type { Context };

/** 라우트 파일용 Hono 인스턴스 (미들웨어 없음) */
export { Hono as Router };

import {
  authJwtMiddleware,
  authWebhookMiddleware,
  rbacMiddleware,
} from "./auth/index.ts";
import { corsMiddleware } from "./cors.ts";
import { errorHandler, notFoundHandler } from "./handlers.ts";
import { languageMiddleware } from "./language.ts";
import { requestIdMiddleware } from "./request-id.ts";

import type { AuthStrategy } from "@shared/types";

/**
 * 공통 미들웨어가 적용된 Hono 앱 생성
 * - CORS 미들웨어
 * - Request ID 미들웨어 + 요청 로깅
 * - Language Detector 미들웨어 (언어 자동 감지)
 * - 인증 미들웨어 (공개 경로 제외, 서비스 롤 키 바이패스 내장)
 * - RBAC 미들웨어 (JWT 인증 후 역할/권한 추가)
 * - 에러 핸들러
 * - 404 핸들러
 */
export function createHonoApp(options?: { authStrategy?: AuthStrategy }) {
  const app = new Hono();
  const authStrategy: AuthStrategy = options?.authStrategy ?? "jwt";

  // 필수 미들웨어 적용
  app.use(corsMiddleware);
  app.use(requestIdMiddleware);
  app.use(languageMiddleware);

  // 미들웨어 분기 처리
  switch (authStrategy) {
    case "jwt":
      app.use(authJwtMiddleware); // JWT 인증 미들웨어
      app.use(rbacMiddleware); // RBAC 미들웨어 (JWT 이후 실행)
      break;
    case "webhook":
      app.use(authWebhookMiddleware); // 웹훅 인증 미들웨어
      break;
    default:
      throw new Error(`Invalid auth strategy: ${authStrategy}`);
  }

  // 에러 핸들러 등록
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  return app;
}
