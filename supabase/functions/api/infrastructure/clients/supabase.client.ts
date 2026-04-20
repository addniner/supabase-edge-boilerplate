// Supabase 클라이언트 팩토리
import { createClient } from "@supabase-js";
import type { SupabaseClient } from "@supabase-js";
import { getConfig } from "@config";

/**
 * 캐싱된 클라이언트 인스턴스들
 */
let serviceRoleClientCache: SupabaseClient | null = null;
let publicClientCache: SupabaseClient | null = null;

/**
 * Service Role 클라이언트 생성 (캐싱됨)
 * RLS를 우회하는 모든 권한을 가진 클라이언트
 *
 * 용도:
 * - createSignedUploadUrl 등 RLS 우회가 필요한 Storage 작업
 * - 서버 간 내부 작업
 */
export function getServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClientCache) {
    const env = getConfig();
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env.supabase;

    serviceRoleClientCache = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return serviceRoleClientCache;
}
/**
 * 인증된 사용자용 Supabase 클라이언트 생성
 * JWT 토큰을 사용하여 사용자별 접근을 제공합니다
 */
export function createAuthSupabaseClient(authToken: string) {
  const env = getConfig();
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env.supabase;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });
}

/**
 * 익명/공개 사용자용 클라이언트 생성 (캐싱됨)
 * 익명 키(anon_key)를 사용합니다.
 * 로그인하지 않은 사용자의 관점에서 RLS 규칙을 그대로 따릅니다.
 * 인증이 필요 없는 Public 라우트에서 사용하기에 가장 안전합니다.
 */
export function getPublicClient(): SupabaseClient {
  if (!publicClientCache) {
    const env = getConfig();
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env.supabase;

    publicClientCache = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return publicClientCache;
}
