import "@test/env";
import { assertEquals } from "@std/assert";
import { isPermission, isRole, Permission, Role } from "./rbac.ts";

// ---------------------------------------------------------------------------
// isRole
// ---------------------------------------------------------------------------

Deno.test("isRole - 유효한 Role: true 반환", () => {
  assertEquals(isRole("member"), true);
  assertEquals(isRole("admin"), true);
});

Deno.test("isRole - Role enum 값 직접 전달: true 반환", () => {
  assertEquals(isRole(Role.MEMBER), true);
  assertEquals(isRole(Role.ADMIN), true);
});

Deno.test("isRole - 유효하지 않은 문자열: false 반환", () => {
  assertEquals(isRole("superadmin"), false);
  assertEquals(isRole("MEMBER"), false); // 대문자
  assertEquals(isRole(""), false);
});

Deno.test("isRole - 비문자열 타입: false 반환", () => {
  assertEquals(isRole(123), false);
  assertEquals(isRole(null), false);
  assertEquals(isRole(undefined), false);
  assertEquals(isRole(true), false);
  assertEquals(isRole({}), false);
});

// ---------------------------------------------------------------------------
// isPermission
// ---------------------------------------------------------------------------

Deno.test("isPermission - 와일드카드 권한: true 반환", () => {
  assertEquals(isPermission("*"), true);
});

Deno.test("isPermission - 리소스 와일드카드: true 반환", () => {
  assertEquals(isPermission("resources:*"), true);
});

Deno.test("isPermission - 구체적 권한: true 반환", () => {
  assertEquals(isPermission("resources:create"), true);
  assertEquals(isPermission("resources:read"), true);
  assertEquals(isPermission("resources:update"), true);
  assertEquals(isPermission("resources:delete"), true);
});

Deno.test("isPermission - Permission enum 값 직접 전달: true 반환", () => {
  assertEquals(isPermission(Permission.ALL), true);
  assertEquals(isPermission(Permission.RESOURCES_CREATE), true);
  assertEquals(isPermission(Permission.RESOURCES_READ), true);
});

Deno.test("isPermission - 유효하지 않은 문자열: false 반환", () => {
  assertEquals(isPermission("resources:delete_all"), false);
  assertEquals(isPermission("unknown:action"), false);
  assertEquals(isPermission(""), false);
  assertEquals(isPermission("RESOURCES_READ"), false); // enum key, not value
});

Deno.test("isPermission - 비문자열 타입: false 반환", () => {
  assertEquals(isPermission(123), false);
  assertEquals(isPermission(null), false);
  assertEquals(isPermission(undefined), false);
  assertEquals(isPermission({}), false);
});
