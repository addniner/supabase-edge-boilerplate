import "@test/env";

import { assertEquals } from "@std/assert";
import { Hono } from "@hono";
import { Permission } from "@domain";
import { errorHandler } from "../error-handler.ts";
import { Role } from "@domain";
import { requirePermission, requireAnyPermission, requireAllPermissions, createEnrichWithRbacHandler } from "./rbac.ts";
import type { UserRoleRepository } from "@domain/repositories";
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

Deno.test("requirePermission - 다른 리소스 와일드카드 불일치: others:* ≠ resources:read → 403", async () => {
  const app = createApp(["others:*" as Permission], (app) => {
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
  const app = createApp(["others:read" as Permission], (app) => {
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

// =============================================================================
// enrichWithRbac — mock repository로 RBAC 핸들러 테스트
// =============================================================================

function makeMockUserRoleRepo(overrides: Partial<UserRoleRepository> = {}): UserRoleRepository {
  return {
    getUserRole: () => Promise.reject(new Error("getUserRole not mocked")),
    assignRole: () => Promise.reject(new Error("assignRole not mocked")),
    getRolePermissions: () => Promise.reject(new Error("getRolePermissions not mocked")),
    ...overrides,
  };
}

function createRbacApp(
  mockRepo: UserRoleRepository,
  userSetup: { userId?: string; user?: Record<string, unknown> },
  routeSetup: (app: Hono<AppEnv>) => void,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  // 1. user context 설정 (JWT 미들웨어 역할)
  if (userSetup.userId) {
    app.use("/test/*", async (c, next) => {
      c.set("userId", userSetup.userId!);
      c.set("user", (userSetup.user ?? {}) as never);
      await next();
    });
  }
  // 2. RBAC 핸들러
  app.use("/test/*", createEnrichWithRbacHandler(() => mockRepo));
  // 3. route 등록
  routeSetup(app);
  return app;
}

Deno.test("enrichWithRbac - JWT에 user_role 있으면 빠른 경로: DB에서 permissions만 조회", async () => {
  const mockRepo = makeMockUserRoleRepo({
    getRolePermissions: (role: string) => {
      assertEquals(role, Role.ADMIN);
      return Promise.resolve([Permission.ALL]);
    },
  });

  const app = createRbacApp(
    mockRepo,
    { userId: "user-1", user: { user_role: Role.ADMIN } },
    (app) => {
      app.get("/test/check", (c) => c.json({
        userRole: c.get("userRole"),
        permissions: c.get("permissions"),
      }));
    },
  );

  const res = await app.request("/test/check");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.userRole, Role.ADMIN);
  assertEquals(body.permissions, [Permission.ALL]);
});

Deno.test("enrichWithRbac - JWT에 user_role 없으면 느린 경로: DB에서 role + permissions 조회", async () => {
  const mockRepo = makeMockUserRoleRepo({
    getUserRole: (userId: string) => {
      assertEquals(userId, "user-2");
      return Promise.resolve(Role.MEMBER);
    },
    getRolePermissions: () => Promise.resolve([Permission.RESOURCES_READ]),
  });

  const app = createRbacApp(
    mockRepo,
    { userId: "user-2" },
    (app) => {
      app.get("/test/check", (c) => c.json({
        userRole: c.get("userRole"),
        permissions: c.get("permissions"),
      }));
    },
  );

  const res = await app.request("/test/check");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.userRole, Role.MEMBER);
  assertEquals(body.permissions, [Permission.RESOURCES_READ]);
});

Deno.test("enrichWithRbac - DB에 역할 없으면 auto-assign member", async () => {
  let assignedRole: string | null = null;

  const mockRepo = makeMockUserRoleRepo({
    getUserRole: () => Promise.resolve(null),
    assignRole: (_userId: string, role: string) => {
      assignedRole = role;
      return Promise.resolve();
    },
    getRolePermissions: () => Promise.resolve([Permission.RESOURCES_READ]),
  });

  const app = createRbacApp(
    mockRepo,
    { userId: "new-user" },
    (app) => {
      app.get("/test/check", (c) => c.json({
        userRole: c.get("userRole"),
      }));
    },
  );

  const res = await app.request("/test/check");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.userRole, Role.MEMBER);
  assertEquals(assignedRole, Role.MEMBER);
});

Deno.test("enrichWithRbac - userId 없으면 (화이트리스트 경로): permissions 빈 배열", async () => {
  const mockRepo = makeMockUserRoleRepo();

  const app = createRbacApp(
    mockRepo,
    {},
    (app) => {
      app.get("/test/public", (c) => c.json({
        userRole: c.get("userRole"),
        permissions: c.get("permissions"),
      }));
    },
  );

  const res = await app.request("/test/public");
  const body = await res.json();

  assertEquals(res.status, 200);
  assertEquals(body.userRole, undefined);
  assertEquals(body.permissions, []);
});
