# Drizzle ORM 가이드

## 개요

이 프로젝트는 **Drizzle ORM**을 사용하여 데이터베이스를 관리합니다.

- **런타임**: Deno (Supabase Edge Functions)
- **마이그레이션**: drizzle-kit (Node.js)
- **드라이버**: postgres.js

## 파일 구조

```
프로젝트 루트/
├── drizzle.config.ts              # drizzle-kit 설정
├── tsconfig.json                  # Node.js용 path 매핑
├── package.json                   # npm 스크립트
├── .env.local                     # 로컬 DB 연결
├── .env.staging                   # 스테이징 DB 연결
├── .env.production                # 프로덕션 DB 연결
└── supabase/
    ├── migrations/                # 마이그레이션 파일 (drizzle-kit 생성)
    │   └── 0000_living_forge.sql
    └── functions/api/db/
        ├── schema.ts              # 스키마 정의 (Deno + Node.js 공용)
        ├── drizzle.ts             # Drizzle 클라이언트
        ├── BaseRepository.ts      # 기본 레포지토리 클래스
        └── index.ts               # export
```

## 스키마 정의

`supabase/functions/api/db/schema.ts`:

```typescript
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "@drizzle-orm/pg-core";

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 타입 추론
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
```

> **참고**: `@drizzle-orm/pg-core` import는 Deno(import map)와 Node.js(tsconfig paths) 양쪽에서 동작합니다.

## 개발 워크플로우

### 1. 스키마 수정

`schema.ts`에서 테이블 추가/수정

### 2. 마이그레이션 생성

```bash
npm run db:generate
```

`supabase/migrations/`에 SQL 파일 생성됨

### 3. 마이그레이션 적용

```bash
# 로컬
npm run db:migrate

# 스테이징
npm run db:migrate:staging

# 프로덕션
npm run db:migrate:production
```

### 4. (선택) 빠른 개발용

마이그레이션 파일 없이 바로 DB 동기화:

```bash
npm run db:push
```

> 로컬 프로토타이핑 시에만 사용 권장

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `db:generate` | 스키마 변경사항으로 마이그레이션 파일 생성 |
| `db:migrate` | 로컬 DB에 마이그레이션 적용 |
| `db:migrate:staging` | 스테이징 DB에 마이그레이션 적용 |
| `db:migrate:production` | 프로덕션 DB에 마이그레이션 적용 |
| `db:push` | 마이그레이션 없이 스키마 직접 동기화 (로컬) |
| `db:studio` | Drizzle Studio GUI 실행 |

## 환경 변수

각 환경별 `.env.{환경}` 파일에 `DATABASE_URL` 설정:

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

## 마이그레이션 추적

Drizzle은 `drizzle.__drizzle_migrations` 테이블에서 적용된 마이그레이션을 추적합니다. 이미 적용된 마이그레이션은 다시 실행되지 않습니다.

## 쿼리 예시

```typescript
import { db } from "@db";
import { userRoles } from "@db/schema";
import { eq } from "drizzle-orm";

// SELECT
const roles = await db.select().from(userRoles).where(eq(userRoles.userId, "user-123"));

// INSERT
await db.insert(userRoles).values({ userId: "user-123", role: "member" });

// UPDATE
await db.update(userRoles).set({ role: "admin" }).where(eq(userRoles.userId, "user-123"));

// DELETE
await db.delete(userRoles).where(eq(userRoles.userId, "user-123"));
```

## 참고 자료

- [Drizzle ORM 공식 문서](https://orm.drizzle.team/)
- [Drizzle Kit 마이그레이션](https://orm.drizzle.team/docs/migrations)
