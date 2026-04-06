# =============================================================================
# Supabase 모듈 입력 변수 정의
# 이 파일은 Supabase 모듈을 사용할 때 필요한 모든 입력 변수를 정의합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform 문법 기초
# -----------------------------------------------------------------------------
# variable 블록: 모듈이나 환경 설정에서 사용할 입력 변수를 정의
#
# 기본 구조:
# variable "변수명" {
#   description = "변수 설명"           # 이 변수가 무엇인지 설명 (선택사항)
#   type        = 타입                 # string, number, bool, list, map 등
#   default     = 기본값               # 값을 제공하지 않을 때 사용될 기본값 (선택사항)
#   sensitive   = true/false           # 로그에 출력 여부 (민감정보는 true)
# }
#
# 변수 사용법: var.변수명
# 예: var.organization_id

# -----------------------------------------------------------------------------
# 필수 변수: 반드시 값을 제공해야 하는 변수들
# (default 값이 없으므로 terraform.tfvars나 -var 옵션으로 반드시 값 지정 필요)
# -----------------------------------------------------------------------------

variable "organization_id" {
  description = "Supabase organization ID"
  type        = string # 문자열 타입 (예: "abc-123-def")
  # Supabase 조직 ID
  # Supabase 대시보드(https://supabase.com/dashboard)에서 확인 가능
}

variable "project_name" {
  description = "Name of the Supabase project"
  type        = string
  # Supabase 프로젝트 이름
  # 예: "my-project-dev", "my-project-prod"
}

variable "database_password" {
  description = "Database password for the Supabase project"
  type        = string
  sensitive   = true
  # 데이터베이스 접속 비밀번호
  # sensitive = true: Terraform 실행 시 로그에 출력되지 않도록 보호
  # 최소 8자 이상, 대소문자/숫자/특수문자 조합 권장
}

# -----------------------------------------------------------------------------
# 인프라 설정 변수
# -----------------------------------------------------------------------------

variable "instance_size" {
  description = "Supabase instance size (micro, small, medium, large, etc.)"
  type        = string
  default     = "micro"
}

variable "region" {
  description = "AWS region for the Supabase project"
  type        = string
  default     = "ap-northeast-2" # Seoul
  # Supabase 프로젝트가 생성될 AWS 리전
  # 기본값: ap-northeast-2 (서울)
  # 다른 옵션: us-east-1 (버지니아), eu-west-1 (아일랜드) 등
  # default가 있으므로 값을 지정하지 않으면 "ap-northeast-2"가 자동으로 사용됨
}

# -----------------------------------------------------------------------------
# 데이터베이스 API 설정 변수
# -----------------------------------------------------------------------------

variable "db_schema" {
  description = "Database schema for API"
  type        = string
  default     = "public"
  # API를 통해 노출할 데이터베이스 스키마
  # 기본값: "public" (PostgreSQL의 기본 스키마)
}

variable "db_extra_search_path" {
  description = "Extra search path for database"
  type        = string
  default     = "public,extensions"
  # 데이터베이스 쿼리 시 추가로 검색할 스키마 경로
  # extensions: Supabase 확장 기능들이 설치된 스키마
}

variable "max_rows" {
  description = "Maximum rows returned by API"
  type        = number
  default     = 1000
  # API 한 번 호출 시 반환할 수 있는 최대 레코드 수
  # 너무 많은 데이터 반환으로 인한 성능 저하 방지
}

# -----------------------------------------------------------------------------
# 인증(Authentication) 설정 변수
# -----------------------------------------------------------------------------

variable "site_url" {
  description = "Site URL for authentication"
  type        = string
  # 인증 후 리다이렉트될 사이트 URL
  # 예: "http://localhost:3000" (개발), "https://your-domain.com" (프로덕션)
  # OAuth 콜백 URL로도 사용됨
}

variable "uri_allow_list" {
  description = "Comma-separated list of additional redirect URLs for authentication"
  type        = string
  default     = ""
  # 인증 후 리다이렉트가 허용되는 추가 URL 목록 (콤마 구분 문자열)
  # 예: "myapp://auth/callback,https://your-domain.com/callback"
}

variable "external_email_enabled" {
  description = "Enable email authentication"
  type        = bool
  default     = true
  # 이메일/비밀번호 기반 회원가입/로그인 활성화 여부
  # true: 사용자가 이메일로 가입 가능
}

variable "external_phone_enabled" {
  description = "Enable phone authentication"
  type        = bool
  default     = false
  # 전화번호 SMS 기반 인증 활성화 여부
  # true로 설정 시 SMS 발송을 위한 추가 설정 필요 (Twilio 등)
}

variable "external_apple_enabled" {
  description = "Enable Apple OAuth"
  type        = bool
  default     = false
  # Apple 소셜 로그인 활성화 여부
  # true로 설정 시 Apple Developer Console에서 OAuth 설정 필요
}

variable "external_google_enabled" {
  description = "Enable Google OAuth"
  type        = bool
  default     = false
  # Google 소셜 로그인 활성화 여부
  # true로 설정 시 Google Cloud Console에서 OAuth 클라이언트 ID 설정 필요
}

variable "external_google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
  # Google Cloud Console > API & Services > Credentials에서 발급
  # 형식: xxxx.apps.googleusercontent.com
}

variable "external_google_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = ""
  sensitive   = true
  # Google Cloud Console에서 OAuth 클라이언트 생성 시 발급되는 시크릿
}

# -----------------------------------------------------------------------------
# Auth Hook 설정 변수
# -----------------------------------------------------------------------------

variable "hook_custom_access_token_enabled" {
  description = "Enable custom access token hook (JWT Claims에 RBAC role/permissions 주입)"
  type        = bool
  default     = false
}

variable "hook_custom_access_token_uri" {
  description = "URI of the custom access token hook function"
  type        = string
  default     = "pg-functions://postgres/public/custom_access_token_hook"
}

