/**
 * Backend API - Main Entry Point
 *
 * Supabase Edge Function (Deno + Hono)
 */

import { createHonoApp, createOpenAPIApp } from "@app/middleware";
import { healthRoute, internalRoute } from "@domains/internal";
import { swaggerUI } from "@hono/swagger-ui";

// JWT 인증이 필요한 메인 앱 (OpenAPI 지원)
// Supabase URL 구조: /functions/v1/api/{path}
// Supabase가 /{함수명}/{경로} 형태로 전달하므로 basePath 필요
const app = createOpenAPIApp({ authStrategy: "jwt" }).basePath("/api");

// 공개 라우트 (JWT whitelist에 등록됨)
app.route("/health", healthRoute);

// 인증 필요 라우트
// app.route("/your-resource", yourResourceRoute);

// OpenAPI 문서 엔드포인트 (로컬 전용)
const OPENAPI_INFO = {
  openapi: "3.0.0" as const,
  info: {
    title: "Backend API",
    version: "1.0.0",
    description: "Supabase Edge Function Backend API",
  },
  servers: [
    { url: "http://127.0.0.1:54321/functions/v1", description: "Local" },
  ],
};

// GET /docs - Swagger UI
app.get("/docs", swaggerUI({ url: "/functions/v1/api/docs/openapi.json" }));

// GET /docs/openapi.json - OAS JSON (다운로드 가능)
app.get("/docs/openapi.json", (c) => {
  const doc = app.getOpenAPIDocument(OPENAPI_INFO);
  return c.json(doc, 200, {
    "Content-Disposition": "attachment; filename=openapi.json",
  });
});

// 내부 웹훅 인증 앱 (pg_cron 트리거용)
const internalApp = createHonoApp({ authStrategy: "webhook" }).basePath("/api");
internalApp.route("/internal", internalRoute);

// Deno Edge Function Handler
Deno.serve((req: Request) => {
  const url = new URL(req.url);

  // 내부 라우트는 webhook 인증 앱으로 라우팅
  if (url.pathname.startsWith("/api/internal")) {
    return internalApp.fetch(req);
  }

  // 그 외 라우트는 JWT 인증 앱으로 라우팅
  return app.fetch(req);
});
