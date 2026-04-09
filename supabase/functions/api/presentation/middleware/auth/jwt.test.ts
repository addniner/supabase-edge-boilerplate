import "@test";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { errorHandler } from "../error-handler.ts";
import { authJwtMiddleware, createAuthenticateHandler } from "./jwt.ts";
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

// =============================================================================
// createAuthenticateHandler — mock Supabase로 인증 성공 경로 테스트
// =============================================================================

Deno.test("JWT 인증 성공 - userId, userEmail이 context에 설정됨", async () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01",
  };

  const mockSupabaseClient = {
    auth: {
      getUser: (_token: string) => Promise.resolve({
        data: { user: mockUser },
        error: null,
      }),
    },
  };

  const authenticate = createAuthenticateHandler(
    (_token: string) => mockSupabaseClient as never,
  );

  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.use("/*", authenticate);
  app.get("/test", (c) => c.json({
    userId: c.get("userId"),
    userEmail: c.get("userEmail"),
  }));

  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.sig";
  const res = await app.request("/test", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.userId, "user-123");
  assertEquals(body.userEmail, "test@example.com");
});

Deno.test("JWT 인증 성공 - JWT custom claims가 user에 병합됨", async () => {
  const mockUser = {
    id: "user-456",
    email: "admin@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01",
  };

  const mockSupabaseClient = {
    auth: {
      getUser: (_token: string) => Promise.resolve({
        data: { user: mockUser },
        error: null,
      }),
    },
  };

  const authenticate = createAuthenticateHandler(
    (_token: string) => mockSupabaseClient as never,
  );

  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.use("/*", authenticate);
  app.get("/test", (c) => {
    const user = c.get("user");
    return c.json({ user_role: user?.user_role });
  });

  // JWT payload: { "sub": "user-456", "user_role": "admin" }
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQ1NiIsInVzZXJfcm9sZSI6ImFkbWluIn0.sig";
  const res = await app.request("/test", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.user_role, "admin");
});

Deno.test("JWT 인증 - getUser 에러 시 401 (mock)", async () => {
  const mockSupabaseClient = {
    auth: {
      getUser: (_token: string) => Promise.resolve({
        data: { user: null },
        error: { message: "Invalid token" },
      }),
    },
  };

  const authenticate = createAuthenticateHandler(
    (_token: string) => mockSupabaseClient as never,
  );

  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.use("/*", authenticate);
  app.get("/test", (c) => c.json({ ok: true }));

  const res = await app.request("/test", {
    headers: { Authorization: "Bearer invalid.jwt.token" },
  });

  assertEquals(res.status, 401);
});

Deno.test("JWT 인증 - getUser가 user null 반환 시 401", async () => {
  const mockSupabaseClient = {
    auth: {
      getUser: (_token: string) => Promise.resolve({
        data: { user: null },
        error: null,
      }),
    },
  };

  const authenticate = createAuthenticateHandler(
    (_token: string) => mockSupabaseClient as never,
  );

  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.use("/*", authenticate);
  app.get("/test", (c) => c.json({ ok: true }));

  const res = await app.request("/test", {
    headers: { Authorization: "Bearer valid.but.no-user" },
  });

  assertEquals(res.status, 401);
});
