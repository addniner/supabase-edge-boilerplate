import type { Role, Permission } from "../value-objects/rbac.ts";

export interface UserRoleRepository {
  getUserRole(userId: string): Promise<Role | null>;
  assignRole(userId: string, role: string): Promise<void>;
  getRolePermissions(role: string): Promise<Permission[]>;
}
