/**
 * Pagination Validation Schemas
 *
 * 공통 페이지네이션 스키마
 */

import { z } from "@zod";

/**
 * 기본 페이지네이션 스키마
 *
 * @example
 * ```typescript
 * const MyQuerySchema = PaginationSchema.extend({
 *   status: z.enum(["active", "inactive"]).optional(),
 * });
 * ```
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
