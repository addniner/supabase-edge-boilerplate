// Language Detector 미들웨어

import { languageDetector } from "@hono/language";

/**
 * 언어 자동 감지 미들웨어
 *
 * ## 감지 순서 (우선순위)
 * 1. Path: /ko/endpoint → "ko" (미래 대비, 현재는 사용 안 함)
 * 2. Query: ?lang=en → "en"
 * 3. Cookie: language=en → "en"
 * 4. Header: Accept-Language: en-US,en;q=0.9 → "en"
 * 5. Fallback: 위 모두 실패 시 → "ko"
 *
 * ## 자동 쿠키 캐싱
 * - 감지된 언어를 `language` 쿠키에 1년간 저장
 * - 재방문 시 자동으로 이전 언어 적용
 *
 * ## 사용법
 * ```typescript
 * const language = c.get("language") as Language; // "ko" | "en"
 * ```
 */
export const languageMiddleware = languageDetector({
  supportedLanguages: ["ko", "en"],
  fallbackLanguage: "ko",
  order: ["path", "querystring", "cookie", "header"],
  lookupQueryString: "lang",
  lookupCookie: "language",
  lookupFromPathIndex: 0,
});
