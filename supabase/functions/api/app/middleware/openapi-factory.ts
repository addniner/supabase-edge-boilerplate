/**
 * OpenAPI Hono 앱 팩토리
 * @hono/zod-openapi를 사용한 앱 생성
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@supabase-js";

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
 * OpenAPI 앱에서 사용되는 Context 변수 타입
 * JWT 미들웨어에서 설정하는 변수들
 */
export type AppEnv = {
  Variables: {
    user: User & Record<string, unknown>;
    userId: string;
    userEmail: string | undefined;
    userRole: string;
    userPermissions: string[];
  };
};

/**
 * OpenAPI 미들웨어가 적용된 Hono 앱 생성
 */
export function createOpenAPIApp(options?: { authStrategy?: AuthStrategy }) {
  const app = new OpenAPIHono<AppEnv>();
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

// Re-export for convenience
export { OpenAPIHono } from "@hono/zod-openapi";
export { createRoute, z } from "@hono/zod-openapi";
