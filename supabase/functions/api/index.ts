/**
 * Backend API - Main Entry Point
 *
 * Supabase Edge Function (Deno + Hono)
 */

import { createApp } from "@middleware";
import { createDocsRoute, healthRoute, internalRoute } from "@routes";

// JWT 인증이 필요한 메인 앱 (OpenAPI 지원)
// Supabase URL 구조: /functions/v1/api/{path}
// Supabase가 /{함수명}/{경로} 형태로 전달하므로 basePath 필요
const app = createApp({ authStrategy: "jwt" }).basePath("/api");

// 공개 라우트 (JWT whitelist에 등록됨)
app.route("/health", healthRoute);

// 인증 필요 라우트
// app.route("/example", exampleRoute);

// OpenAPI docs (모든 라우트 등록 후 마지막에 설정)
app.route("/docs", createDocsRoute(app));

// 내부 웹훅 인증 앱 (pg_cron 트리거용)
const internalApp = createApp({ authStrategy: "webhook" }).basePath("/api");
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
