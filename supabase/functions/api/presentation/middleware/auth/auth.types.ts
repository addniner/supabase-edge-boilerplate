import type { User } from "@supabase-js";

export type AuthStrategy = "jwt" | "webhook";

/**
 * Supabase User with custom JWT claims
 * Auth Hook adds user_role to JWT claims at the top level
 */
export interface UserWithCustomClaims extends User {
  user_role?: string;
}
