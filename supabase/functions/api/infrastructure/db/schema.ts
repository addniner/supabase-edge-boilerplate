// Drizzle ORM 스키마 정의
// Deno + Node.js 양쪽에서 사용

import { sql } from "@drizzle-orm";
import {
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
} from "@drizzle-orm/pg-core";
import { authenticatedRole } from "@drizzle-orm/supabase";

// ============================================
// RBAC (역할 기반 접근 제어)
// ============================================

/**
 * user_roles 테이블
 * 사용자별 역할 할당 (RBAC)
 */
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
    .notNull(),
}, (table) => [
  pgPolicy("user_roles_select_own", {
    for: "select",
    to: authenticatedRole,
    using: sql`(select auth.uid())::text = ${table.userId}`,
  }),
]);

/**
 * role_permissions 테이블
 * 역할별 권한 매핑 (RBAC)
 */
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
    .notNull(),
}, () => [
  pgPolicy("role_permissions_select_authenticated", {
    for: "select",
    to: authenticatedRole,
    using: sql`true`,
  }),
]);

// ============================================
// 타입 추론을 위한 export
// ============================================

// RBAC
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
