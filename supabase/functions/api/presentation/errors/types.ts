// API 관련 기본 타입들

/**
 * Hono에서 허용하는 HTTP 상태 코드 유니온 타입
 */
// export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500;

// 표준 에러 아이템(필드 단위 등 상세 사유 표현)
export interface ErrorItem {
  field?: string;
  reason: string;
  meta?: unknown;
}

// 성공 응답 엔벨로프
// requestId는 x-request-id 응답 헤더로 전달됨
export interface SuccessEnvelope<T = unknown> {
  isSuccess: true;
  code: string; // 예: COMMON_2000
  message: string; // 사용자/개발자 메시지
  data: T; // 성공 데이터
  errors: null; // 성공 시 항상 null
}

// 실패 응답 엔벨로프
// requestId는 x-request-id 응답 헤더로 전달됨
export interface ErrorEnvelope {
  isSuccess: false;
  code: string; // 예: COMMON_4000, COMMON_5000
  message: string;
  data: null; // 실패 시 항상 null
  errors: ErrorItem[] | null; // 상세 에러 목록(검증 등)
}
