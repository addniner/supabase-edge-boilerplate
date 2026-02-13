/**
 * Test Setup
 *
 * 테스트 환경 초기화를 위한 유틸리티
 */

export const TEST_STORAGE_CONFIG = {
  ASSETS_BUCKET: "test-assets",
  PUBLIC_RESOURCES_BUCKET: "test-public-resources",
  PROJECTS_BUCKET: "test-projects",
};

export function setupTestEnv(): void {
  // Supabase 설정
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

  // 데이터베이스 설정
  Deno.env.set("SUPABASE_DB_URL", "postgresql://test:test@localhost:5432/test");
  Deno.env.set("DB_URL", "postgresql://test:test@localhost:5432/test");
  Deno.env.set("DB_SSL_CERT", "test-ssl-cert");
  Deno.env.set("DB_WEBHOOK_SECRET", "test-db-webhook-secret");

  // 인증/보안 설정
  Deno.env.set("INTERNAL_WEBHOOK_SECRET", "test-webhook-secret");

  // Figma 설정
  Deno.env.set("FIGMA_FILE_ID", "test-figma-file-id");
  Deno.env.set("FIGMA_ACCESS_TOKEN", "test-figma-access-token");

  // AI 설정
  Deno.env.set("GOOGLE_GENERATIVE_AI_API_KEY", "test-google-ai-key");

  // Google 설정
  Deno.env.set("GOOGLE_APPLICATION_CREDENTIALS", "test-google-creds");

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
