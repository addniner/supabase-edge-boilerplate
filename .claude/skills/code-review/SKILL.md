---
name: code-review
description: Run a comprehensive code quality review using an agent team. Use when the user asks for code review, quality check, or security audit.
---

# Code Review (Agent Team)

에이전트 팀을 구성하여 코드 품질을 병렬 리뷰합니다.

## Instructions

1. 팀을 생성하고 다음 2명의 리뷰어를 Sonnet으로 스폰:

   **security-reviewer** (보안 리뷰어):
   - JWT 인증 미들웨어 구현 및 토큰 검증
   - WHITE_LISTED_ROUTES 불필요한 라우트 등록 여부
   - RBAC 권한 체크 누락/일관성
   - SQL 인젝션, XSS 등 OWASP Top 10 취약점
   - 환경변수/시크릿 노출, PII 로깅
   - CORS 설정 적절성
   - 에러 메시지에 민감 정보 포함 여부

   **pattern-reviewer** (코드 패턴 리뷰어):
   - DDD 도메인 구조 준수 (route/schema/service/repository/usecases)
   - 도메인 간 상대경로 import 위반
   - Response.* 헬퍼 사용 (c.json() 직접 사용 금지)
   - CustomError 서브클래스 사용 (plain string throw 금지)
   - Logger.* 사용 (console.* 금지)
   - any 타입 사용 여부
   - Import alias 일관성
   - BaseRepository 확장 패턴
   - zValidator/getValidated 사용 패턴

2. 각 리뷰어의 결과에는 심각도(Critical/High/Medium/Low)와 파일 경로:라인 번호를 포함

3. 두 리뷰어 완료 후 종합 결과를 테이블로 정리

4. 리뷰어 종료 및 팀 정리

## Arguments

- `$ARGUMENTS`가 있으면 해당 경로/도메인만 리뷰 (예: `/code-review domains/users`)
- 없으면 전체 `supabase/functions/api/` 리뷰
