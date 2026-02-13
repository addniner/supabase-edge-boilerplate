# =============================================================================
# 프로덕션(Production) 환경 출력 값
# 이 파일은 Terraform 실행 후 필요한 정보를 출력합니다.
# 프로덕션 애플리케이션 설정 파일(.env.production)에 사용할 값들을 제공합니다.
# ⚠️ 민감한 정보가 포함되어 있으므로 출력 값 관리에 주의하세요!
# =============================================================================

# -----------------------------------------------------------------------------
# 프로젝트 식별 정보
# -----------------------------------------------------------------------------

output "project_id" {
  description = "Supabase project ID"
  value       = module.supabase.project_id
  # Supabase 프로젝트 고유 ID (프로덕션)
  # 사용처: API URL 구성, 대시보드 접근
  # 대시보드 URL: https://supabase.com/dashboard/project/[이 값]
}

# -----------------------------------------------------------------------------
# 접속 엔드포인트 (프로덕션 애플리케이션에서 사용)
# -----------------------------------------------------------------------------

output "api_url" {
  description = "Supabase API URL"
  value       = module.supabase.api_url
  # Supabase REST API 엔드포인트 (프로덕션)
  # 예: https://abcdefg.supabase.co
  # 환경변수 설정: NEXT_PUBLIC_SUPABASE_URL=<이 값>
  # 또는: VITE_SUPABASE_URL=<이 값> (Vite 사용 시)
}

output "database_host" {
  description = "Supabase database host"
  value       = module.supabase.database_host
  # PostgreSQL 직접 연결용 호스트 주소 (프로덕션)
  # 예: db.abcdefg.supabase.co
  # 연결 문자열 예시: postgresql://postgres:[비밀번호]@[이 값]:5432/postgres
  # 주의: 프로덕션 DB 직접 접근은 최소한으로 제한 (읽기 전용 권장)
}

# -----------------------------------------------------------------------------
# API 인증 키 (프로덕션 애플리케이션 환경변수로 사용)
# -----------------------------------------------------------------------------

output "anon_key" {
  description = "Supabase anonymous key"
  value       = module.supabase.anon_key
  sensitive   = true
  # 클라이언트 애플리케이션용 공개 API 키 (프로덕션)
  # 환경변수 설정: NEXT_PUBLIC_SUPABASE_ANON_KEY=<이 값>
  # 또는: VITE_SUPABASE_ANON_KEY=<이 값> (Vite 사용 시)
  # 브라우저에 노출되어도 안전 (RLS 정책으로 보호됨)
  # 확인 방법: terraform output -raw anon_key
  # CI/CD 파이프라인에서 자동으로 주입 권장
}

output "service_role_key" {
  description = "Supabase service role key"
  value       = module.supabase.service_role_key
  sensitive   = true
  # 서버 애플리케이션용 비밀 API 키 (프로덕션)
  # 환경변수 설정: SUPABASE_SERVICE_ROLE_KEY=<이 값>
  # ⚠️ 최고 수준 보안 주의사항 ⚠️
  # - 모든 보안 정책을 우회하는 관리자 권한
  # - 절대 클라이언트 코드에 포함 금지
  # - 절대 공개 저장소에 커밋 금지
  # - 서버 환경변수나 Secret Manager에만 저장
  # 용도: 백엔드 API, 관리자 작업, 데이터 마이그레이션, 서버사이드 렌더링
  # 확인 방법: terraform output -raw service_role_key
  # 접근 제한: 최소 권한 원칙 적용 (꼭 필요한 서비스만 접근)
}
