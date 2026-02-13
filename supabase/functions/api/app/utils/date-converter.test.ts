import { assertEquals, assertThrows } from "@std/assert";
import {
  toISOString,
  toISOStringBulk,
  toISOStringOrNull,
} from "./date-converter.ts";

// =============================================================================
// toISOString
// =============================================================================

Deno.test("toISOString - Date 객체를 ISO 문자열로 변환", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = toISOString(date);

  assertEquals(result, "2024-01-15T10:30:00.000Z");
});

Deno.test("toISOString - ISO 문자열을 정규화", () => {
  // 이미 ISO 형식인 문자열
  const isoString = "2024-01-15T10:30:00.000Z";
  const result = toISOString(isoString);

  assertEquals(result, "2024-01-15T10:30:00.000Z");
});

Deno.test("toISOString - 다양한 날짜 문자열 형식을 ISO로 정규화", () => {
  // 밀리초 없는 ISO 형식
  const withoutMs = "2024-01-15T10:30:00Z";
  assertEquals(toISOString(withoutMs), "2024-01-15T10:30:00.000Z");

  // 타임존 오프셋이 있는 형식
  const withOffset = "2024-01-15T19:30:00+09:00";
  assertEquals(toISOString(withOffset), "2024-01-15T10:30:00.000Z");
});

Deno.test("toISOString - null 입력 시 TypeError 발생", () => {
  assertThrows(
    () => toISOString(null),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

Deno.test("toISOString - undefined 입력 시 TypeError 발생", () => {
  assertThrows(
    () => toISOString(undefined),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

Deno.test("toISOString - 숫자 입력 시 TypeError 발생", () => {
  assertThrows(
    () => toISOString(12345),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

Deno.test("toISOString - 객체 입력 시 TypeError 발생", () => {
  assertThrows(
    () => toISOString({ date: "2024-01-15" }),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

Deno.test("toISOString - 빈 문자열 입력 시 RangeError 발생", () => {
  // 빈 문자열은 Invalid Date가 되어 toISOString() 호출 시 RangeError 발생
  assertThrows(
    () => toISOString(""),
    RangeError,
    "Invalid time value",
  );
});

Deno.test("toISOString - 잘못된 날짜 문자열 입력 시 RangeError 발생", () => {
  assertThrows(
    () => toISOString("not-a-date"),
    RangeError,
    "Invalid time value",
  );
});

// =============================================================================
// toISOStringBulk
// =============================================================================

Deno.test("toISOStringBulk - 여러 Date 객체를 한 번에 변환", () => {
  const dates = [
    new Date("2024-01-15T10:30:00.000Z"),
    new Date("2024-06-20T15:45:00.000Z"),
    new Date("2024-12-31T23:59:59.000Z"),
  ];

  const result = toISOStringBulk(dates);

  assertEquals(result, [
    "2024-01-15T10:30:00.000Z",
    "2024-06-20T15:45:00.000Z",
    "2024-12-31T23:59:59.000Z",
  ]);
});

Deno.test("toISOStringBulk - Date와 문자열 혼합 배열 변환", () => {
  const mixed = [
    new Date("2024-01-15T10:30:00.000Z"),
    "2024-06-20T15:45:00.000Z",
  ];

  const result = toISOStringBulk(mixed);

  assertEquals(result, [
    "2024-01-15T10:30:00.000Z",
    "2024-06-20T15:45:00.000Z",
  ]);
});

Deno.test("toISOStringBulk - 빈 배열 입력 시 빈 배열 반환", () => {
  const result = toISOStringBulk([]);

  assertEquals(result, []);
});

Deno.test("toISOStringBulk - null이 포함된 배열에서 TypeError 발생", () => {
  const withNull = [new Date("2024-01-15T10:30:00.000Z"), null];

  assertThrows(
    () => toISOStringBulk(withNull),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

// =============================================================================
// toISOStringOrNull
// =============================================================================

Deno.test("toISOStringOrNull - Date 객체를 ISO 문자열로 변환", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = toISOStringOrNull(date);

  assertEquals(result, "2024-01-15T10:30:00.000Z");
});

Deno.test("toISOStringOrNull - ISO 문자열을 정규화", () => {
  const isoString = "2024-01-15T10:30:00Z";
  const result = toISOStringOrNull(isoString);

  assertEquals(result, "2024-01-15T10:30:00.000Z");
});

Deno.test("toISOStringOrNull - null 입력 시 null 반환", () => {
  const result = toISOStringOrNull(null);

  assertEquals(result, null);
});

Deno.test("toISOStringOrNull - undefined 입력 시 null 반환", () => {
  const result = toISOStringOrNull(undefined);

  assertEquals(result, null);
});

Deno.test("toISOStringOrNull - 숫자 입력 시 TypeError 발생", () => {
  assertThrows(
    () => toISOStringOrNull(12345),
    TypeError,
    "Cannot convert value to ISO string",
  );
});

// =============================================================================
// 실제 사용 시나리오
// =============================================================================

Deno.test("실제 시나리오 - Postgres 드라이버 Date 객체 변환", () => {
  // Postgres 드라이버가 반환하는 것처럼 Date 객체 시뮬레이션
  const mockDbRow = {
    id: "123",
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-16T12:00:00.000Z"),
    deletedAt: null,
  };

  // API 응답 직렬화
  const response = {
    id: mockDbRow.id,
    createdAt: toISOString(mockDbRow.createdAt),
    updatedAt: toISOString(mockDbRow.updatedAt),
    deletedAt: toISOStringOrNull(mockDbRow.deletedAt),
  };

  assertEquals(response, {
    id: "123",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-16T12:00:00.000Z",
    deletedAt: null,
  });
});

Deno.test("실제 시나리오 - 커서 기반 페이지네이션", () => {
  const asset = {
    id: "asset-123",
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
  };

  // 커서 생성 (timestamp_id 형식)
  const cursor = `${toISOString(asset.createdAt)}_${asset.id}`;

  assertEquals(cursor, "2024-01-15T10:30:00.000Z_asset-123");
});
