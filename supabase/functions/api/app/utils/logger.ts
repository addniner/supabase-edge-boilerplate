/**
 * 환경별 로그 레벨 제어 Logger
 *
 * console.info/warn/error를 래핑하여 환경(ENVIRONMENT)에 따라
 * 로그 출력을 필터링합니다.
 *
 * - production: info 이상만 출력
 * - development/local: debug 포함 모든 로그 출력
 * - Supabase Edge Functions의 execution_id로 자동 추적되므로
 *   별도의 requestId나 복잡한 구조화는 불필요
 *
 * @example
 * ```typescript
 * Logger.info("Server started");
 * Logger.error("Error occurred", { userId: 123 }, error);
 * Logger.debug("Debug info", { data: {...} });
 * ```
 */

// deno-lint-ignore-file no-console
import { isProduction } from "@app/config";

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Static Logger 클래스
 * 환경에 따라 로그 레벨을 필터링하고, console API에 위임
 */
export class Logger {
  private static minLevel: LogLevel;

  /**
   * 로그 레벨 우선순위
   */
  private static readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  /**
   * Static 초기화 블록
   * 환경별 기본 로그 레벨 설정
   */
  static {
    if (isProduction()) {
      Logger.minLevel = "info";
    } else {
      // development/local: debug 포함 모든 로그 출력
      Logger.minLevel = "debug";
    }
  }

  /**
   * 로그 출력 여부 확인
   */
  private static shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[Logger.minLevel];
  }

  /**
   * Debug 로그
   */
  static debug(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog("debug")) {
      console.debug(message, ...args);
    }
  }

  /**
   * Info 로그
   */
  static info(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog("info")) {
      console.info(message, ...args);
    }
  }

  /**
   * Warning 로그
   */
  static warn(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog("warn")) {
      console.warn(message, ...args);
    }
  }

  /**
   * Error 로그
   */
  static error(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog("error")) {
      console.error(message, ...args);
    }
  }

  /**
   * 최소 로그 레벨 설정 (테스트용)
   */
  static setMinLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }

  /**
   * 현재 로그 레벨 가져오기 (테스트용)
   */
  static getMinLevel(): LogLevel {
    return Logger.minLevel;
  }
}
