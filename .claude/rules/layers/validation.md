---
paths:
  - supabase/functions/api/domains/**/*schema*.ts
  - supabase/functions/api/shared/validation/**/*.ts
---

# Validation Rules

## Core Principles

- ✅ **Validate all inputs** - Every endpoint must validate request data
- ✅ **Use Zod schemas** - Type-safe runtime validation
- ✅ **Korean error messages** - User-facing errors in Korean
- ✅ **Always use `.strict()`** - Reject unknown fields
- ❌ **No business logic** - Pure data structure validation only
- ❌ **No async validation** - No database checks in schemas

## Pattern

```typescript
import { z } from "@zod";

export const CreateItemSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  status: z.enum(["active", "inactive"]),
  count: z.number().int().min(1),
}).strict();

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
```

## Important Notes

- Export both schema and type: `export const Schema` + `export type Type`
- Use string literals for TEXT columns (not TypeScript enums)
- Use `zValidator`/`getValidated` in routes, not direct Zod parse
