// 이미지 업로드 관련 비즈니스 로직
import { getServiceRoleClient } from "./supabase.client.ts";
import type {
  SignedUploadUrlData,
  SupabaseCreateSignedUrlData,
  UploadFileInfo,
} from "@types";
import { InternalServerError } from "@app/errors";
import { isLocal } from "@app/config";
import { Logger, replaceKongWithNgrok } from "@app/utils";

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

interface SupabaseStorageServiceProps {
  bucketName: string;
  signedUrlDefaultTimeoutSec: number;
}
/**
 * SupabaseStorageService - Supabase Storage 서비스
 */
export class SupabaseStorageClient {
  private readonly STORAGE_BUCKET_NAME: string;
  private readonly SIGNED_URL_DEFAULT_TIMEOUT_SEC: number;

  constructor(props: SupabaseStorageServiceProps) {
    this.STORAGE_BUCKET_NAME = props.bucketName;
    this.SIGNED_URL_DEFAULT_TIMEOUT_SEC = props.signedUrlDefaultTimeoutSec ??
      60 * 15; // 15분
  }

  /**
   * 업로드 Presigned URLs 생성 (배치)
   *
   * @param files - 업로드할 파일 정보 목록 (path 포함)
   * @returns 업로드 URL 데이터 목록
   */
  async generateSignedUploadUrls(
    files: UploadFileInfo[],
  ): Promise<SignedUploadUrlData[]> {
    const supabase = getServiceRoleClient();

    const promises = files.map(async (file) => {
      // Signed Upload URL 생성
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET_NAME)
        .createSignedUploadUrl(file.path);

      if (error || !data) {
        const message = error?.message || "Unknown error";
        throw new InternalServerError(
          `Failed to create signed upload URL: ${message}`,
        );
      }

      return {
        fileKey: file.fileKey,
        ...data,
      };
    });

    const results = await Promise.all(promises);

    // kong:8000 -> localhost:54321 (로컬 개발 환경용)
    if (isLocal()) {
      return results.map((item) => ({
        ...item,
        signedUrl: item.signedUrl?.replace(
          "kong:8000",
          "127.0.0.1:54321",
        ) ?? "",
      }));
    }

