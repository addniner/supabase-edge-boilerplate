/**
 * Example Validation Schemas
 * Zod 기반 입력 검증 + OpenAPI 문서
 */

import { z } from "@zod";

export const ExampleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export const CreateExampleSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100),
  description: z.string().max(500).optional(),
});
