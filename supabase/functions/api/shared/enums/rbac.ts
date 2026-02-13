/**
 * RBAC (Role-Based Access Control) Enums
 *
 * 이 파일은 역할(Role)과 권한(Permission) 관련 enum을 정의합니다.
 * 데이터베이스의 user_roles, role_permissions 테이블과 연동됩니다.
 */

// ============================================================
// ROLES
// ============================================================

/**
 * 사용자 역할
 */
export enum Role {
  /** 멤버 - 기본 회원 */
  MEMBER = "member",
  /** 관리자 - 모든 권한 */
  ADMIN = "admin",
}

/**
 * 타입 가드: 문자열이 유효한 Role인지 검증
 */
export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    Object.values(Role).includes(value as Role)
  );
}

// ============================================================
// PERMISSIONS
// ============================================================

/**
 * 권한 식별자
 *
 * 네이밍 컨벤션: <resource>:<action>
 *
 * 와일드카드 지원:
 * - *:* (또는 *) - 모든 리소스의 모든 액션
 * - resources:* - resources 리소스의 모든 액션
 * - *:read - 모든 리소스의 read 액션
 */
export enum Permission {
  // ===== 와일드카드 권한 =====
  /** 모든 권한 */
  ALL = "*",

  // ===== 리소스 권한 (예시) =====
  /** 리소스의 모든 권한 */
  RESOURCES_ALL = "resources:*",
  /** 리소스 생성 권한 */
  RESOURCES_CREATE = "resources:create",
  /** 리소스 조회 권한 */
  RESOURCES_READ = "resources:read",
  /** 리소스 수정 권한 */
  RESOURCES_UPDATE = "resources:update",
  /** 리소스 삭제 권한 */
  RESOURCES_DELETE = "resources:delete",
}

/**
 * 타입 가드: 문자열이 유효한 Permission인지 검증
 */
export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" &&
    Object.values(Permission).includes(value as Permission)
  );
}

// ============================================================
// NOTE: ROLE-PERMISSION MAPPING
// ============================================================
// 권한은 DB(role_permissions 테이블)에서 관리됩니다.
// 매 요청마다 RBAC 미들웨어에서 자동으로 DB 조회합니다.
//
// 권한 관리:
// - 권한 추가/변경: DB에만 INSERT/UPDATE 하면 즉시 반영
// - 동기화 불필요: 애플리케이션 코드 수정 불필요
//
// 참고:
// - UserRoleRepository.getUserPermissions() 사용
// - RBAC 미들웨어에서 자동으로 DB 조회
// ============================================================
