/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * JWT 미들웨어 다음에 실행되어야 합니다.
 * JWT에서 role을 추출하고, DB에서 권한만 조회하여 Context에 저장합니다.
 *
 * 실행 순서: JWT Middleware → RBAC Middleware
 *
 * 변경 사항 (2025-01-18):
 * - Phase 1: JWT claims + 메모리(ROLE_PERMISSIONS)에서 권한 조회
 * - Phase 2: 매 요청마다 DB(user_roles, role_permissions)에서 권한 조회 (2개 쿼리 ~92ms)
 * - Phase 3 (현재): JWT에서 role 추출 + DB에서 permissions만 조회 (1개 쿼리 ~42ms)
 * - 성능 향상: 50% 개선 (Auth Hook의 user_role claim 활용)
 * - 장점: 즉시 반영, 동기화 불필요, Single Source of Truth
 */

import type { Context, Next } from "@hono";
import { except } from "@hono/combine";

import { WHITE_LISTED_ROUTES } from "@config";
import { ForbiddenError } from "@domain/exceptions";
import { Permission, Role } from "@domain";
import { Logger } from "@logger";
import type { UserRoleRepository } from "@domain/repositories";
import { UserRoleRepositoryImpl } from "@repositories";

/**
 * JWT에서 role을 추출하고 DB에서 권한만 조회하여 Context에 저장
 *
 * 실행 과정:
 * 1. JWT에서 userId, user 추출
 * 2. JWT에서 user_role 추출 (Auth Hook이 자동으로 추가)
 * 3. DB에서 해당 역할의 permissions만 조회 (1개 쿼리)
 * 4. Context에 role, permissions 저장
 *
 * Fallback 처리:
 * - JWT에 user_role이 없으면 DB에서 역할 조회 (2개 쿼리)
 * - 역할이 아예 없으면 자동으로 member 역할 할당 (auto-assign)
 *
 * 성능:
 * - 빠른 경로 (JWT role 사용): 1개 쿼리 ~42ms
 * - 느린 경로 (DB role 조회): 2개 쿼리 ~92ms
 */
/**
 * 테스트 가능한 RBAC 핸들러 생성
 * @param repoFactory - UserRoleRepository 생성 함수 (테스트 시 mock 주입)
 */
export function createEnrichWithRbacHandler(
  repoFactory: () => UserRoleRepository = () => new UserRoleRepositoryImpl(),
) {
  return (c: Context, next: Next) => {
    return enrichWithRbac(c, next, repoFactory());
  };
}

async function enrichWithRbac(c: Context, next: Next, userRoleRepo: UserRoleRepository) {
  const userId = c.get("userId") as string | undefined;
  const user = c.get("user"); // JWT payload

  // 화이트리스트 경로 (userId 없음)
  if (!userId) {
    Logger.debug("enrichWithRbac - no userId (whitelisted route)");
    c.set("userRole", undefined);
    c.set("permissions", []);
    return await next();
  }
  let role: Role | null = null;
  let permissions: Permission[] = [];

  // 1. JWT에서 role 추출 시도 (Auth Hook이 user_role 추가)
  const roleFromJWT = user?.user_role as Role | undefined;

  if (roleFromJWT) {
    // 빠른 경로: JWT role 사용
    Logger.debug(`enrichWithRbac - using JWT role: ${roleFromJWT}`);
    role = roleFromJWT;
    permissions = await userRoleRepo.getRolePermissions(role);

    Logger.debug(
      `User ${userId} role: ${role} (from JWT), permissions: ${permissions.length}`,
    );
  } else {
    // 느린 경로: DB에서 role 조회
    Logger.debug(
      `enrichWithRbac - JWT role not found, querying DB for user ${userId}`,
    );
    const dbRole = await userRoleRepo.getUserRole(userId);

    // 역할이 없는 경우 - 자동으로 기본 역할 할당
    if (!dbRole) {
      Logger.info(`User ${userId} has no role, auto-assigning default role`);

      const defaultRole = Role.MEMBER;
      await userRoleRepo.assignRole(userId, defaultRole);

      // 새로 할당된 역할의 권한 조회
      role = defaultRole;
      permissions = await userRoleRepo.getRolePermissions(defaultRole);

      Logger.info(
        `User ${userId} auto-assigned role: ${defaultRole}, permissions: ${permissions.length}`,
      );
    } else {
      // 역할이 있는 경우 - 권한 조회
      role = dbRole;
      permissions = await userRoleRepo.getRolePermissions(dbRole);

      Logger.debug(
        `User ${userId} role: ${role} (from DB), permissions: ${permissions.length}`,
      );
    }
  }

  // Context에 저장
  c.set("userRole", role);
  c.set("permissions", permissions);

  return await next();
}

