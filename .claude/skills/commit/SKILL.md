---
name: commit
description: 변경사항을 확인하고 conventional commit 메시지로 커밋한다. 사용자가 커밋을 요청하거나 /commit을 호출할 때 사용.
disable-model-invocation: false
---

# Commit

변경사항을 분석하고 conventional commit 메시지로 커밋한다.

## 절차

1. 상태 확인 (병렬 실행)
   - `git status -s` — 변경된 파일 목록
   - `git diff` — staged + unstaged 변경 내용
   - `git log --oneline -5` — 최근 커밋 스타일 참고

2. 변경사항 분석
   - 변경 파일과 내용을 분석하여 커밋 유형 결정
   - 유형: `feat`, `fix`, `refactor`, `ci`, `docs`, `chore`, `test`, `perf`
   - 스코프가 명확하면 포함: `feat(main)`, `fix(ci)`, `docs(claude-code)`

3. 스테이징
   - 관련 파일만 `git add` (파일명 명시)
   - 민감 파일 제외: `.env`, `credentials`, `*.key`, `*.pem`
   - `git add -A` 또는 `git add .` 사용 금지

4. 커밋
   - 커밋 메시지는 HEREDOC으로 전달
   - 본문이 필요하면 제목과 빈 줄로 구분
   - 마지막에 `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` 포함

```
git commit -m "$(cat <<'EOF'
{type}({scope}): {제목}

{필요 시 본문}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

5. 커밋 후 `git status -s`로 결과 확인

6. 다음 단계 제안
   - "push할까요?" 질문
   - 수락 시: /push skill 절차 실행

## 규칙

- 변경사항이 없으면 커밋하지 않고 알림
- 커밋 제목은 한국어 또는 영어 (기존 스타일 따라감)
- `--amend` 사용 금지 (항상 새 커밋)
- pre-commit hook 실패 시 문제 수정 후 새 커밋 생성
