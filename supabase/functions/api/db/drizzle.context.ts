// Drizzle ORM 데이터베이스 클라이언트 설정

import { getConfig, isDevelopment, isLocal } from "@app/config";
import { Logger } from "@app/utils";

import postgres from "@postgres-js";
import { drizzle } from "@drizzle-orm/postgres-js";

import * as schema from "./schema.ts";

// 로컬 환경에서만 sql-formatter 동적 로드
let sqlFormatter: ((sql: string) => string) | null = null;
if (isLocal() || isDevelopment()) {
  const { format } = await import("@sql-formatter");
  const { cyan } = await import("@std/fmt/colors");
  sqlFormatter = (sql: string) =>
    cyan(
      format(sql, {
        language: "postgresql",
        tabWidth: 2,
        keywordCase: "upper",
      }),
    );
}

/**
 * 데이터베이스 연결 생성
 */
function createDatabaseConnection() {
  const {
    DB_PORT,
    DB_HOSTNAME,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_SSL_CERT,
  } = getConfig().database;

  let connectionMode: string;

  switch (true) {
    case DB_PORT === 6543:
      // 포트 6543: 트랜잭션 풀러
      connectionMode = "Transaction Pooler (6543)";
      break;
    case DB_HOSTNAME.includes(".pooler.supabase.com"):
      // 풀러 호스트네임: 고급 풀러 (Supavisor)
      connectionMode = "Advanced Pooler (Supavisor Host)";
      break;
    case DB_PORT === 5432:
      // 포트 5432: 표준 Direct Connection 또는 Session Pooler
      connectionMode = "Direct Connection (Standard 5432) / Session Pooler";
      break;
    case DB_PORT === 54322:
      // 포트 54322: 로컬 Docker 개발 환경
      connectionMode = "Direct Connection (Local Docker 54322)";
      break;
    case DB_PORT === 54329:
      // 포트 54329: 로컬 Pooler
      connectionMode = "Local Pooler (54329)";
      break;
    default:
      // 기타 비표준 포트
      connectionMode = `Direct Connection (Non-Standard Port ${DB_PORT})`;
  }

  // Connect Info Logging
  Logger.info(`[DB Init] Connection Mode: ${connectionMode}`);
  Logger.debug(`[DB Init] Connection Details:`, {
    hostname: DB_HOSTNAME,
    port: DB_PORT,
    dbName: DB_NAME,
    user: DB_USER,
  });

  // 트랜잭션 풀러 사용 시 prepare: false 필요
  const isTransactionPooler = DB_PORT === 6543 ||
    DB_PORT === 54329 ||
    DB_HOSTNAME.includes(".pooler.supabase.com");

  // 연결 문자열 구성
  const connectionString =
    `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`;

  // postgres.js 클라이언트 생성
  const client = postgres(connectionString, {
    prepare: !isTransactionPooler, // 트랜잭션 풀러에서는 prepared statements 비활성화
    max: 1, // Edge Function에서는 단일 연결 사용
    ...(!isLocal() && DB_SSL_CERT && {
      ssl: { ca: DB_SSL_CERT },
    }),
  });

  return client;
}

// 스키마를 포함한 Database 타입
export type DrizzleDatabase = ReturnType<typeof createDatabase>;

/**
 * Drizzle 데이터베이스 인스턴스 생성
 * casing: "snake_case"로 snake_case → camelCase 자동 변환
 */
export function createDatabase() {
  const client = createDatabaseConnection();

  return drizzle({
    client,
    schema,
    casing: "snake_case",
    // 쿼리 로깅 (로컬/개발 환경에서만)
    logger: (isLocal() || isDevelopment())
      ? {
        logQuery: (query: string, params: unknown[]) => {
          Logger.debug(
            "Query executed",
            "\nSQL:\n" +
              (sqlFormatter ? sqlFormatter(query) : query),
            "\nParams:",
            params,
            "\n---",
          );
        },
      }
      : undefined,
  });
}

/**
 * 싱글톤 데이터베이스 인스턴스
 */
let dbInstance: DrizzleDatabase | null = null;

/**
 * 데이터베이스 인스턴스 가져오기 (캐싱됨)
 */
export function getDatabase(): DrizzleDatabase {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
}

/**
 * 데이터베이스 연결 종료 (테스트용)
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    // postgres.js는 drizzle 인스턴스에서 직접 종료 불가
    // 필요시 client 참조를 별도 관리해야 함
    dbInstance = null;
  }
  await Promise.resolve();
}
