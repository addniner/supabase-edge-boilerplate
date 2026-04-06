---
name: deno-check
description: Deno 통합 검증 (type check + lint + test + coverage). 타입 체크, 린트, 테스트, 검증, 코드 확인 요청 시 사용. 특정 파일 테스트도 가능.
---

# Deno Check

통합 검증 또는 개별 테스트를 실행한다.

## Instructions

1. `$ARGUMENTS`가 있으면 해당 파일만 테스트:

   ```bash
   cd supabase/functions/api && deno test --allow-all --reporter=dot $ARGUMENTS
   ```

2. `$ARGUMENTS`가 없으면 통합 검증 스크립트 실행:

   ```bash
   .scripts/deno-check.sh
   ```

   실행 단계:
   - **Type check**: `deno check --allow-import .`
   - **Lint**: `deno lint`
   - **Test + Coverage**: `deno test --allow-all --coverage=_coverage` → `_coverage/lcov.info` 생성

3. 결과 보고:
   - 성공: 통과 항목 요약
   - 실패: 파일:라인 형태로 에러 명확히 보고
   - Do NOT attempt to fix errors automatically unless explicitly asked

## Important Notes

- Always run from the project root directory
- Use `.scripts/deno-check.sh -r` to reload Deno cache if needed
