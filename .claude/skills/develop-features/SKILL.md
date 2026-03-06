---
name: develop-features
description: Develop multiple domain features in parallel using an agent team. Use when the user asks to create or implement multiple features, domains, or endpoints simultaneously.
---

# Develop Features (Agent Team)

여러 도메인 기능을 에이전트 팀으로 병렬 개발합니다.

## Instructions

1. 사용자가 요청한 기능 목록을 파싱 (`$ARGUMENTS`에서 추출)

2. 팀 생성 후, 각 기능당 1명의 에이전트를 Sonnet으로 스폰:
   - subagent_type: `general-purpose`
   - mode: `bypassPermissions`

3. 각 에이전트에게 다음을 지시:
   - `supabase/functions/api/domains/_example/` 패턴을 먼저 읽을 것
   - 자신의 도메인 디렉토리 내 파일만 생성/수정할 것
   - **공유 파일 수정 금지**: `deno.json`, `index.ts`, `db/schema.ts`는 건드리지 말 것
   - 완료 후 팀 리드에게 보고:
     - 생성한 파일 목록
     - deno.json에 추가할 import alias
     - index.ts에 등록할 라우트
     - db/schema.ts에 추가할 테이블 (해당 시)

4. 모든 에이전트 완료 후 팀 리드가:
   - 공유 파일 통합 (deno.json, index.ts, db/schema.ts)
   - `.scripts/deno-check.sh` 실행하여 type check + lint + test 통과 확인
   - 실패 시 해당 에이전트를 resume하여 수정

5. 에이전트 종료 및 팀 정리

## Arguments

기능 목록을 쉼표 또는 따옴표로 구분하여 전달:
- `/develop-features "유저 프로필" "결제" "알림"`
- `/develop-features users, payments, notifications`

## Important

- 3개 이하 기능: 각각 1 에이전트
- 4개 이상 기능: 2-3개씩 그룹핑하여 에이전트 수 최적화
- 기능 간 의존성이 있으면 의존 순서대로 순차 처리
