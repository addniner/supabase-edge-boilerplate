// 라우트 설정
// 인증이 필요 없는 공개 경로를 관리합니다.

/**
 * 인증 없이 접근 가능한 공개 경로 목록
 *
 * 지원하는 패턴:
 * - 정확한 경로: '/health'
 * - 와일드카드: '/public/*' (하위 경로 모두 포함)
 *
 * @example
 * '/public'     → /public만 매칭
 * '/public/*'   → /public/anything, /public/a/b/c 모두 매칭
 * '/health'     → /health만 매칭 (헬스체크용)
 */
// 프로덕션에서는 docs 라우트 차단
const docsRoutes =
  Deno.env.get("ENVIRONMENT") === "production"
    ? []
    : ["/api/docs", "/api/docs/*"];

export const WHITE_LISTED_ROUTES: string[] = [
  "/api/public", // 공개 경로 (정확한 매칭)
  "/api/public/*", // 공개 경로의 모든 하위 경로
  "/api/health", // 헬스체크 (인증 불필요)
  "/api/health/*", // 헬스체크 하위 경로
  ...docsRoutes, // Swagger UI (프로덕션 제외)
];
