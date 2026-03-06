---
name: merge
description: PR을 머지한다. conflict 발생 시 로컬에서 해결 후 재시도한다. /merge 또는 /merge {PR번호}로 호출.
disable-model-invocation: false
---

# Merge

PR을 머지한다. $ARGUMENTS에서 PR 번호를 추출한다. 생략 시 현재 브랜치의 열린 PR을 찾는다.

## 절차

1. 현재 브랜치 및 base 확인
   - `git branch --show-current`
   - base 결정:
     - `develop` → base: `main`
     - 그 외 → base: `develop`

2. PR 번호 결정
   - $ARGUMENTS에서 숫자를 추출하여 PR 번호로 사용
   - 숫자가 없으면: `gh pr list --head {현재 브랜치} --base {base} --state open --json number --jq '.[0].number'`

3. 머지 시도
   - `gh pr merge {번호} --merge`

4. Conflict 발생 시
   - `git fetch origin {base}`
   - `git merge origin/{base}` (현재 브랜치에서)
   - conflict 파일 확인: `git diff --name-only --diff-filter=U`
   - conflict 내용 분석 후 해결
   - `git add {파일들}` → `git commit` (머지 커밋)
   - `git push origin {현재 브랜치}`
   - 다시 머지 시도: `gh pr merge {번호} --merge`

5. 머지 성공 후
   - `gh pr view {번호} --json state --jq '.state'`로 MERGED 확인

6. 로컬 동기화
   - `git fetch origin {base}`
   - feature 브랜치였으면: base로 checkout + pull 할지 사용자에게 확인

7. Watch (조건부)
   - $ARGUMENTS에 "확인", "대기", "watch" 등의 키워드가 포함된 경우에만 실행
   - base push로 트리거된 CI run을 watch
   - develop → main 머지였으면 Dev Build도 watch 대상
   - 완료 후 결과 요약

## 규칙

- 머지 방식은 항상 `--merge` (squash, rebase 아님)
- conflict 해결 시 현재 브랜치(head) 쪽이 최신이므로 기본적으로 head 우선
- 단, 실제 충돌 내용을 분석하여 판단
