---
name: push
description: 현재 브랜치를 원격에 push한다. conflict 발생 시 자동으로 해결한다. /push로 호출.
disable-model-invocation: false
---

# Push

현재 브랜치를 origin에 push한다. rejected 시 자동 복구.

## 절차

1. 현재 브랜치 확인
   - `git branch --show-current`

2. Push 시도
   - `git push origin {브랜치}`
   - remote에 브랜치가 없으면: `git push -u origin {브랜치}`

3. Rejected 시 (non-fast-forward)
   - unstaged changes 있으면: `git stash`
   - `git pull --rebase origin {브랜치}`
   - stash 했으면: `git stash pop`
   - 다시 push: `git push origin {브랜치}`

4. Watch (조건부)
   - $ARGUMENTS에 "확인", "대기", "watch" 등의 키워드가 포함된 경우에만 실행
   - CI는 main, develop push에서만 트리거됨 — feature 브랜치는 watch 불가
   - main 또는 develop인 경우:
     - `gh run list --branch {브랜치} --limit 1 --json databaseId --jq '.[0].databaseId'`로 run ID 조회
     - `gh run watch {run_id}`
     - 완료 후 결과 요약

5. 다음 단계 제안
   - "PR 만들까요?" 질문
   - 수락 시: /pr skill 절차 실행

## 규칙

- force push (`--force`, `-f`) 절대 금지
- rebase conflict 발생 시 사용자에게 보고하고 중단
