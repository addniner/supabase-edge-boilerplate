# =============================================================================
# 개발(Development) 환경 입력 변수
# 이 파일은 개발 환경에서 필요한 변수들을 정의합니다.
# 실제 값은 terraform.tfvars 파일에 설정합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# 인증 관련 민감 정보
# -----------------------------------------------------------------------------

variable "supabase_access_token" {
  description = "Supabase access token for API authentication"
  type        = string
  sensitive   = true
  # Supabase Management API 인증 토큰
  # 발급 경로: https://supabase.com/dashboard/account/tokens
  # 권한: 프로젝트 생성/수정/삭제 가능
  # 보안: terraform.tfvars에 저장, 절대 git에 커밋하지 말 것
}

# -----------------------------------------------------------------------------
# Supabase 조직 및 프로젝트 설정
# -----------------------------------------------------------------------------

variable "organization_id" {
  description = "Supabase organization ID"
  type        = string
  # Supabase 조직의 고유 식별자
  # 확인 방법: Supabase 대시보드 > Organization Settings에서 확인
  # 형식: 일반적으로 UUID 형식의 문자열
}

variable "database_password" {
  description = "Database password for the Supabase project"
  type        = string
  sensitive   = true
  # PostgreSQL 데이터베이스의 postgres 사용자 비밀번호
  # 요구사항: 최소 8자 이상, 영문/숫자/특수문자 조합 권장
  # 용도: 직접 DB 연결 시 사용 (일반적으로 API 키를 더 많이 사용)
}

# -----------------------------------------------------------------------------
# Google OAuth 설정
# -----------------------------------------------------------------------------

variable "external_google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "external_google_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = ""
  sensitive   = true
}
