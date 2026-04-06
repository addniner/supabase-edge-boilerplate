export interface SupabaseConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface StorageConfig {
  PROJECTS_BUCKET: string;
  ASSETS_BUCKET: string;
  PUBLIC_RESOURCES_BUCKET: string;
}

export interface DatabaseConfig {
  DB_HOSTNAME: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL_CERT: string;
  DB_WEBHOOK_SECRET: string; // 로컬 환경에서는 빈 문자열 허용
}

export type DeployEnvironment = "local" | "development" | "production";

export interface DevConfig {
  NGROK_URL?: string;
}

export interface AppConfig {
  supabase: SupabaseConfig;
  storage: StorageConfig | null;
  database: DatabaseConfig;
  dev: DevConfig;
  environment: DeployEnvironment;
}
