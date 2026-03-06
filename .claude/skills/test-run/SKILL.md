---
name: test-run
description: Run Deno tests for a specific file or the entire test suite. Use when the user wants to run tests, check test results, or verify changes.
---

# Test Run

Deno 테스트를 실행합니다.

## Instructions

1. 테스트 실행:
   - `$ARGUMENTS`가 있으면 해당 경로만 테스트:
     ```bash
     cd supabase/functions/api && deno test --allow-all --reporter=dot $ARGUMENTS
     ```
   - 없으면 전체 테스트:
     ```bash
     cd supabase/functions/api && deno test --allow-all --reporter=dot
     ```

2. 테스트 결과:
   - 성공: 통과한 테스트 수 보고
   - 실패: 실패한 테스트와 에러 메시지를 파일:라인 형태로 명확히 보고
   - Do NOT attempt to fix errors automatically unless explicitly asked
