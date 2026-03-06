/**
 * 환경 변수 관리 및 검증
 *
 * 모든 환경 변수를 중앙에서 관리하고 타입 안전성을 보장합니다.
 */

import { EnvironmentVariableError } from "@app/errors";
import type {
  AppConfig,
  DatabaseConfig,
  DeployEnvironment,
  DevConfig,
  StorageConfig,
  SupabaseConfig,
} from "@shared/types";

/**
 * 필수 환경 변수 검증
 */
function getEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value?.trim()) {
    throw new EnvironmentVariableError(
      `Required environment variable "${key}" is not set`,
      key,
    );
  }
  return value;
}

/**
 * 선택적 환경 변수 (기본값 지원)
 */
function getOptionalEnv(key: string, defaultValue = ""): string {
  return Deno.env.get(key) ?? defaultValue;
}

/**
 * Supabase 환경 변수 로드
 */
function loadSupabaseConfig(): SupabaseConfig {
  return {
    SUPABASE_URL: getEnv("SUPABASE_URL"),
    SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

/**
 * 데이터베이스 환경 변수 로드
 */
function loadDatabaseConfig(): DatabaseConfig {
  const dbUrl = getEnv("DATABASE_URL");

  try {
    const url = new URL(dbUrl);
    return {
      DB_HOSTNAME: url.hostname,
      DB_PORT: parseInt(url.port),
      DB_NAME: url.pathname.slice(1),
      DB_USER: url.username,
      DB_PASSWORD: url.password,
      DB_SSL_CERT: getOptionalEnv("DB_SSL_CERT"),
      DB_WEBHOOK_SECRET: getOptionalEnv("DB_WEBHOOK_SECRET"),
    };
  } catch (error) {
    throw new EnvironmentVariableError(
      `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : String(error)}`,
      "DATABASE_URL",
    );
  }
}

/**
 * 개발 환경 변수 로드 (로컬 개발용)
 */
function loadDevConfig(): DevConfig {
  return {
    NGROK_URL: Deno.env.get("NGROK_URL"),
  };
}

/**
 * Storage 환경 변수 로드 (선택적)
 */
function loadStorageConfig(): StorageConfig | null {
  const json = Deno.env.get("STORAGE_CONFIG_JSON");
  if (!json?.trim()) return null;

  try {
    const obj = JSON.parse(json);
    return {
      PROJECTS_BUCKET: obj.PROJECTS_BUCKET ?? "",
      ASSETS_BUCKET: obj.ASSETS_BUCKET ?? "",
      PUBLIC_RESOURCES_BUCKET: obj.PUBLIC_RESOURCES_BUCKET ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * 환경 구분 감지
 */
function detectEnvironment(): DeployEnvironment {
  const environment = getOptionalEnv("ENVIRONMENT", "local");

  if (environment === "production") return "production";
  if (environment === "development") return "development";
  return "local";
}

/**
 * 전체 환경 변수 로드
 */
function loadConfig(): AppConfig {
  return {
    supabase: loadSupabaseConfig(),
    storage: loadStorageConfig(),
    database: loadDatabaseConfig(),
    dev: loadDevConfig(),
    environment: detectEnvironment(),
  };
}

/**
 * 환경 변수 싱글톤
 */
let cachedConfig: AppConfig | null = null;

/**
 * 환경 변수 가져오기 (캐싱됨)
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/**
 * 환경 변수 초기화 (테스트용)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * 환경 체크 헬퍼 함수들
 */
export function isLocal(): boolean {
  return getConfig().environment === "local";
}

export function isDevelopment(): boolean {
  return getConfig().environment === "development";
}

export function isProduction(): boolean {
  return getConfig().environment === "production";
}
