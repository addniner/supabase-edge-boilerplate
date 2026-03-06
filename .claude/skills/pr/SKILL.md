---
name: pr
description: 현재 브랜치에서 적절한 base 브랜치로 Pull Request를 생성한다. /pr로 호출.
disable-model-invocation: false
---

# PR

현재 브랜치에 따라 적절한 base로 Pull Request를 생성한다.

## 절차

1. 브랜치 확인 및 base 결정
   - `git branch --show-current`로 현재 브랜치 확인
   - base 브랜치 결정:
     - `develop` → base: `main`
     - 그 외 (feat/*, fix/*, refactor/* 등) → base: `develop`
     - `main` → PR 생성 불가, 사용자에게 안내

2. 원격 동기화 확인
   - `git status -sb`로 origin 대비 상태 확인
   - 로컬 커밋이 push 안 됐으면 먼저 push
   - remote에 브랜치가 없으면 `git push -u origin {브랜치}`

3. 변경사항 분석 (병렬 실행)
   - `git log --oneline origin/{base}..HEAD` — PR에 포함될 커밋 목록
   - `git diff origin/{base}...HEAD --stat` — 변경 파일 요약

4. PR 생성
   - 모든 커밋을 분석하여 제목/본문 작성
   - 제목: 70자 이하, 변경 요약
   - 본문: Summary (주요 변경 bullet points) + Test plan

```bash
gh pr create --base {base} --head {현재 브랜치} --title "{제목}" --body "$(cat <<'EOF'
## Summary
{변경사항 bullet points}

## Test plan
{테스트 계획 체크리스트}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

5. PR URL 출력

6. Watch (조건부)
   - $ARGUMENTS에 "확인", "대기", "watch" 등의 키워드가 포함된 경우에만 실행
   - PR의 CI check를 watch
   - 완료 후 결과 요약

7. 다음 단계 제안
   - "머지할까요?" 질문
   - 수락 시: /merge skill 절차 실행

## 규칙

- 이미 열린 PR이 있으면 중복 생성하지 않고 기존 PR URL 안내
- 커밋이 하나면 해당 커밋 메시지를 PR 제목으로 활용
