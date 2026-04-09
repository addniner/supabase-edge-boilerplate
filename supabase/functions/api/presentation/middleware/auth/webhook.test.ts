import "@test";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { resetConfigCache } from "@config";
import { errorHandler } from "../error-handler.ts";
import { authWebhookMiddleware } from "./webhook.ts";

// getConfig() 캐시를 초기화하여 테스트 환경변수가 반영되도록 함
resetConfigCache();

// webhook 미들웨어가 설정하는 Context 변수 타입
type WebhookEnv = {
  Variables: {
    requestId: string;
    webhook: boolean;
  };
};

// =============================================================================
// 테스트용 앱 설정
// =============================================================================

function createApp(): Hono<WebhookEnv> {
  const app = new Hono<WebhookEnv>();
  app.onError(errorHandler);
  app.use("/*", authWebhookMiddleware);
  app.post("/webhook", (c) => c.json({ ok: true }));
  return app;
}

const VALID_TOKEN = "test-db-webhook-secret";

// =============================================================================
// 인증 성공 케이스
// =============================================================================

Deno.test("authWebhookMiddleware - 올바른 토큰으로 요청 시 200 통과", async () => {
  const app = createApp();

  const res = await app.request("/webhook", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VALID_TOKEN}`,
    },
  });

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
});

// =============================================================================
// 인증 실패 케이스
// =============================================================================

Deno.test("authWebhookMiddleware - Authorization 헤더 없으면 401", async () => {
  const app = createApp();

  const res = await app.request("/webhook", {
    method: "POST",
  });

  assertEquals(res.status, 401);
});

Deno.test("authWebhookMiddleware - Bearer 형식이 아니면 401", async () => {
  const app = createApp();

  const res = await app.request("/webhook", {
    method: "POST",
    headers: {
      Authorization: `Token ${VALID_TOKEN}`,
    },
  });

  assertEquals(res.status, 401);
});

Deno.test("authWebhookMiddleware - 잘못된 토큰이면 401", async () => {
  const app = createApp();

  const res = await app.request("/webhook", {
    method: "POST",
    headers: {
      Authorization: "Bearer wrong-token",
    },
  });

  assertEquals(res.status, 401);
});

// =============================================================================
// Context 설정 검증
// =============================================================================

Deno.test("authWebhookMiddleware - 올바른 토큰 시 webhook context 변수가 true로 설정됨", async () => {
  const contextApp = new Hono<WebhookEnv>();
  contextApp.onError(errorHandler);
  contextApp.use("/*", authWebhookMiddleware);
  contextApp.post("/webhook", (c) => {
    const webhook = c.get("webhook");
    return c.json({ webhook });
  });

  const res = await contextApp.request("/webhook", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VALID_TOKEN}`,
    },
  });

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.webhook, true);
});
