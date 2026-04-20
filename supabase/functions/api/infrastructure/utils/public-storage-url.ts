import { getConfig } from "@config";
import type { StorageConfig } from "@config";
import { replaceKongWithNgrok } from "./ngrok.ts";

/**
 * Public Storage URL 빌더
 *
 * Supabase Storage의 public 버킷 URL을 생성하는 빌더 클래스.
 * 로컬 환경에서는 자동으로 ngrok URL로 변환됨.
 *
 * @example
 * // 기본 버킷(STORAGE_BUCKET_PUBLIC_RESOURCES) 사용
 * PublicStorageUrl.path("categories/image.svg").build();
 *
 * // 다른 버킷 지정
 * PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS").path(filePath).buildOrNull();
 *
 * // 디렉토리 + 파일명 분리
 * PublicStorageUrl.directory("categories").file("image.svg").build();
 */
export class PublicStorageUrl {
  private _bucket: string;
  private _segments: string[] = [];

  private constructor(
    bucketKey: keyof StorageConfig = "STORAGE_BUCKET_PUBLIC_RESOURCES",
  ) {
    this._bucket = getConfig().storage[bucketKey];
  }

  /**
   * 다른 버킷 지정 (기본값: STORAGE_BUCKET_PUBLIC_RESOURCES)
   */
  static bucket(bucketKey: keyof StorageConfig): PublicStorageUrl {
    return new PublicStorageUrl(bucketKey);
  }

  /**
   * 전체 경로 설정 (기본 버킷 사용)
   */
  static path(fullPath: string | null): PublicStorageUrl {
    return new PublicStorageUrl().path(fullPath);
  }

  /**
   * 디렉토리 설정 (기본 버킷 사용)
   */
  static directory(dir: string | null): PublicStorageUrl {
    return new PublicStorageUrl().directory(dir);
  }

  /**
   * 전체 경로 설정
   */
  path(fullPath: string | null): PublicStorageUrl {
    this._segments = fullPath ? [fullPath] : [];
    return this;
  }

  /**
   * 디렉토리 추가
   */
  directory(dir: string | null): PublicStorageUrl {
    if (dir) this._segments.push(dir);
    return this;
  }

  /**
   * 파일명 추가
   */
  file(fileName: string | null): PublicStorageUrl {
    if (fileName) this._segments.push(fileName);
    return this;
  }

  /**
   * URL 생성 (항상 string 반환)
   * segments가 비어있어도 URL 생성됨
   */
  build(): string {
    const supabaseUrl = getConfig().supabase.SUPABASE_URL.replace(/\/$/, "");
    const fullPath = this._segments.join("/");
    const url =
      `${supabaseUrl}/storage/v1/object/public/${this._bucket}/${fullPath}`;
    return replaceKongWithNgrok(url);
  }

  /**
   * URL 생성 (segments가 비어있거나 null 포함 시 null 반환)
   * nullable 경로를 안전하게 처리할 때 사용
   */
  buildOrNull(): string | null {
    if (this._segments.length === 0 || this._segments.some((s) => !s)) {
      return null;
    }
    return this.build();
  }
}