    return results;
  }

  /**
   * 다운로드 Presigned URLs 생성 (배치)
   *
   * @param paths - 파일 경로 목록
   * @param timeoutSec - URL 만료 시간 (초)
   * @returns 다운로드 URL 데이터 목록
   */
  async generateSignedUrls(
    paths: string[],
    timeoutSec?: number,
  ): Promise<SupabaseCreateSignedUrlData[]> {
    const supabase = getServiceRoleClient();

    Logger.debug("[generateSignedUrls] Input paths:", paths);

    const { data, error } = await supabase.storage
      .from(this.STORAGE_BUCKET_NAME)
      .createSignedUrls(
        paths,
        timeoutSec ?? this.SIGNED_URL_DEFAULT_TIMEOUT_SEC,
      );

    Logger.debug("[generateSignedUrls] Response data:", data);
    Logger.debug("[generateSignedUrls] Response error:", error);

    if (error || !data) {
      const message = error?.message || "Unknown error";
      throw new InternalServerError(`Failed to create signed URLs: ${message}`);
    }

    // kong:8000 -> ngrok free domain (로컬 개발 환경용)
    if (isLocal()) {
      return data.map((item) => ({
        ...item,
        signedUrl: replaceKongWithNgrok(item.signedUrl),
      }));
    }

    return data;
  }

  /**
   * 이미지 변환 옵션과 함께 다운로드 Presigned URLs 생성
   * createSignedUrl을 개별 호출하므로 배치보다 느림 (Pro Plan 필요)
   *
   * @param paths - 파일 경로 목록
   * @param transform - 이미지 변환 옵션
   * @param timeoutSec - URL 만료 시간 (초)
   * @returns 다운로드 URL 데이터 목록
   */
  async generateSignedUrlsWithTransform(
    paths: string[],
    transform: TransformOptions,
    timeoutSec?: number,
  ): Promise<SupabaseCreateSignedUrlData[]> {
    const supabase = getServiceRoleClient();

    const promises = paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET_NAME)
        .createSignedUrl(
          path,
          timeoutSec ?? this.SIGNED_URL_DEFAULT_TIMEOUT_SEC,
          { transform },
        );

      if (error || !data) {
        return { path, error: error?.message ?? null, signedUrl: "" };
      }

      return { path, error: null, signedUrl: data.signedUrl };
    });

    const results = await Promise.all(promises);

    // kong:8000 -> ngrok free domain (로컬 개발 환경용)
    if (isLocal()) {
      return results.map((item) => ({
        ...item,
        signedUrl: replaceKongWithNgrok(item.signedUrl),
      }));
    }

    return results;
  }

  /**
   * Base64 이미지를 스토리지에 업로드
   *
   * @param base64Data - Base64 인코딩된 이미지 데이터
   * @param path - 저장할 경로 (예: "userId/generated/imageId_timestamp.png")
   * @param signedUrlTimeoutSec - Signed URL 만료 시간 (초), 기본값: 설정된 timeout
   * @returns 업로드된 파일의 signed URL
   */
  async uploadBase64Image(
    base64Data: string,
    path: string,
    signedUrlTimeoutSec?: number,
  ): Promise<string>;

  /**
   * 바이너리 이미지 데이터를 스토리지에 업로드
   *
   * @param binaryData - 바이너리 이미지 데이터
   * @param path - 저장할 경로 (예: "userId/generated/imageId_timestamp.png")
   * @param signedUrlTimeoutSec - Signed URL 만료 시간 (초), 기본값: 설정된 timeout
   * @returns 업로드된 파일의 signed URL
   */
  async uploadBase64Image(
    binaryData: Uint8Array,
    path: string,
    signedUrlTimeoutSec?: number,
  ): Promise<string>;

  async uploadBase64Image(
    data: string | Uint8Array,
    path: string,
    signedUrlTimeoutSec?: number,
  ): Promise<string> {
    const supabase = getServiceRoleClient();

    // Base64 문자열인 경우 디코딩, 이미 바이너리면 그대로 사용
    const binaryData = typeof data === "string"
      ? Uint8Array.from(
        atob(data),
        (c) => c.charCodeAt(0),
      )
      : data;

    // 파일 업로드 (경로는 sanitize하지 않음)
    const { data: uploadResult, error } = await supabase.storage
      .from(this.STORAGE_BUCKET_NAME)
      .upload(path, binaryData, {
        contentType: "image/png",
        upsert: false,
      });

    if (error || !uploadResult) {
      const message = error?.message || "Unknown error";
      throw new InternalServerError(
        `Failed to upload image: ${message}`,
      );
    }

    // Signed URL 생성
    const signedUrls = await this.generateSignedUrls(
      [uploadResult.path],
      signedUrlTimeoutSec,
    );

    if (!signedUrls[0]?.signedUrl) {
      throw new InternalServerError("Failed to generate signed URL");
    }

    if (isLocal()) {
      return replaceKongWithNgrok(signedUrls[0].signedUrl);
    }

    return signedUrls[0].signedUrl;
  }

  /**
   * 바이너리 이미지 데이터를 스토리지에 업로드 (contentType 지정 가능)
   *
   * @param binaryData - 바이너리 이미지 데이터 (Uint8Array 또는 ArrayBuffer)
   * @param path - 저장할 경로
   * @param contentType - 이미지 MIME 타입 (예: "image/webp")
   * @param options - 추가 옵션 (upsert 등)
   * @returns 업로드된 파일의 경로
   */
  async uploadImage(
    binaryData: Uint8Array | ArrayBuffer,
    path: string,
    contentType: string,
    options?: { upsert?: boolean },
  ): Promise<string> {
    const supabase = getServiceRoleClient();

    const data = binaryData instanceof ArrayBuffer
      ? new Uint8Array(binaryData)
      : binaryData;

    const { data: uploadResult, error } = await supabase.storage
      .from(this.STORAGE_BUCKET_NAME)
      .upload(path, data, {
        contentType,
        upsert: options?.upsert ?? false,
      });

    if (error || !uploadResult) {
      const message = error?.message || "Unknown error";
      throw new InternalServerError(`Failed to upload image: ${message}`);
    }

    return uploadResult.path;
  }

  /**
   * 파일명 sanitization
   * - 경로 조작 문자 제거 (/, \, ..)
   * - 특수문자를 안전한 문자로 변경
   *
   * @param fileName - 원본 파일명
   * @returns 안전한 파일명
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[\/\\]/g, "_") // 경로 구분자 제거
      .replace(/\.\./g, "_") // 상위 경로 참조 제거
      .replace(/[^\w.-]/g, "_"); // 영숫자, 언더스코어, 점, 하이픈만 허용
  }
}
