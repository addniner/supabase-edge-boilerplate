import "@test/env";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { errorHandler } from "../error-handler.ts";
import { authJwtMiddleware } from "./jwt.ts";
import type { AppEnv } from "../app-factory.ts";

// =============================================================================
// 헬퍼: 테스트용 앱 생성
// =============================================================================

function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.use("/*", authJwtMiddleware);
  app.get("/api/health", (c) => c.json({ status: "ok" }));
  app.get("/api/protected", (c) => c.json({ userId: c.get("userId") }));
  return app;
}

// =============================================================================
// Authorization 헤더 누락 → 401
// =============================================================================

Deno.test("JWT 미들웨어 - Authorization 헤더 없으면 401 반환", async () => {
  const app = createApp();

  const res = await app.request("/api/protected");
  const body = await res.json();

  assertEquals(res.status, 401);
  assertEquals(body.isSuccess, false);
});

// =============================================================================
// Authorization 헤더 형식 오류 → 401
// =============================================================================

Deno.test("JWT 미들웨어 - 'Bearer ' 접두사 없으면 401 반환", async () => {
  const app = createApp();

  const res = await app.request("/api/protected", {
    headers: { Authorization: "invalid-token-format" },
  });
  const body = await res.json();

  assertEquals(res.status, 401);
  assertEquals(body.isSuccess, false);
});

Deno.test("JWT 미들웨어 - 'Token ' 접두사(잘못된 형식)이면 401 반환", async () => {
  const app = createApp();

  const res = await app.request("/api/protected", {
    headers: { Authorization: "Token some.jwt.token" },
  });
  const body = await res.json();

  assertEquals(res.status, 401);
  assertEquals(body.isSuccess, false);
});

// =============================================================================
// 화이트리스트 경로 → 인증 없이 통과
// =============================================================================

Deno.test("JWT 미들웨어 - /api/health 화이트리스트 경로는 인증 없이 200 통과", async () => {
  const app = createApp();

  const res = await app.request("/api/health");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.status, "ok");
});

// =============================================================================
// Supabase getUser 실패 → 401
// =============================================================================

Deno.test({
  name: "JWT 미들웨어 - getUser 실패(유효하지 않은 토큰) 시 401 반환",
  // Supabase 클라이언트의 auto-refresh 인터벌로 인한 리소스 누수 허용
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    // 3-part JWT 형식을 갖추되 실제로는 유효하지 않은 토큰
    // createAuthSupabaseClient가 호출되고 getUser가 에러를 반환하는 경로
    const fakeJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.INVALIDSIGNATURE";
    const app = createApp();

    const res = await app.request("/api/protected", {
      headers: { Authorization: `Bearer ${fakeJwt}` },
    });
    const body = await res.json();

    assertEquals(res.status, 401);
    assertEquals(body.isSuccess, false);
  },
});
