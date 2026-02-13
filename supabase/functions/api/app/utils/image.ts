/**
 * Base64 이미지에서 사이즈 추출 유틸리티
 * image-size 라이브러리를 사용하여 다양한 이미지 포맷 지원
 *
 * **지원 포맷:**
 * BMP, CUR, DDS, GIF, HEIC (HEIF, AVCI, AVIF), ICNS, ICO, J2C,
 * JPEG-2000 (JP2), JPEG, JPEG-XL, KTX (1 and 2), PNG,
 * PNM (PAM, PBM, PFM, PGM, PPM), PSD, SVG, TGA, TIFF, WebP
 *
 * **특징:**
 * - Zero dependencies
 * - Minimal memory footprint (헤더만 읽음)
 * - Buffer/Uint8Array 모두 지원
 *
 * **참고:**
 * Supabase Edge Functions(Deno) 환경에서는 파일 경로가 아닌
 * Buffer/Uint8Array를 직접 사용해야 합니다.
 *
 * @see https://github.com/image-size/image-size
 */

import { imageSize } from "@image-size";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Base64 문자열을 바이너리 데이터로 디코딩
 *
 * @param base64Data - Base64 인코딩된 데이터 (data:image/png;base64, 접두사 제거 필요)
 * @returns 디코딩된 바이너리 데이터
 */
export function decodeBase64ToBinary(base64Data: string): Uint8Array {
  // data:image/png;base64, 접두사 제거
  const base64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  // Base64 디코딩
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Base64 인코딩된 이미지에서 width/height 추출
 * image-size 라이브러리를 사용하여 다양한 포맷 지원 (PNG, JPEG, WebP, GIF, TIFF 등)
 *
 * @param base64Data - Base64 인코딩된 이미지 데이터 (data:image/png;base64, 접두사 제거 필요)
 * @returns 이미지 사이즈 또는 null (파싱 실패 시)
 */
export function extractImageDimensions(
  base64Data: string,
): ImageDimensions | null;

/**
 * 바이너리 이미지 데이터에서 width/height 추출
 * image-size 라이브러리를 사용하여 다양한 포맷 지원 (PNG, JPEG, WebP, GIF, TIFF 등)
 *
 * @param binaryData - 바이너리 이미지 데이터
 * @returns 이미지 사이즈 또는 null (파싱 실패 시)
 */
export function extractImageDimensions(
  binaryData: Uint8Array,
): ImageDimensions | null;

export function extractImageDimensions(
  data: string | Uint8Array,
): ImageDimensions | null {
  try {
    // Base64 문자열인 경우 디코딩
    const bytes = typeof data === "string" ? decodeBase64ToBinary(data) : data;

    // image-size 라이브러리 사용
    // 공식 문서: "Passing in a Buffer/Uint8Array"
    // Best for streams, network requests, or when you already have the image data in memory.
    // Buffer와 Uint8Array 모두 지원하므로 Supabase Edge Functions 환경에서 Uint8Array 직접 사용 가능
    const result = imageSize(bytes);

    // imageSize 반환 타입: { width?: number; height?: number; type?: string; orientation?: number } | undefined
    if (
      result &&
      typeof result.width === "number" &&
      typeof result.height === "number" &&
      result.width > 0 &&
      result.height > 0
    ) {
      return {
        width: result.width,
        height: result.height,
      };
    }

    return null;
  } catch (_error) {
    return null;
  }
}
