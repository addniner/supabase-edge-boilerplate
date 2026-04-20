/**
 * Health Check Route (OpenAPI)
 */

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const healthRoute = new OpenAPIHono();

// ============================================
// Schemas
// ============================================

const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: "healthy" }),
  timestamp: z.string().datetime().openapi({ example: "2024-01-15T10:00:00.000Z" }),
  version: z.string().openapi({ example: "1.0.0" }),
}).openapi("HealthResponse");

// ============================================
// Route Definition
// ============================================

const healthCheckRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "헬스 체크",
  description: "서버 상태를 확인합니다. 인증이 필요하지 않습니다.",
  responses: {
    200: {
      description: "서버 정상 동작",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

// ============================================
// Route Handler
// ============================================

// health check는 usecase 없이 직접 응답 — c.json() 허용
healthRoute.openapi(healthCheckRoute, (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }, 200);
});

export { healthRoute };
