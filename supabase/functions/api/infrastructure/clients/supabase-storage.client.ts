/**
 * SupabaseStorageClient — 순수 Supabase Storage SDK wrapper
 *
 * Gateway 인터페이스를 모름. 도메인 변환은 SupabaseStorageAdapter가 담당.
 */

import { getServiceRoleClient } from "./supabase.client.ts";
import type {
  SignedUploadUrlData,
  SupabaseCreateSignedUrlData,
  UploadFileInfo,
} from "./supabase-storage.types.ts";
import { InternalServerError } from "@domain/exceptions";
import { isLocal } from "@config";
import { Logger } from "@logger";
import { replaceKongWithNgrok } from "@infrastructure/utils";

interface SupabaseStorageClientProps {
  bucketName: string;
  signedUrlDefaultTimeoutSec?: number;
}

export class SupabaseStorageClient {
  private readonly bucketName: string;
  private readonly signedUrlDefaultTimeoutSec: number;

  constructor(props: SupabaseStorageClientProps) {
    this.bucketName = props.bucketName;
    this.signedUrlDefaultTimeoutSec = props.signedUrlDefaultTimeoutSec ??
      60 * 15;
  }

  async createSignedUploadUrls(
    files: UploadFileInfo[],
  ): Promise<SignedUploadUrlData[]> {
    const supabase = getServiceRoleClient();

    const promises = files.map(async (file) => {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
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

  async createSignedDownloadUrls(
    paths: string[],
    timeoutSec?: number,
  ): Promise<SupabaseCreateSignedUrlData[]> {
    const supabase = getServiceRoleClient();

    Logger.debug(
      "[SupabaseStorageClient] createSignedDownloadUrls paths:",
      paths,
    );

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrls(
        paths,
        timeoutSec ?? this.signedUrlDefaultTimeoutSec,
      );

    if (error || !data) {
      const message = error?.message || "Unknown error";
      throw new InternalServerError(
        `Failed to create signed URLs: ${message}`,
      );
    }

    // supabase-js 는 error 아이템의 signedUrl 을 null 로 내려준다. 도메인 타입은
    // string 을 요구하므로 null → "" 로 normalize — downstream 은 이미
    // falsy 체크로 에러 아이템을 거르고 있어 시맨틱 동일.
    if (isLocal()) {
      return data.map((item) => ({
        ...item,
        signedUrl: replaceKongWithNgrok(item.signedUrl) ?? "",
      }));
    }

    return data.map((item) => ({ ...item, signedUrl: item.signedUrl ?? "" }));
  }

  async createSignedDownloadUrlsWithTransform(
    paths: string[],
    transform: {
      width?: number;
      height?: number;
      quality?: number;
      resize?: "cover" | "contain" | "fill";
    },
    timeoutSec?: number,
  ): Promise<SupabaseCreateSignedUrlData[]> {
    const supabase = getServiceRoleClient();

    const promises = paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(
          path,
          timeoutSec ?? this.signedUrlDefaultTimeoutSec,
          { transform },
        );

      if (error || !data) {
        return { path, error: error?.message ?? null, signedUrl: "" };
      }

      return { path, error: null, signedUrl: data.signedUrl };
    });

    const results = await Promise.all(promises);

    if (isLocal()) {
      return results.map((item) => ({
        ...item,
        signedUrl: replaceKongWithNgrok(item.signedUrl),
      }));
    }

    return results;
  }

  async uploadBase64(
    data: string | Uint8Array,
    path: string,
    signedUrlTimeoutSec?: number,
  ): Promise<string> {
    const supabase = getServiceRoleClient();

    const binaryData = typeof data === "string"
      ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
      : data;

    const { data: uploadResult, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, binaryData, {
        contentType: "image/png",
        upsert: false,
      });

    if (error || !uploadResult) {
      const message = error?.message || "Unknown error";
      throw new InternalServerError(`Failed to upload image: ${message}`);
    }

    const signedUrls = await this.createSignedDownloadUrls(
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

  async uploadFile(
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
      .from(this.bucketName)
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

  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[\/\\]/g, "_")
      .replace(/\.\./g, "_")
      .replace(/[^\w.-]/g, "_");
  }
}
