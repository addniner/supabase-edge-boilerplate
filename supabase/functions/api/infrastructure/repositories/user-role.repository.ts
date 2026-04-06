/**
 * UserRole Repository
 *
 * RBAC(Role-Based Access Control)를 위한 저수준 데이터 접근 계층
 */

import { eq } from "@drizzle-orm";
import { BaseRepository, rolePermissions, userRoles } from "@db";
import type { Permission, Role } from "@domain";
import type { UserRoleRepository } from "@domain/repositories";

export class UserRoleRepositoryImpl extends BaseRepository implements UserRoleRepository {
  async getUserRole(userId: string): Promise<Role | null> {
    const result = await this.db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    return (result[0]?.role as Role) ?? null;
  }

  async assignRole(userId: string, role: string): Promise<void> {
    await this.db
      .insert(userRoles)
      .values({ userId, role })
      .onConflictDoUpdate({
        target: userRoles.userId,
        set: { role, updatedAt: new Date() },
      });
  }

  async getRolePermissions(role: string): Promise<Permission[]> {
    const result = await this.db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));

    return result.map((r) => r.permission as Permission);
  }
}
