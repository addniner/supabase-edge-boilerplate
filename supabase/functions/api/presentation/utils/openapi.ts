/**
 * OpenAPI 응답 스키마 헬퍼
 * createRoute의 responses 정의에서 사용
 */

import { z } from "@zod";

/** SuccessEnvelope Zod 스키마 생성 */
function successEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    isSuccess: z.literal(true),
    code: z.string(),
    message: z.string(),
    data: dataSchema,
    errors: z.null(),
  });
}

/** OpenAPI 스키마 빌더 */
export const oas = {
  /** 200 OK */
  ok<T extends z.ZodType>(dataSchema: T, description = "성공") {
    return {
      200: {
        description,
        content: {
          "application/json": {
            schema: successEnvelope(dataSchema),
          },
        },
      },
    } as const;
  },

  /** path params */
  params<T extends z.ZodType>(schema: T) {
    return { params: schema } as const;
  },

  /** query params */
  query<T extends z.ZodType>(schema: T) {
    return { query: schema } as const;
  },

  /** JSON request body */
  jsonBody<T extends z.ZodType>(schema: T) {
    return {
      body: {
        content: {
          "application/json": {
            schema,
          },
        },
      },
    } as const;
  },

  /** multipart/form-data request body */
  formBody<T extends z.ZodType>(schema: T) {
    return {
      body: {
        content: {
          "multipart/form-data": {
            schema,
          },
        },
      },
    } as const;
  },

  /** 201 Created */
  created<T extends z.ZodType>(dataSchema: T, description = "생성 성공") {
    return {
      201: {
        description,
        content: {
          "application/json": {
            schema: successEnvelope(dataSchema),
          },
        },
      },
    } as const;
  },
};
