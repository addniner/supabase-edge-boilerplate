---
paths:
  - supabase/functions/api/domain/repositories/**/*.ts
  - supabase/functions/api/infrastructure/repositories/**/*.ts
---

# Repository Layer Rules

## Purpose

Repositories are the **data access layer**. 인터페이스는 domain, 구현체는 infrastructure에 위치.

## Core Principles

- ✅ **인터페이스 분리** - `domain/repositories/`에 인터페이스, `infrastructure/repositories/`에 구현체
- ✅ **Impl 접미사** - 구현체는 `MyRepositoryImpl`로 명명
- ✅ **Extend BaseRepository + implements** - 공통 DB 기능 상속 + 인터페이스 구현
- ✅ **Use Drizzle ORM** - Type-safe database queries
- ❌ **No business logic** - No calculations, transformations, or validations

## Template

```typescript
// domain/repositories/my.repository.ts — 인터페이스
import type { MyEntity } from "@db";

export interface MyRepository {
  findByUserId(userId: string): Promise<MyEntity | null>;
  create(data: NewMyEntity): Promise<MyEntity>;
}
```

```typescript
// infrastructure/repositories/my.repository.ts — 구현체
import { BaseRepository, myTable } from "@db";
import { eq } from "@drizzle-orm";
import type { MyRepository } from "@domain/repositories";

export class MyRepositoryImpl extends BaseRepository implements MyRepository {
  async findByUserId(userId: string) {
    const result = await this.db
      .select().from(myTable)
      .where(eq(myTable.userId, userId));
    return result[0];
  }

  async create(data: NewMyEntity) {
    const result = await this.db
      .insert(myTable).values(data).returning();
    return result[0];
  }
}
```

## Important Notes

- 인터페이스의 엔티티 타입은 `@db`에서 `import type`으로 참조 (ADR-001)
- Let Drizzle infer return types via `$inferSelect` / `$inferInsert`
- Let errors bubble up to usecase layer
- Avoid N+1 queries
