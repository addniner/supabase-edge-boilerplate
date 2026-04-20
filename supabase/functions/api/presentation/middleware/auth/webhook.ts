import type { Context, Next } from "@hono";

import { UnauthorizedError } from "@domain/exceptions";
import { Logger } from "@logger";
import { getConfig } from "@config";

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
function validateWebhookToken(token: string) {
  const secret = getConfig().database.DB_WEBHOOK_SECRET;

  if (secret !== token) {
    // 로그에는 상세 정보 기록 (디버깅용)
    Logger.debug("Webhook token validation failed", {
      providedToken: token,
      expectedSecret: secret,
    });

    // 사용자에게는 일반적인 메시지만 반환 (보안)
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  return true;
}

/**
 * 인증 핸들러
 * - JWT 토큰 추출 및 검증
 * - Context에 사용자 정보 저장
 */
async function authenticate(c: Context, next: Next) {
  // 일단 requestId 찍자
  // 나중에 리팩토링 필요할 듯
  const requestId = c.get("requestId");
  Logger.info(`Webhook authentication requestId: ${requestId}`);

  const token = extractToken(c);
  validateWebhookToken(token);
  c.set("webhook", true);

  return await next();
}

/**
 * 인증 미들웨어
 */
export const authWebhookMiddleware = authenticate;
