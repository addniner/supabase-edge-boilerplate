/**
 * 도메인 에러 베이스 클래스
 * - HTTP 상태코드 없음 (presentation 관심사)
 * - 모든 비즈니스/도메인 예외는 이 클래스를 확장해 사용
 */
export class DomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 도메인 에러에서 사용하는 상세 에러 아이템
 */
export interface DomainErrorItem {
  field?: string;
  reason: string;
  meta?: unknown;
}
