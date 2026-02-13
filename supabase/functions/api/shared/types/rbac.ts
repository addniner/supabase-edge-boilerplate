/**
 * RBAC (Role-Based Access Control) Types
 *
 * 역할 기반 접근 제어 관련 타입 정의
 */

import type { Permission, Role } from "../enums/rbac.ts";

// ============================================================
// DATABASE MODELS
// ============================================================

/**
 * user_roles 테이블 타입
 */
export interface UserRole {
  id: bigint;
  user_id: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

/**
 * role_permissions 테이블 타입
 */
export interface RolePermission {
  id: bigint;
  role: Role;
  permission: Permission;
  created_at: string;
}

// ============================================================
// JWT TYPES
// ============================================================

/**
 * JWT Payload with RBAC claims
 *
 * Supabase JWT에 user_role claim이 추가된 형태
 */
export interface JwtPayloadWithRole {
  sub: string; // user_id
  email?: string;
  user_role?: string; // Custom claim added by Auth Hook
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  [key: string]: unknown;
}

// ============================================================
// CONTEXT TYPES
// ============================================================

/**
 * RBAC가 추가된 Hono Context 변수
 *
 * JWT 미들웨어 + RBAC 미들웨어 적용 후 Context에 저장되는 정보
 */
export interface RbacContextVariables {
  // From JWT middleware
  userId: string;
  userEmail?: string;

  // From RBAC middleware
  userRole?: Role;
  permissions?: Permission[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * 권한 체크 결과
 */
export interface PermissionCheckResult {
  allowed: boolean;
  role?: Role;
  missingPermission?: Permission;
}

/**
 * UserRole INSERT 타입 (created_at, updated_at 제외)
 */
export type UserRoleInsert = Pick<UserRole, "user_id" | "role">;

/**
 * RolePermission INSERT 타입 (created_at 제외)
 */
export type RolePermissionInsert = Pick<RolePermission, "role" | "permission">;
