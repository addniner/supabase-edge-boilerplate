/**
 * Test Setup
 *
 * 테스트 환경 초기화를 위한 유틸리티
 */

export const TEST_STORAGE_CONFIG = {
  STORAGE_BUCKET_ASSETS: "test-assets",
  STORAGE_BUCKET_PUBLIC_RESOURCES: "test-public-resources",
  STORAGE_BUCKET_PROJECTS: "test-projects",
};

export function setupTestEnv(): void {
  // Supabase Edge Runtime polyfill (테스트 환경)
  // deno-lint-ignore no-explicit-any
  if (typeof (globalThis as any).EdgeRuntime === "undefined") {
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime = {
      waitUntil: (promise: Promise<unknown>) => promise,
    };
  }

  // Supabase 설정
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

  // 데이터베이스 설정
  Deno.env.set("SUPABASE_DB_URL", "postgresql://test:test@localhost:5432/test");
  Deno.env.set("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
  Deno.env.set("DB_SSL_CERT", "test-ssl-cert");
  Deno.env.set("DB_WEBHOOK_SECRET", "test-db-webhook-secret");

  // 인증/보안 설정
  Deno.env.set("INTERNAL_WEBHOOK_SECRET", "test-webhook-secret");
  Deno.env.set("ENCRYPTION_KEY", "test-encryption-key");

  // 환경 설정
  Deno.env.set("ENVIRONMENT", "local");

  // Storage 버킷 설정
  Deno.env.set("STORAGE_BUCKET_PROJECTS", TEST_STORAGE_CONFIG.STORAGE_BUCKET_PROJECTS);
  Deno.env.set("STORAGE_BUCKET_ASSETS", TEST_STORAGE_CONFIG.STORAGE_BUCKET_ASSETS);
  Deno.env.set("STORAGE_BUCKET_PUBLIC_RESOURCES", TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES);
}
