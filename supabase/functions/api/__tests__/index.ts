/**
 * 테스트 환경 초기화
 * 모든 테스트 파일에서 최상단에 import 할 것 (side-effect import)
 * Logger 등 모듈 최상위 static initializer보다 먼저 실행됨
 */

export const TEST_STORAGE_CONFIG = {
  ASSETS_BUCKET: "test-assets",
  PUBLIC_RESOURCES_BUCKET: "test-public-resources",
  PROJECTS_BUCKET: "test-projects",
};

function setupTestEnv(): void {
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

  // 환경 설정
  Deno.env.set("ENVIRONMENT", "local");

  // Storage 설정 (JSON 형태)
  Deno.env.set(
    "STORAGE_CONFIG_JSON",
    JSON.stringify({
      ASSETS_BUCKET: TEST_STORAGE_CONFIG.ASSETS_BUCKET,
      PUBLIC_RESOURCES_BUCKET: TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET,
      PROJECTS_BUCKET: TEST_STORAGE_CONFIG.PROJECTS_BUCKET,
    }),
  );

  // Storage 버킷 설정 (레거시 지원)
  Deno.env.set("ASSETS_BUCKET", TEST_STORAGE_CONFIG.ASSETS_BUCKET);
  Deno.env.set(
    "PUBLIC_RESOURCES_BUCKET",
    TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET,
  );
  Deno.env.set("PROJECTS_BUCKET", TEST_STORAGE_CONFIG.PROJECTS_BUCKET);
}

// Side-effect: import 시 자동 실행
setupTestEnv();
