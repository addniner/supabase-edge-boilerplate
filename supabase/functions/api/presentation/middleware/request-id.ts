/**
 * 요청 ID 미들웨어
 *
 * ## 개요
 * - requestId: 각 HTTP 요청의 고유 ID
 * - correlationId: 함수 체이닝 전체의 고유 ID
 * - Supabase Edge Functions의 execution_id와 매핑하여 추적
 *
 * ## 동작 방식
 * - x-correlation-id 헤더가 있으면: 체이닝된 호출 (전달받은 correlationId 사용)
 * - x-correlation-id 헤더가 없으면: 단독 호출 또는 체이닝 시작점 (requestId를 correlationId로 사용)
 *
 * ## 함수 체이닝 예시
 * ```typescript
 * // Function A에서 Function B 호출
 * await fetch("function-b-url", {
 *   headers: {
 *     "x-correlation-id": c.get("correlationId"),
 *   }
 * });
 *
 * // 로그:
 * // Function A: POST /convert [reqId: abc123] [corrId: abc123]
 * // Function B: POST /upload [reqId: xyz789] [corrId: abc123]
 * ```
 */

import { requestId } from "@hono/request-id";
import type { Context, Next } from "@hono";
import { Logger } from "@logger";
import { isLocal } from "@config";

export const requestIdMiddleware = async (c: Context, next: Next) => {
  await requestId({
    headerName: "x-request-id",
    limitLength: 8,
  })(c, async () => {
    const reqId = c.get("requestId");
    const correlationId = c.req.header("x-correlation-id");

    c.set("correlationId", correlationId || reqId);
    Logger.info(
      `${c.req.method} ${c.req.path} [reqId: ${reqId}] [corrId: ${
        correlationId || reqId
      }]`,
    );

    // 로컬에서 모든 요청 로깅
    if (isLocal()) {
      // Query 파라미터 로깅 (디버그 레벨)
      try {
        const url = new URL(c.req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        if (Object.keys(queryParams).length > 0) {
          Logger.debug("queryParams:", queryParams);
        }
      } catch {
        // URL 파싱 실패 시 무시
      }

      // bodyRequest 로깅 (JSON일 때만)
      try {
        const rawRequest = c.req.raw;
        const clonedRequest = rawRequest.clone();
        const body = await clonedRequest.json();
        if (body && Object.keys(body).length > 0) {
          Logger.debug("bodyRequest:", body);
        }
      } catch {
        // JSON이 아니면 무시
      }
    }

    await next();
  });
};
