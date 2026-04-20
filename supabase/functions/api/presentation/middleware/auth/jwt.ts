// 인증 미들웨어 - JWT 토큰 검증 및 사용자 정보 추출

// OWASP 권장사항 준수
// 인증 실패 시 일반적 메시지 사용
// 민감 정보는 로그로만 기록

import type { Context, Next } from "@hono";
import { except } from "@hono/combine";

import type { SupabaseClient, User } from "@supabase-js";

import { createAuthSupabaseClient } from "@clients";
import { WHITE_LISTED_ROUTES } from "@config";
import { UnauthorizedError } from "@domain/exceptions";
import { Logger } from "@logger";

/**
 * Authorization 헤더에서 JWT 토큰 추출
 */
function extractToken(c: Context): string {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new UnauthorizedError("Missing authentication credentials");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Invalid authentication credentials");
  }

  return authHeader.replace("Bearer ", "");
}

/**
 * JWT 토큰 검증 및 사용자 정보 추출
 */
async function validateUserToken(supabase: SupabaseClient, token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    // 로그에는 상세 정보 기록 (디버깅용)
    Logger.warn("Token validation failed", { error: error.message });

    // 사용자에게는 일반적인 메시지만 반환 (보안)
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  if (!user) {
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  return user;
}

/**
 * JWT 페이로드 디코드 (custom claims 추출용)
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {};
    }

    // Base64 URL decode
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    Logger.warn("Failed to decode JWT payload", { error });
    return {};
  }
}

/**
 * Context에 사용자 정보 저장
 */
function setUserToContext(
  c: Context,
  user: User,
  jwtPayload: Record<string, unknown>,
): void {
  // JWT custom claims를 User 객체에 병합
  const userWithClaims = {
    ...user,
    ...jwtPayload,
  };

  c.set("user", userWithClaims);
  c.set("userId", user.id);
  c.set("userEmail", user.email);

  Logger.debug(`Authenticated user: ${user.id}`);
}

/**
 * 테스트 가능한 인증 핸들러 생성
 * @param clientFactory - Supabase client 생성 함수 (테스트 시 mock 주입)
 */
export function createAuthenticateHandler(
  clientFactory: typeof createAuthSupabaseClient = createAuthSupabaseClient,
) {
  return async (c: Context, next: Next) => {
    const token = extractToken(c);
    const supabase = clientFactory(token);
    const user = await validateUserToken(supabase, token);

    // JWT 페이로드 디코드 (custom claims 추출)
    const jwtPayload = decodeJwtPayload(token);

    setUserToContext(c, user, jwtPayload);

    return await next();
  };
}

/**
 * 인증 미들웨어
 * - PUBLIC_ROUTES에 정의된 경로는 인증 없이 접근 가능
 * - 그 외 모든 경로는 인증 필요
 */
export const authJwtMiddleware = except(WHITE_LISTED_ROUTES, createAuthenticateHandler());
