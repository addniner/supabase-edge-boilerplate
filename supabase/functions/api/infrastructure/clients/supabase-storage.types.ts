// 이미지 업로드 관련 타입 정의

// ============================================================
// 요청 타입
// ============================================================

/**
 * 업로드 파일 정보 (요청)
 */
export interface UploadFileInfo {
  fileKey: string;
  fileName: string;
  contentType: string;
  path: string;
}

// ============================================================
// 응답 타입
// ============================================================

export interface SignedUploadUrlData extends SupabaseCreateSignedUploadUrlData {
  fileKey: string;
}

export interface SignedDownloadUrlDataWithKey
  extends SupabaseCreateSignedUrlData {
  fileKey: string;
}
// ============================================================
// Supabase Storage API - Create Signed Upload URL
// ============================================================
export interface SupabaseCreateSignedUploadUrlResponse {
  data: SupabaseCreateSignedUploadUrlData;
  error: unknown; // 알 수 없는 객체
}

export interface SupabaseCreateSignedUploadUrlData {
  path: string;
  signedUrl: string;
  token: string;
}

// ============================================================
// Supabase Storage API - Create Signed URLs
// ============================================================
export interface SupabaseCreateSignedUrlsResponse {
  data: SupabaseCreateSignedUrlData[];
  error: string | null;
}

export interface SupabaseCreateSignedUrlData {
  error: string | null;
  path: string | null;
  signedUrl: string;
}
