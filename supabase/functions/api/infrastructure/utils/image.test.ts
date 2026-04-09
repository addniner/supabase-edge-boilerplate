import "@test";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { decodeBase64ToBinary, extractImageDimensions } from "./image.ts";

// 최소 1x1 픽셀 PNG (base64)
const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// =============================================================================
// decodeBase64ToBinary
// =============================================================================

Deno.test("decodeBase64ToBinary - 순수 Base64 문자열 디코딩", () => {
  const result = decodeBase64ToBinary(PIXEL_PNG_BASE64);

  assertInstanceOf(result, Uint8Array);
  // PNG 시그니처 확인: 첫 4바이트 = 0x89 0x50 0x4E 0x47 (\x89PNG)
  assertEquals(result[0], 0x89);
  assertEquals(result[1], 0x50); // P
  assertEquals(result[2], 0x4E); // N
  assertEquals(result[3], 0x47); // G
});

Deno.test("decodeBase64ToBinary - data:image/png;base64, 접두사 포함 시 접두사 제거 후 디코딩", () => {
  const dataUrl = `data:image/png;base64,${PIXEL_PNG_BASE64}`;
  const result = decodeBase64ToBinary(dataUrl);

  assertInstanceOf(result, Uint8Array);
  assertEquals(result[0], 0x89);
  assertEquals(result[1], 0x50);
  assertEquals(result[2], 0x4E);
  assertEquals(result[3], 0x47);
});

Deno.test("decodeBase64ToBinary - 빈 문자열 -> 빈 Uint8Array", () => {
  const result = decodeBase64ToBinary("");

  assertInstanceOf(result, Uint8Array);
  assertEquals(result.length, 0);
});

// =============================================================================
// extractImageDimensions
// =============================================================================

Deno.test("extractImageDimensions - 유효한 PNG 바이너리 -> width/height 반환", () => {
  const bytes = decodeBase64ToBinary(PIXEL_PNG_BASE64);
  const result = extractImageDimensions(bytes);

  assertEquals(result, { width: 1, height: 1 });
});

Deno.test("extractImageDimensions - 유효한 PNG Base64 문자열 -> width/height 반환", () => {
  const result = extractImageDimensions(PIXEL_PNG_BASE64);

  assertEquals(result, { width: 1, height: 1 });
});

Deno.test("extractImageDimensions - 잘못된 데이터 -> null 반환", () => {
  const result = extractImageDimensions("not-valid-image-data");

  assertEquals(result, null);
});

Deno.test("extractImageDimensions - 빈 Uint8Array -> null 반환", () => {
  const result = extractImageDimensions(new Uint8Array(0));

  assertEquals(result, null);
});
