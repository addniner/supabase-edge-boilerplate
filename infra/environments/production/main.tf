# =============================================================================
# 프로덕션(Production) 환경 메인 설정
# 이 파일은 실제 서비스용 Supabase 인프라를 구성합니다.
# 경고: 프로덕션 환경은 실제 사용자 데이터를 다루므로 신중하게 변경하세요!
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform 및 프로바이더 설정
# -----------------------------------------------------------------------------
terraform {
  required_version = ">= 1.0" # Terraform 1.0 이상 버전 필요

  required_providers {
    supabase = {
      source  = "supabase/supabase" # Supabase 공식 프로바이더
      version = "~> 1.0"            # 1.x 버전 사용
    }
  }

  # Terraform Cloud로 State 원격 관리
  # ⚠️ 프로덕션 환경에서는 반드시 원격 State 사용 ⚠️
  # 1. https://app.terraform.io 에서 Organization + Workspace 생성
  # 2. Workspace > Settings > General > Execution Mode → "Local"로 변경
  cloud {
    organization = "__TF_ORG__"

    workspaces {
      name = "__PROJECT_NAME__-production"
    }
  }
}

# -----------------------------------------------------------------------------
# Supabase 프로바이더 인증 설정
# -----------------------------------------------------------------------------
provider "supabase" {
  access_token = var.supabase_access_token
  # Supabase Management API 접근을 위한 액세스 토큰
  # 발급 방법: https://supabase.com/dashboard/account/tokens
  # 주의: 이 토큰은 terraform.tfvars에 저장 (git에 커밋하지 말 것!)
}

# -----------------------------------------------------------------------------
# Supabase 모듈 호출 (프로덕션 환경 설정)
# -----------------------------------------------------------------------------
# 동일한 모듈을 staging과 production에서 재사용하되, 전달하는 값만 다르게 설정
# 이것이 모듈의 핵심 장점: 코드 재사용성과 일관성

module "supabase" {
  source = "../../modules/supabase" # 스테이징 환경과 동일한 모듈 사용

  # 모듈에 전달할 변수들
  # 프로덕션 환경은 스테이징 환경과 다른 값을 사용 (특히 보안 설정)

  # 필수 변수
  organization_id   = var.organization_id           # Supabase 조직 ID
  project_name      = "__PROJECT_NAME__-production" # 프로젝트명 (프로덕션 환경)
  database_password = var.database_password         # DB 비밀번호 (강력한 암호 필수!)
  region            = "ap-northeast-2"              # 서울 리전

  # API 설정
  db_schema            = "public"            # 공개할 스키마
  db_extra_search_path = "public,extensions" # 추가 검색 경로
  max_rows             = 1000                # API 응답 최대 행 수

  # 인증 설정 (프로덕션 환경 - 모든 인증 방식 활성화)
  # staging과 달리 phone, apple도 활성화 (실제 서비스용)
  site_url                  = "https://your-domain.com"     # ⚠️ 실제 프로덕션 도메인으로 변경
  external_email_enabled    = true                          # 이메일 로그인 활성화
  external_phone_enabled    = true                          # 전화번호 로그인 활성화 (SMS 제공자 설정 필요)
  external_google_enabled   = true                          # Google OAuth 활성화 (OAuth 클라이언트 설정 필요)
  external_google_client_id = var.external_google_client_id # Google OAuth 클라이언트 ID
  external_google_secret    = var.external_google_secret    # Google OAuth 시크릿
  external_apple_enabled    = true                          # Apple OAuth 활성화 (Apple Developer 설정 필요)
}
