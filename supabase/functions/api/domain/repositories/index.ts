/**
 * Repository Interfaces
 *
 * 클린 아키텍처의 의존성 역전 원칙(DIP)을 위한 Repository 인터페이스
 * Use Case 계층이 인프라 계층에 의존하지 않도록 추상화
 */

import type { Permission, Role } from "../value-objects/rbac.ts";

// ============================================
// UserRole Repository Interface (RBAC)
// ============================================

export interface UserRoleRepository {
  getUserRole(userId: string): Promise<Role | null>;
  assignRole(userId: string, role: string): Promise<void>;
  getRolePermissions(role: string): Promise<Permission[]>;
}

// ============================================
// Example Repository Interface
// ============================================

export interface ExampleEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ExampleRepository {
  findById(id: string): Promise<ExampleEntity | null>;
  create(data: Omit<ExampleEntity, "id" | "createdAt">): Promise<ExampleEntity>;
}
