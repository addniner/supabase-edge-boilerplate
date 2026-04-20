---
name: commit
description: Git 커밋. "커밋해줘", "커밋 ㄱㄱ", "커밋만", "commit", "커밋하고", "변경사항 커밋" 등 커밋 요청 시 사용.
disable-model-invocation: false
---

# Commit

변경사항을 분석하고 conventional commit 메시지로 커밋한다.

## 워크트리 감지

먼저 현재 워크트리 안인지 확인:

```bash
git rev-parse --is-inside-work-tree && git worktree list
```

경로에 `.claude/worktrees/`가 포함되거나 현재 브랜치가 `worktree-*`이면 **워크트리 모드**로 전환.

---

## 일반 모드 (워크트리 아닐 때)

### 절차

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

---

## 워크트리 모드 (워크트리 안일 때)

워크트리에서 커밋 요청 시 **WIP 커밋 + develop 스쿼시 머지** 플로우를 실행한다.

### 절차

1. 상태 확인 (병렬 실행)
   - `git status -s` — 변경된 파일 목록
   - `git diff --stat` — 변경 내용 요약
   - `git log --oneline develop..HEAD` — 워크트리에서 만든 커밋 목록

2. WIP 커밋
   - 변경사항이 있으면 전부 스테이징 후 WIP 커밋
   - 민감 파일은 동일하게 제외
   ```
   git add {파일들}
   git commit -m "WIP: {작업 요약}"
   ```

3. 원본 브랜치 확인
   - `develop`을 기본 대상으로 사용
   - `git log --oneline develop..HEAD`로 스쿼시 대상 커밋 확인

4. 스쿼시 머지
   - 원본 레포 디렉토리에서 실행 (워크트리의 부모)
   ```bash
   # 원본 레포 경로 찾기
   MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

   # 원본 레포에서 스쿼시 머지
   cd "$MAIN_REPO"
   git merge --squash {worktree-branch}
   ```

5. 스쿼시 커밋 메시지 작성
   - 워크트리의 전체 변경사항을 분석하여 conventional commit 메시지 작성
   - 일반 모드와 동일한 메시지 규칙 적용
   - infra 등 관계없는 파일이 포함되었으면 `git restore --staged`로 제외
   ```
   cd "$MAIN_REPO"
   git commit -m "$(cat <<'EOF'
   {type}({scope}): {제목}

   {변경사항 요약}

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

6. 정리
   - 워크트리로 돌아옴 (세션 CWD 유지)
   - 사용자에게 결과 보고: 커밋 해시, 변경 파일 수
   - "워크트리 정리할까요?" 질문
   - 수락 시: ExitWorktree 도구로 워크트리 제거

---

## 규칙

- 변경사항이 없으면 커밋하지 않고 알림
- 커밋 제목은 한국어 또는 영어 (기존 스타일 따라감)
- `--amend` 사용 금지 (항상 새 커밋)
- pre-commit hook 실패 시 문제 수정 후 새 커밋 생성
