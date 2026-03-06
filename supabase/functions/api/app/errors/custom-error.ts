import type { ErrorItem } from "@shared/types";

/**
 * 공통 커스텀 에러 베이스 클래스
 * - 도메인/검증/권한 등 모든 비즈니스 에러는 이 클래스를 확장해 사용합니다.
 */
export class CustomError extends Error {
  public override readonly name = "CustomError";
  public readonly code: string;
  public readonly status: number;
  public readonly errors: ErrorItem[] | null;
  public readonly meta?: unknown;

  constructor(
    code: string,
    status: number,
    message: string,
    errors: ErrorItem[] | null = null,
    meta?: unknown,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.errors = errors;
    this.meta = meta;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