/**
 * RBAC 미들웨어
 * - WHITE_LISTED_ROUTES는 스킵
 * - JWT 미들웨어 이후에 실행되어야 함
 */
export const rbacMiddleware = except(WHITE_LISTED_ROUTES, createEnrichWithRbacHandler());

// ============================================================
// PERMISSION CHECK MIDDLEWARE
// ============================================================

function permissionMatches(
  userPermissions: Permission[],
  requiredPermission: Permission,
): boolean {
  if (userPermissions.includes(Permission.ALL)) {
    return true;
  }
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  const permissionStr = requiredPermission as string;
  if (permissionStr.includes(":")) {
    const [resource] = permissionStr.split(":");
    const resourceWildcard = `${resource}:*` as Permission;
    if (userPermissions.includes(resourceWildcard)) {
      return true;
    }
  }

  return false;
}

/**
 * 특정 권한을 요구하는 미들웨어 생성
 *
 * @example
 * app.delete("/:id", requirePermission(Permission.PROJECTS_DELETE), async (c) => {
 *   // 권한이 있는 경우에만 실행됨
 * });
 */
export function requirePermission(permission: Permission) {
  return async (c: Context, next: Next) => {
    const userPermissions = c.get("permissions") as Permission[] | undefined;
    const userRole = c.get("userRole") as Role | undefined;
    const userId = c.get("userId") as string | undefined;

    Logger.debug(`requirePermission - checking ${permission}`, {
      userId,
      userRole,
      userPermissions,
    });

    if (!userPermissions || userPermissions.length === 0) {
      Logger.warn(`User ${userId} attempted action without permissions`, {
        requiredPermission: permission,
        userRole: userRole || "none",
      });

      throw new ForbiddenError(
        `You don't have permission to perform this action. Required: ${permission}`,
      );
    }

    if (!permissionMatches(userPermissions, permission)) {
      Logger.warn(`User ${userId} missing required permission`, {
        requiredPermission: permission,
        userPermissions,
        userRole,
      });

      throw new ForbiddenError(
        `You don't have permission to perform this action. Required: ${permission}`,
      );
    }

    Logger.info(`User ${userId} authorized for ${permission}`);
    return await next();
  };
}

/**
 * 여러 권한 중 하나라도 있으면 허용
 *
 * @example
 * app.post("/upload", requireAnyPermission([Permission.IMAGES_GENERATE, Permission.ALL]), async (c) => {
 *   // 둘 중 하나라도 있으면 실행
 * });
 */
export function requireAnyPermission(requiredPermissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const permissions = c.get("permissions") as Permission[] | undefined;
    const userRole = c.get("userRole") as Role | undefined;
    const userId = c.get("userId") as string | undefined;

    if (!permissions || permissions.length === 0) {
      Logger.warn(`User ${userId} attempted action without permissions`, {
        requiredPermissions,
        userRole: userRole || "none",
      });

      throw new ForbiddenError(
        "You don't have permission to perform this action",
      );
    }

    const hasAnyPermission = requiredPermissions.some((required) =>
      permissionMatches(permissions, required)
    );

    if (!hasAnyPermission) {
      Logger.warn(`User ${userId} missing all required permissions`, {
        requiredPermissions,
        userPermissions: permissions,
        userRole,
      });

      throw new ForbiddenError(
        "You don't have permission to perform this action",
      );
    }

    Logger.info(
      `User ${userId} authorized with one of: ${
        requiredPermissions.join(", ")
      }`,
    );
    return await next();
  };
}

/**
 * 모든 권한이 필요한 경우
 *
 * @example
 * app.post("/dangerous", requireAllPermissions([Permission.PROJECTS_DELETE, Permission.ALL]), async (c) => {
 *   // 모든 권한이 있어야 실행
 * });
 */
export function requireAllPermissions(requiredPermissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const permissions = c.get("permissions") as Permission[] | undefined;
    const userRole = c.get("userRole") as Role | undefined;
    const userId = c.get("userId") as string | undefined;

    if (!permissions || permissions.length === 0) {
      Logger.warn(`User ${userId} attempted action without permissions`, {
        requiredPermissions,
        userRole: userRole || "none",
      });

      throw new ForbiddenError(
        "You don't have permission to perform this action",
      );
    }

    const hasAllPermissions = requiredPermissions.every((required) =>
      permissionMatches(permissions, required)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (required) => !permissionMatches(permissions, required),
      );

      Logger.warn(`User ${userId} missing required permissions`, {
        missingPermissions,
        userPermissions: permissions,
        userRole,
      });

      throw new ForbiddenError(
        "You don't have all required permissions for this action",
      );
    }

    Logger.info(
      `User ${userId} authorized with all: ${requiredPermissions.join(", ")}`,
    );
    return await next();
  };
}
