/**
 * Example Validation Schemas
 * Zod 기반 입력 검증
 */

import { z } from "@zod";

/**
 * 기본 페이지네이션 스키마
 */
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * 목록 조회 쿼리 스키마
 */
export const ExampleListQuerySchema = PaginationSchema.extend({
  status: z.enum(["active", "inactive"]).optional(),
  keyword: z.string().max(100).optional(),
});

export type ExampleListQueryInput = z.infer<typeof ExampleListQuerySchema>;

/**
 * 생성 스키마
 */
export const CreateExampleSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100),
  description: z.string().max(500).optional(),
});

export type CreateExampleInput = z.infer<typeof CreateExampleSchema>;

/**
 * 수정 스키마
 */
export const UpdateExampleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateExampleInput = z.infer<typeof UpdateExampleSchema>;
