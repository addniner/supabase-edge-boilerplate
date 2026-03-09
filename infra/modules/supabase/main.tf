# =============================================================================
# Supabase 모듈 메인 설정
# 이 파일은 Supabase 프로젝트의 실제 리소스를 생성하고 관리합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform 문법 기초
# -----------------------------------------------------------------------------
# terraform 블록: Terraform 자체 설정 (프로바이더 버전, 백엔드 등)
# resource 블록: 실제로 생성/관리할 인프라 리소스 정의
# data 블록: 기존에 존재하는 리소스의 정보를 조회 (생성하지 않음)
#
# 리소스 참조 방법:
# - 리소스: 리소스타입.이름.속성
# - 변수: var.변수명
# - 데이터: data.데이터타입.이름.속성
#
# 예시:
# - supabase_project.main.id          → 이 파일에서 정의한 프로젝트의 ID
# - var.organization_id                → variables.tf에서 정의한 변수 값
# - data.supabase_apikeys.main.anon_key → 조회한 데이터의 anon_key 속성

# -----------------------------------------------------------------------------
# Terraform 설정: 필요한 프로바이더 정의
# -----------------------------------------------------------------------------
terraform {
  # required_providers: 이 모듈이 사용할 외부 프로바이더(플러그인) 지정
  required_providers {
    supabase = {
      source  = "supabase/supabase" # 프로바이더 저장소 위치 (레지스트리/네임스페이스/이름)
      version = "~> 1.0"            # 버전 제약 (~> 1.0 = 1.0 이상 2.0 미만)
      # 버전 제약 문법:
      # ~> 1.0   → 1.0 이상, 2.0 미만 (마이너 업데이트 허용)
      # >= 1.0   → 1.0 이상 모든 버전
      # = 1.0    → 정확히 1.0 버전만
      # >= 1.0, < 2.0 → 1.0 이상 2.0 미만
    }
  }
}

# -----------------------------------------------------------------------------
# Supabase 프로젝트 생성
# -----------------------------------------------------------------------------
# resource 블록 문법:
# resource "리소스타입" "로컬이름" {
#   속성1 = 값1
#   속성2 = 값2
# }
# - 리소스타입: 프로바이더가 제공하는 리소스 종류 (예: supabase_project)
# - 로컬이름: 이 파일 내에서 이 리소스를 참조할 때 사용할 이름 (예: main)
# - 참조 방법: supabase_project.main

resource "supabase_project" "main" {
  # 속성(Argument): 리소스 생성 시 필요한 설정값
  # = 왼쪽은 속성명, 오른쪽은 값 (변수 참조 가능)

  # Supabase 조직 ID (어떤 조직에 프로젝트를 생성할지 지정)
  organization_id = var.organization_id # var.변수명으로 변수 참조

  # 프로젝트 이름 (대시보드에 표시될 이름)
  name = var.project_name

  # PostgreSQL 데이터베이스의 postgres 사용자 비밀번호
  database_password = var.database_password

  # AWS 리전 (데이터가 저장될 물리적 위치)
  region = var.region

  # lifecycle 블록: 리소스의 생명주기 관리 방식 지정
  lifecycle {
    # ignore_changes: 지정한 속성의 변경사항을 무시 (재생성 방지)
    ignore_changes = [
      database_password, # 비밀번호는 최초 생성 후 변경사항 무시
      organization_id,   # 프로젝트 생성 후 변경 불가 (프로바이더 제약)
    ]
    # 이유: 보안상 비밀번호는 생성 후 Supabase 대시보드에서 직접 관리
    # Terraform으로 비밀번호를 변경하면 기존 연결이 끊어질 수 있음

    # 다른 lifecycle 옵션:
    # create_before_destroy = true  → 새 리소스 생성 후 기존 리소스 삭제
    # prevent_destroy = true        → 실수로 삭제되는 것 방지
  }
}

# -----------------------------------------------------------------------------
# Supabase 프로젝트 설정 (API 및 인증)
# -----------------------------------------------------------------------------
resource "supabase_settings" "main" {
  # 리소스 간 종속성(Dependency):
  # 다른 리소스의 속성을 참조하면 Terraform이 자동으로 생성 순서를 결정
  # 여기서는 supabase_project.main이 먼저 생성된 후 이 설정이 적용됨

  # 설정을 적용할 프로젝트 참조 ID
  project_ref = supabase_project.main.id # 위에서 생성한 프로젝트의 ID 속성 참조

  # jsonencode() 함수: 맵이나 객체를 JSON 문자열로 변환
  # 문법: jsonencode({ key = value, ... })

  # API 설정: JSON 형식으로 인코딩하여 전달
  api = jsonencode({
    db_schema            = var.db_schema            # API가 사용할 데이터베이스 스키마
    db_extra_search_path = var.db_extra_search_path # 추가 스키마 검색 경로
    max_rows             = var.max_rows             # API 응답 최대 행 수 제한
  })
  # 결과 예시: {"db_schema":"public","db_extra_search_path":"public,extensions","max_rows":1000}

  # 인증 설정: JSON 형식으로 인코딩하여 전달
  auth = jsonencode({
    site_url                  = var.site_url                  # 인증 후 리다이렉트 URL
    uri_allow_list            = var.uri_allow_list            # 추가 리다이렉트 URL 목록 (콤마 구분)
    external_email_enabled    = var.external_email_enabled    # 이메일 로그인 활성화
    external_phone_enabled    = var.external_phone_enabled    # 전화번호 로그인 활성화
    external_apple_enabled    = var.external_apple_enabled    # Apple OAuth 활성화
    external_google_enabled   = var.external_google_enabled   # Google OAuth 활성화
    external_google_client_id = var.external_google_client_id # Google OAuth 클라이언트 ID
    external_google_secret    = var.external_google_secret    # Google OAuth 시크릿

    hook_custom_access_token_enabled = var.hook_custom_access_token_enabled
    hook_custom_access_token_uri     = var.hook_custom_access_token_uri
  })
}

# -----------------------------------------------------------------------------
# Supabase API 키 조회
# -----------------------------------------------------------------------------
# data 블록 문법:
# data "데이터소스타입" "로컬이름" {
#   조회조건1 = 값1
# }
# - data 블록: 기존 리소스의 정보를 읽기만 함 (생성/수정/삭제 안함)
# - resource와 달리 인프라를 변경하지 않음
# - 참조 방법: data.데이터소스타입.로컬이름.속성

data "supabase_apikeys" "main" {
  # API 키를 조회할 프로젝트 참조 ID
  project_ref = supabase_project.main.id

  # 이 data 블록은 Supabase에서 자동 생성된 API 키를 조회합니다:
  # - data.supabase_apikeys.main.anon_key: 클라이언트용 공개 키
  # - data.supabase_apikeys.main.service_role_key: 서버용 비밀 키
  #
  # 조회된 데이터는 outputs.tf에서 외부로 출력됨
}
