# =============================================================================
# 개발(Development) 환경 출력 값
# 이 파일은 Terraform 실행 후 필요한 정보를 출력합니다.
# 애플리케이션 설정 파일(.env)에 사용할 값들을 제공합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# 프로젝트 식별 정보
# -----------------------------------------------------------------------------

output "project_id" {
  description = "Supabase project ID"
  value       = module.supabase.project_id
  # Supabase 프로젝트 고유 ID
  # 사용처: API URL 구성, 대시보드 접근
}

# -----------------------------------------------------------------------------
# 접속 엔드포인트 (애플리케이션에서 사용)
# -----------------------------------------------------------------------------

output "api_url" {
  description = "Supabase API URL"
  value       = module.supabase.api_url
  # Supabase REST API 엔드포인트
  # 예: https://abcdefg.supabase.co
  # 환경변수 설정: NEXT_PUBLIC_SUPABASE_URL=<이 값>
}

output "database_host" {
  description = "Supabase database host"
  value       = module.supabase.database_host
  # PostgreSQL 직접 연결용 호스트 주소
  # 예: db.abcdefg.supabase.co
  # 연결 문자열 예시: postgresql://postgres:[비밀번호]@[이 값]:5432/postgres
}

# -----------------------------------------------------------------------------
# API 인증 키 (애플리케이션 환경변수로 사용)
# -----------------------------------------------------------------------------

output "anon_key" {
  description = "Supabase anonymous key"
  value       = module.supabase.anon_key
  sensitive   = true
  # 클라이언트 애플리케이션용 공개 API 키
  # 환경변수 설정: NEXT_PUBLIC_SUPABASE_ANON_KEY=<이 값>
  # 브라우저에 노출되어도 안전 (RLS 정책으로 보호됨)
  # 확인 방법: terraform output -raw anon_key
}

output "service_role_key" {
  description = "Supabase service role key"
  value       = module.supabase.service_role_key
  sensitive   = true
  # 서버 애플리케이션용 비밀 API 키
  # 환경변수 설정: SUPABASE_SERVICE_ROLE_KEY=<이 값>
  # 경고: 모든 보안 정책을 우회하므로 절대 클라이언트에 노출 금지!
  # 용도: 백엔드 API, 관리자 작업, 데이터 마이그레이션
  # 확인 방법: terraform output -raw service_role_key
}
