/**
 * Zod Validation Middleware
 *
 * 직접 구현하여 ValidationError와 통합
 */

import type { Context, Next } from "@hono";
import type { z, ZodSchema } from "@zod";
import { ValidationError } from "@app/errors";

type ValidationTarget = "json" | "query" | "param";

// Context Variables에 validated 데이터를 저장하기 위한 키
const VALIDATED_KEY = "validated";

/**
 * Zod Validator Middleware
 *
 * 검증 실패 시 ValidationError를 throw하여 일관된 에러 응답 반환
 * 검증 성공 시 c.get("validated")로 데이터 접근 가능
 *
 * @example
 * ```typescript
 * import { zValidator, getValidated } from "@app/middleware";
 * import { UpdateSettingsSchema, type UpdateSettingsInput } from "./settings.schema.ts";
 *
 * settingsRoute.put("/",
 *   zValidator("json", UpdateSettingsSchema),
 *   async (c) => {
 *     const data = getValidated<UpdateSettingsInput>(c);
 *     // data는 검증된 타입
 *   }
 * );
 * ```
 */
export function zValidator<T extends ZodSchema>(
  target: ValidationTarget,
  schema: T,
) {
  return async (c: Context, next: Next) => {
    let data: unknown;

    switch (target) {
      case "json":
        data = await c.req.json();
        break;
      case "query":
        data = c.req.query();
        break;
      case "param":
        data = c.req.param();
        break;
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      throw new ValidationError(
        target === "query"
          ? "쿼리 파라미터 검증에 실패했습니다"
          : "입력값 검증에 실패했습니다",
        result.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join("."),
          reason: e.message,
        })),
      );
    }

    c.set(VALIDATED_KEY, result.data);
    await next();
  };
}

/**
 * Get validated data from context
 */
export function getValidated<T>(c: { get: (key: string) => unknown }): T {
  return c.get(VALIDATED_KEY) as T;
}

/**
 * Validated data type helper
 */
export type ValidatedData<T extends ZodSchema> = z.infer<T>;
