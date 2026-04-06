/**
 * 앱 팩토리 - 공통 미들웨어가 적용된 Hono 앱 생성
 */

import type { Context } from "@hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@supabase-js";

import {
  authJwtMiddleware,
  authWebhookMiddleware,
  rbacMiddleware,
} from "./auth/index.ts";
import { corsMiddleware } from "./cors.ts";
import { errorHandler, notFoundHandler } from "./error-handler.ts";
import { languageMiddleware } from "./language.ts";
import { requestIdMiddleware } from "./request-id.ts";

import type { AuthStrategy } from "./auth/auth.types.ts";

// 라우트 파일에서 사용하는 타입 re-export
export type { Context };

/**
 * 앱 Context 변수 타입
 * 인증 미들웨어에서 설정하는 변수들
 */
export type AppEnv = {
  Variables: {
    user: User & Record<string, unknown>;
    userId: string;
    userEmail: string | undefined;
    userRole: string;
    permissions: string[];
  };
};

/**
 * 공통 미들웨어가 적용된 앱 생성
 * OpenAPIHono 기반 (Swagger UI, OpenAPI 스펙 생성 지원)
 */
export function createApp(options?: { authStrategy?: AuthStrategy }) {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw result.error;
      }
    },
  });
  const authStrategy: AuthStrategy = options?.authStrategy ?? "jwt";

  // 필수 미들웨어 적용
  app.use(corsMiddleware);
  app.use(requestIdMiddleware);
  app.use(languageMiddleware);

  // 미들웨어 분기 처리
  switch (authStrategy) {
    case "jwt":
      app.use(authJwtMiddleware);
      app.use(rbacMiddleware);
      break;
    case "webhook":
      app.use(authWebhookMiddleware);
      break;
    default:
      throw new Error(`Invalid auth strategy: ${authStrategy}`);
  }

  // 에러 핸들러 등록
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  return app;
}
