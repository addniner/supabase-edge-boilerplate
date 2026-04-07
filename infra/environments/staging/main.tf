# =============================================================================
# 스테이징(Staging) 환경 메인 설정
#
# 이 파일은 스테이징 환경용 Supabase 인프라를 구성합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform 및 프로바이더 설정
# -----------------------------------------------------------------------------
# 환경별 설정(루트 모듈)에서는 terraform 블록에 추가로 backend 설정 가능

terraform {
  required_version = ">= 1.0" # Terraform 1.0 이상 버전 필요

  required_providers {
    supabase = {
      source  = "supabase/supabase" # Supabase 공식 프로바이더
      version = "~> 1.0"            # 1.x 버전 사용
    }
  }

  # Terraform Cloud로 State 원격 관리
  # 1. https://app.terraform.io 에서 Organization + Workspace 생성
  # 2. Workspace > Settings > General > Execution Mode → "Local"로 변경
  cloud {
    organization = "__TF_ORG__"

    workspaces {
      name = "__PROJECT_NAME__-staging"
    }
  }
}

# -----------------------------------------------------------------------------
# Supabase 프로바이더 인증 설정
# -----------------------------------------------------------------------------
# provider 블록: 프로바이더(클라우드 제공자)에 대한 인증 및 설정
# - 각 프로바이더마다 필요한 인증 정보가 다름
# - AWS: access_key, secret_key, region
# - Supabase: access_token

provider "supabase" {
  access_token = var.supabase_access_token # 변수에서 토큰 가져오기
  # Supabase Management API 접근을 위한 액세스 토큰
  # 발급 방법: https://supabase.com/dashboard/account/tokens
  # 주의: 이 토큰은 terraform.tfvars에 저장 (git에 커밋하지 말 것!)
}

# -----------------------------------------------------------------------------
# Supabase 모듈 호출 (스테이징 환경 설정)
# -----------------------------------------------------------------------------
# module 블록 문법:
# module "로컬이름" {
#   source = "모듈경로"  # 필수: 모듈의 위치 (로컬 경로, Git URL, Terraform Registry 등)
#   변수1 = 값1          # 모듈의 variables.tf에 정의된 변수에 값 전달
#   변수2 = 값2
# }
# - module 블록: 재사용 가능한 모듈을 호출
# - 모듈의 출력값 참조: module.로컬이름.출력명
# - source 경로 종류:
#   - 로컬: "./modules/supabase" 또는 "../../modules/supabase"
#   - Git: "git::https://github.com/org/repo.git//modules/supabase"
#   - Registry: "hashicorp/supabase/aws"

module "supabase" {
  source = "../../modules/supabase" # 재사용 가능한 Supabase 모듈 경로 (상대 경로)

  # 모듈에 전달할 변수들 (modules/supabase/variables.tf에 정의된 변수)
  # = 왼쪽: 모듈의 변수명, 오른쪽: 전달할 값

  # 필수 변수
  organization_id   = var.organization_id        # 이 파일의 변수를 모듈 변수로 전달
  project_name      = "__PROJECT_NAME__-staging" # 직접 값 지정 (스테이징 환경)
  database_password = var.database_password      # DB 비밀번호
  region            = "ap-northeast-2"           # 서울 리전

  # API 설정
  db_schema            = "public"            # 공개할 스키마
  db_extra_search_path = "public,extensions" # 추가 검색 경로
  max_rows             = 1000                # API 응답 최대 행 수

  # 인증 설정 (스테이징 환경)
  site_url                  = "https://your-domain.com"     # ⚠️ 실제 스테이징 도메인으로 변경
  external_email_enabled    = true                          # 이메일 로그인 활성화
  external_phone_enabled    = false                         # 전화번호 로그인 비활성화 (스테이징 환경에서는 불필요)
  external_google_enabled   = true                          # Google OAuth 활성화
  external_google_client_id = var.external_google_client_id # Google OAuth 클라이언트 ID
  external_google_secret    = var.external_google_secret    # Google OAuth 시크릿
  external_apple_enabled    = false                         # Apple OAuth 비활성화 (스테이징 환경에서는 불필요)
}
