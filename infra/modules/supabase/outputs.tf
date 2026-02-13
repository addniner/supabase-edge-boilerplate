# =============================================================================
# Supabase 모듈 출력 값 정의
# 이 파일은 모듈이 생성한 리소스 정보를 외부(환경별 설정)에서 사용할 수 있도록 출력합니다.
# =============================================================================

# -----------------------------------------------------------------------------
# Terraform 문법 기초
# -----------------------------------------------------------------------------
# output 블록: 모듈이나 루트 설정에서 값을 외부로 노출
#
# 기본 구조:
# output "출력명" {
#   description = "설명"        # 이 출력값이 무엇인지 설명 (선택사항)
#   value       = 출력할값      # 실제 출력될 값 (리소스 속성, 변수 등)
#   sensitive   = true/false    # 민감정보 여부 (true면 콘솔에 숨김)
# }
#
# 출력값 사용처:
# 1. 모듈: module.모듈이름.출력명 (예: module.supabase.project_id)
# 2. 루트: terraform output 명령어로 확인
# 3. 다른 Terraform 설정: terraform_remote_state로 참조

# -----------------------------------------------------------------------------
# 프로젝트 식별 정보
# -----------------------------------------------------------------------------

output "project_id" {
  description = "The ID of the Supabase project"
  value       = supabase_project.main.id # main.tf의 supabase_project.main 리소스의 id 속성
  # Supabase 프로젝트의 고유 ID
  # 모든 리소스 참조에 사용되는 기본 식별자
  # 외부에서 module.supabase.project_id로 접근 가능
}


output "api_url" {
  description = "The API URL of the Supabase project"
  value       = "https://${supabase_project.main.id}.supabase.co"
  # 문자열 보간(String Interpolation): ${표현식} 문법
  # ${supabase_project.main.id}는 실제 프로젝트 ID로 치환됨
  # 예: "https://abc123.supabase.co"
  #
  # Supabase REST API 엔드포인트 URL
  # 클라이언트 애플리케이션에서 이 URL을 통해 데이터베이스에 접근
}

output "database_host" {
  description = "The database host"
  value       = "db.${supabase_project.main.id}.supabase.co"
  # PostgreSQL 데이터베이스 직접 연결 호스트 주소
  # psql이나 데이터베이스 클라이언트로 직접 연결할 때 사용
  # 포트: 5432 (PostgreSQL 기본 포트)
}

# -----------------------------------------------------------------------------
# API 인증 키 (민감 정보)
# -----------------------------------------------------------------------------

output "anon_key" {
  description = "Anonymous key for the Supabase project"
  value       = data.supabase_apikeys.main.anon_key
  sensitive   = true
  # 익명(Anonymous) API 키
  # 용도: 클라이언트(브라우저/모바일 앱)에서 사용
  # 특징: 공개해도 안전 (Row Level Security 정책에 따라 접근 제어됨)
  # sensitive = true: Terraform 출력 시 자동으로 숨김 처리
}

output "service_role_key" {
  description = "Service role key for the Supabase project"
  value       = data.supabase_apikeys.main.service_role_key
  sensitive   = true
  # 서비스 역할(Service Role) API 키
  # 용도: 백엔드 서버에서만 사용
  # 특징: 모든 보안 정책을 우회하는 관리자 권한
  # 경고: 절대 클라이언트 코드에 포함하거나 공개 저장소에 커밋하지 말 것!
}
