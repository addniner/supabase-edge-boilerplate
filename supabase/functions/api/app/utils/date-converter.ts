/**
 * 날짜 변환 유틸리티
 *
 * Postgres 드라이버는 timestamp를 Date 객체로 반환하지만,
 * Supabase 타입 정의는 string으로 되어 있음.
 *
 * 이 유틸리티는 런타임 Date 객체를 ISO 8601 문자열로 안전하게 변환함.
 */

/**
 * Postgres 드라이버가 반환한 timestamp 값을 ISO 8601 문자열로 변환
 *
 * @param value - Date 객체, ISO 문자열, 또는 unknown 타입
 * @returns ISO 8601 형식의 문자열 (YYYY-MM-DDTHH:mm:ss.sssZ)
 *
 * @example
 * ```typescript
 * const asset = await db.selectFrom("assets").selectAll().executeTakeFirst();
 * const isoString = toISOString(asset.createdAt); // "2024-01-15T10:30:00.000Z"
 * ```
 */
export function toISOString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    // 이미 ISO 문자열이면 Date로 파싱 후 다시 toISOString (정규화)
    return new Date(value).toISOString();
  }

  // 예외 케이스: null, undefined 등
  throw new TypeError(
    `Cannot convert value to ISO string: ${value} (type: ${typeof value})`,
  );
}

/**
 * 여러 timestamp 값을 한 번에 변환
 *
 * @example
 * ```typescript
 * const timestamps = toISOStringBulk([asset1.createdAt, asset2.createdAt]);
 * ```
 */
export function toISOStringBulk(values: unknown[]): string[] {
  return values.map(toISOString);
}

/**
 * Nullable timestamp를 안전하게 변환
 *
 * @example
 * ```typescript
 * const deletedAt = toISOStringOrNull(asset.deletedAt); // null 또는 ISO 문자열
 * ```
 */
export function toISOStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toISOString(value);
}
