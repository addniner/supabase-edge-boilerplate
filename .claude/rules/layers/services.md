---
paths:
  - supabase/functions/api/domains/**/*service*.ts
---

# Service Layer Rules

## Purpose

Services contain **business logic** and orchestrate operations across multiple repositories.

## Core Principles

- ✅ **Business logic only** - No HTTP handling, no direct database queries
- ✅ **Orchestration** - Can use multiple repositories
- ✅ **Dependency Injection** - Constructor injection for testability
- ✅ **Timestamp conversion** - Responsible for converting Date → ISO string
- ❌ **No HTTP concerns** - No request/response handling
- ❌ **No direct DB access** - Always use repositories

## Template

```typescript
import { toISOString } from "@app/utils";
import { NotFoundError } from "@app/errors";
import { MyRepository } from "./my.repository.ts";

export class MyService {
  constructor(private myRepo = new MyRepository()) {}

  async getByUserId(userId: string) {
    const entity = await this.myRepo.findByUserId(userId);
    if (!entity) throw new NotFoundError("데이터를 찾을 수 없습니다");
    return {
      ...entity,
      createdAt: toISOString(entity.createdAt),
    };
  }
}
```

## Important Notes

- **Always convert timestamps** before returning to routes
- **Use DI** for all repository dependencies
- **Throw specific errors** from `@app/errors`
