/**
 * Supabase Edge Runtime 전역 타입 선언
 * @see https://supabase.com/docs/guides/functions/background-tasks
 */
declare namespace EdgeRuntime {
  /**
   * 응답 후에도 백그라운드 작업 완료까지 Edge Function 유지
   * @param promise 완료를 기다릴 Promise
   */
  export function waitUntil<T>(promise: Promise<T>): Promise<T>;
}
