import { Logger } from "@logger";

/**
 * 함수 실행 시간 측정 및 퍼포먼스 로깅
 * @param name - 작업 이름 (로그에 표시)
 * @param fn - 실행할 함수
 * @returns 실행 결과
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startAt = performance.now();
  const result = await fn();
  const endAt = performance.now();
  const durationMs = Math.round(endAt - startAt);

  Logger.info(`[Performance] ${name} completed in ${durationMs}ms`, {
    durationMs,
  });

  return result;
}
