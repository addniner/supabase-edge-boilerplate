import "@test";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { Response } from "./response.ts";

// =============================================================================
// Response.ok
// =============================================================================

Deno.test("Response.ok - status 200, isSuccess:true, code:COMMON_2000, message:OK, data 포함, errors:null", async () => {
  const app = new Hono();
  app.get("/ok", (c) => Response.ok(c, { id: "1", name: "test" }));

  const res = await app.request("/ok");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.isSuccess, true);
  assertEquals(body.code, "COMMON_2000");
  assertEquals(body.message, "OK");
  assertEquals(body.data, { id: "1", name: "test" });
  assertEquals(body.errors, null);
});

Deno.test("Response.ok - data가 배열인 경우", async () => {
  const app = new Hono();
  app.get("/ok-array", (c) =>
    Response.ok(c, [
      { id: "1", name: "first" },
      { id: "2", name: "second" },
    ])
  );

  const res = await app.request("/ok-array");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.isSuccess, true);
  assertEquals(body.code, "COMMON_2000");
  assertEquals(body.data, [
    { id: "1", name: "first" },
    { id: "2", name: "second" },
  ]);
  assertEquals(body.errors, null);
});

Deno.test("Response.ok - data가 빈 객체인 경우", async () => {
  const app = new Hono();
  app.get("/ok-empty", (c) => Response.ok(c, {}));

  const res = await app.request("/ok-empty");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.isSuccess, true);
  assertEquals(body.code, "COMMON_2000");
  assertEquals(body.data, {});
  assertEquals(body.errors, null);
});

// =============================================================================
// Response.created
// =============================================================================

Deno.test("Response.created - status 201, code:COMMON_2001, message:Created", async () => {
  const app = new Hono();
  app.post("/created", (c) => Response.created(c, { id: "new-1" }));

  const res = await app.request("/created", { method: "POST" });
  const body = await res.json();

  assertEquals(res.status, 201);
  assertEquals(body.isSuccess, true);
  assertEquals(body.code, "COMMON_2001");
  assertEquals(body.message, "Created");
  assertEquals(body.data, { id: "new-1" });
  assertEquals(body.errors, null);
});

// =============================================================================
// Response.noContent
// =============================================================================

Deno.test("Response.noContent - status 204, body 없음", async () => {
  const app = new Hono();
  app.delete("/no-content", (c) => Response.noContent(c));

  const res = await app.request("/no-content", { method: "DELETE" });
  const text = await res.text();

  assertEquals(res.status, 204);
  assertEquals(text, "");
});
