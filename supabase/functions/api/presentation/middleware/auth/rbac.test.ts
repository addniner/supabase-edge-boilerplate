import "@test/env";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { Permission } from "@domain";
import { errorHandler } from "../error-handler.ts";
import { requirePermission, requireAnyPermission, requireAllPermissions } from "./rbac.ts";
import type { AppEnv } from "../app-factory.ts";

// =============================================================================
// 헬퍼: 테스트용 앱 생성
// =============================================================================

function createApp(
  permissions: Permission[] | undefined,
  setup: (app: Hono<AppEnv>) => void,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.onError(errorHandler);

  app.use("/test/*", async (c, next) => {
    if (permissions !== undefined) {
      c.set("permissions", permissions);
    }
    // undefined인 경우 permissions를 설정하지 않음 (Context에 없는 상태)
    c.set("userRole", "member");
    c.set("userId", "user-1");
    await next();
  });

  setup(app);
  return app as Hono<AppEnv>;
}

// =============================================================================
// requirePermission
// =============================================================================

Deno.test("requirePermission - 정확한 권한 있으면 200 통과", async () => {
  const app = createApp([Permission.RESOURCES_READ], (app) => {
    app.get("/test/protected", requirePermission(Permission.RESOURCES_READ), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/protected");
  assertEquals(res.status, 200);
});

Deno.test("requirePermission - 권한 없으면 403", async () => {
  const app = createApp([Permission.RESOURCES_CREATE], (app) => {
    app.get("/test/protected", requirePermission(Permission.RESOURCES_DELETE), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/protected");
  assertEquals(res.status, 403);
});

Deno.test("requirePermission - permissions 빈 배열이면 403", async () => {
  const app = createApp([], (app) => {
    app.get("/test/protected", requirePermission(Permission.RESOURCES_READ), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/protected");
  assertEquals(res.status, 403);
});

Deno.test("requirePermission - permissions undefined이면 403", async () => {
  const app = createApp(undefined, (app) => {
    app.get("/test/protected", requirePermission(Permission.RESOURCES_READ), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/protected");
  assertEquals(res.status, 403);
});

Deno.test("requirePermission - Permission.ALL('*')이면 모든 권한 통과", async () => {
  const app = createApp([Permission.ALL], (app) => {
    app.get("/test/any", requirePermission(Permission.RESOURCES_DELETE), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/any");
  assertEquals(res.status, 200);
});

Deno.test("requirePermission - 와일드카드 매칭: resources:* → resources:read 통과", async () => {
  const app = createApp([Permission.RESOURCES_ALL], (app) => {
    app.get("/test/read", requirePermission(Permission.RESOURCES_READ), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/read");
  assertEquals(res.status, 200);
});

Deno.test("requirePermission - 와일드카드 매칭: resources:* → resources:delete 통과", async () => {
  const app = createApp([Permission.RESOURCES_ALL], (app) => {
    app.get("/test/delete", requirePermission(Permission.RESOURCES_DELETE), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/delete");
  assertEquals(res.status, 200);
});

Deno.test("requirePermission - 다른 리소스 와일드카드 불일치: resources:create ≠ resources:read → 403", async () => {
  const app = createApp([Permission.RESOURCES_CREATE], (app) => {
    app.get("/test/resources", requirePermission(Permission.RESOURCES_READ), (c) =>
      c.json({ ok: true })
    );
  });

  const res = await app.request("/test/resources");
  assertEquals(res.status, 403);
});

// =============================================================================
// requireAnyPermission
// =============================================================================

Deno.test("requireAnyPermission - 하나만 있어도 통과 (OR)", async () => {
  const app = createApp([Permission.RESOURCES_READ], (app) => {
    app.get(
      "/test/any",
      requireAnyPermission([Permission.RESOURCES_READ, Permission.RESOURCES_DELETE]),
      (c) => c.json({ ok: true }),
    );
  });

  const res = await app.request("/test/any");
  assertEquals(res.status, 200);
});

Deno.test("requireAnyPermission - 아무것도 없으면 403", async () => {
  const app = createApp([Permission.RESOURCES_CREATE], (app) => {
    app.get(
      "/test/any",
      requireAnyPermission([Permission.RESOURCES_READ, Permission.RESOURCES_DELETE]),
      (c) => c.json({ ok: true }),
    );
  });

  const res = await app.request("/test/any");
  assertEquals(res.status, 403);
});

Deno.test("requireAnyPermission - 여러 개 중 하나 매칭되면 통과", async () => {
  const app = createApp([Permission.RESOURCES_UPDATE], (app) => {
    app.get(
      "/test/any",
      requireAnyPermission([
        Permission.RESOURCES_READ,
        Permission.RESOURCES_UPDATE,
        Permission.RESOURCES_DELETE,
      ]),
      (c) => c.json({ ok: true }),
    );
  });

  const res = await app.request("/test/any");
  assertEquals(res.status, 200);
});

// =============================================================================
// requireAllPermissions
// =============================================================================

Deno.test("requireAllPermissions - 전부 있으면 통과 (AND)", async () => {
  const app = createApp(
    [Permission.RESOURCES_READ, Permission.RESOURCES_UPDATE],
    (app) => {
      app.get(
        "/test/all",
        requireAllPermissions([Permission.RESOURCES_READ, Permission.RESOURCES_UPDATE]),
        (c) => c.json({ ok: true }),
      );
    },
  );

  const res = await app.request("/test/all");
  assertEquals(res.status, 200);
});

Deno.test("requireAllPermissions - 하나라도 없으면 403", async () => {
  const app = createApp([Permission.RESOURCES_READ], (app) => {
    app.get(
      "/test/all",
      requireAllPermissions([Permission.RESOURCES_READ, Permission.RESOURCES_DELETE]),
      (c) => c.json({ ok: true }),
    );
  });

  const res = await app.request("/test/all");
  assertEquals(res.status, 403);
});

Deno.test("requireAllPermissions - 일부만 있으면 403", async () => {
  const app = createApp(
    [Permission.RESOURCES_READ, Permission.RESOURCES_CREATE],
    (app) => {
      app.get(
        "/test/all",
        requireAllPermissions([
          Permission.RESOURCES_READ,
          Permission.RESOURCES_UPDATE,
          Permission.RESOURCES_DELETE,
        ]),
        (c) => c.json({ ok: true }),
      );
    },
  );

  const res = await app.request("/test/all");
  assertEquals(res.status, 403);
});
