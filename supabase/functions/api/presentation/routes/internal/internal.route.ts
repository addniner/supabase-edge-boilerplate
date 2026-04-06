/**
 * Internal Routes (OpenAPI)
 *
 * pg_cron 등 내부 시스템에서 호출하는 엔드포인트
 * Webhook 인증은 index.ts의 internalApp에서 적용됨
 */

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const internalRoute = new OpenAPIHono();

// ============================================
// Schemas
// ============================================

const SchedulerTriggerResponseSchema = z.object({
  message: z.string().openapi({ example: "Scheduler trigger endpoint - not implemented" }),
  timestamp: z.string().datetime().openapi({ example: "2024-01-15T10:00:00.000Z" }),
}).openapi("SchedulerTriggerResponse");

// ============================================
// Route Definition
// ============================================

const schedulerTriggerRoute = createRoute({
  method: "post",
  path: "/scheduler/trigger",
  tags: ["Internal"],
  summary: "스케줄러 트리거",
  description: "pg_cron에서 호출하는 스케줄러 트리거 엔드포인트입니다. Webhook 인증이 필요합니다.",
  responses: {
    200: {
      description: "트리거 성공",
      content: {
        "application/json": {
          schema: SchedulerTriggerResponseSchema,
        },
      },
    },
  },
});

// ============================================
// Route Handler
// ============================================

internalRoute.openapi(schedulerTriggerRoute, (c) => {
  return c.json({
    message: "Scheduler trigger endpoint - not implemented",
    timestamp: new Date().toISOString(),
  }, 200);
});

export { internalRoute };
