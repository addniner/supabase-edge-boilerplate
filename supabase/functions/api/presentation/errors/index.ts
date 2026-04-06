/**
 * 공유 에러 클래스들
 *
 * - CustomError: HTTP 상태코드를 포함하는 presentation 레이어 에러 (presentation 전용)
 * - 비즈니스 예외 클래스들은 domain/exceptions로 이전됨.
 *   commons/에서 re-export하여 기존 @errors import 하위 호환 유지.
 *   신규 usecase 코드는 @domain/exceptions 직접 사용 권장.
 */
export { CustomError } from "./custom-error.ts";
export * from "./commons/index.ts";
