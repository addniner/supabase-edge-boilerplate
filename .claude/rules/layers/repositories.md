---
paths:
  - supabase/functions/api/domains/**/*repository*.ts
---

# Repository Layer Rules

## Purpose

Repositories are the **data access layer**. They handle all database operations and nothing else.

## Core Principles

- ✅ **Pure CRUD operations only** - No business logic
- ✅ **Extend BaseRepository** - Inherit common DB functionality
- ✅ **Use Drizzle ORM** - Type-safe database queries
- ❌ **No timestamp conversion** - Leave Date objects as-is (Service layer handles conversion)
- ❌ **No business logic** - No calculations, transformations, or validations

## Template

```typescript
import { BaseRepository } from "@db";
import { myTable } from "@db/schema";
import { eq } from "drizzle-orm";

export class MyRepository extends BaseRepository {
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

- Let Drizzle infer return types via `$inferSelect` / `$inferInsert`
- Let errors bubble up to Service layer
- Avoid N+1 queries
