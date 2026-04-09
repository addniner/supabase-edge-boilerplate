// 기본 Repository 클래스 - 공통 기능 제공
import { getDatabase, type DrizzleDatabase } from "./drizzle.context.ts";

/**
 * BaseRepository - 모든 Repository의 기본 클래스
 *
 * 제공 기능: Drizzle 인스턴스 제공
 * 1. 데이터베이스 연결 관리
 * 2. 공통 유틸리티 메서드
 */
export abstract class BaseRepository {
  protected db: DrizzleDatabase;

  constructor(db?: DrizzleDatabase) {
    this.db = db ?? getDatabase();
  }
}
