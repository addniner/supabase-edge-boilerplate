import "@test/env";
import { assertEquals, assertNotEquals } from "@std/assert";
import { Hono } from "@hono";
import { requestIdMiddleware } from "./request-id.ts";

// requestIdMiddleware가 설정하는 Context 변수 타입
type RequestIdEnv = {
  Variables: {
    requestId: string;
    correlationId: string;
  };
};

Deno.test("requestIdMiddleware - 헤더 없이 요청 시 requestId 자동 생성", async () => {
  const app = new Hono<RequestIdEnv>();
  app.use(requestIdMiddleware);
  app.get("/test", (c) =>
    c.json({
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
    }));

  const res = await app.request("/test");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertNotEquals(body.requestId, undefined);
  assertNotEquals(body.requestId, "");
});

Deno.test("requestIdMiddleware - x-correlation-id 없으면 correlationId는 requestId와 동일", async () => {
  const app = new Hono<RequestIdEnv>();
  app.use(requestIdMiddleware);
  app.get("/test", (c) =>
    c.json({
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
    }));

  const res = await app.request("/test");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.correlationId, body.requestId);
});

Deno.test("requestIdMiddleware - x-correlation-id 헤더 있으면 해당 값을 correlationId로 사용", async () => {
  const app = new Hono<RequestIdEnv>();
  app.use(requestIdMiddleware);
  app.get("/test", (c) =>
    c.json({
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
    }));

  const correlationId = "my-corr-id";
  const res = await app.request("/test", {
    headers: { "x-correlation-id": correlationId },
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.correlationId, correlationId);
  assertNotEquals(body.correlationId, body.requestId);
});

Deno.test("requestIdMiddleware - x-request-id 헤더로 전달 시 해당 값을 requestId로 사용", async () => {
  const app = new Hono<RequestIdEnv>();
  app.use(requestIdMiddleware);
  app.get("/test", (c) =>
    c.json({
      requestId: c.get("requestId"),
      correlationId: c.get("correlationId"),
    }));

  const customRequestId = "custom-r";
  const res = await app.request("/test", {
    headers: { "x-request-id": customRequestId },
  });
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.requestId, customRequestId);
  assertEquals(body.correlationId, customRequestId);
});
