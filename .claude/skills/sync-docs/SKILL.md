---
name: sync-docs
description: 코드 아키텍처 변경 후 .claude 내부 문서(CLAUDE.md, rules, skills, agents)와 docs/를 현행화한다. 아키텍처 변경, 리팩토링, 구조 변경 후 문서 동기화 요청 시 사용.
---

# Sync Docs

코드 아키텍처 변경 사항을 감지하고 관련 문서를 현행화한다.

## 트리거 시점

- 레이어 구조 변경 (디렉토리 이동, 추가, 삭제)
- import alias 변경 (deno.json)
- 새 패턴 도입 (인터페이스, DI, 예외 처리 등)
- 컨벤션 변경 (네이밍, 파일 위치 등)

## Instructions

### 1단계: 변경 감지

최근 커밋에서 아키텍처 변경 사항을 파악한다:

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```

다음 파일/디렉토리 변경을 중점 확인:
- `deno.json` (alias 추가/삭제/변경)
- `domain/`, `application/`, `presentation/`, `infrastructure/` (구조 변경)
- `__tests__/` (테스트 설정 변경)

### 2단계: 문서 대조

변경 사항과 아래 문서들의 내용을 대조한다:

| 문서 | 확인할 내용 |
|---|---|
| `.claude/CLAUDE.md` | Architecture 트리, Import Aliases, Layer Dependencies, Usecase/DB Pattern, Do NOT |
| `.claude/rules/layers/*.md` | 각 레이어별 규칙이 현재 코드와 일치하는지 |
| `.claude/rules/database/*.md` | DB 관련 규칙 |
| `.claude/skills/*/SKILL.md` | 스킬 내 경로, 명령어, 패턴이 유효한지 |
| `.claude/agents/*.md` | 에이전트 설정 내 경로, 패턴이 유효한지 (있다면) |
| `docs/project/DEVELOPMENT.md` | 개발 가이드가 현재 구조와 일치하는지 |
| `docs/project/ARCHITECTURE.md` | ADR이 현재 결정과 일치하는지 |

### 3단계: 불일치 리포트

불일치를 카테고리별로 요약:

```
## 문서 동기화 리포트

### 불일치 항목
| 문서 | 위치 | 현재 내용 | 실제 코드 | 수정 필요 |
|---|---|---|---|---|
| CLAUDE.md | Architecture 트리 | domains/ 존재 | 삭제됨 | ✅ |

### 일치 확인: N개 항목
```

### 4단계: 사용자 확인

불일치 항목을 보여주고 수정 진행 여부를 확인한다.
사용자가 승인하면 문서를 수정한다.

### 5단계: 수정

- 각 문서를 현재 코드에 맞게 수정
- 불필요한 내용 제거, 새 패턴/구조 반영
- 코드 예시가 있다면 현재 패턴에 맞게 업데이트

### 6단계: 검증

수정 후 `.scripts/deno-check.sh` 실행하여 코드에 영향이 없는지 확인한다.
(문서 수정만이므로 보통 영향 없음)

## 규칙

- 코드는 수정하지 않는다 — 문서만 수정
- CLAUDE.md의 코드 예시는 실제 동작하는 패턴이어야 한다
- ADR(Architecture Decision Record)은 삭제하지 않고 업데이트한다
- 새 ADR이 필요하면 `docs/project/ARCHITECTURE.md`에 추가한다
- rules 파일의 `globs` frontmatter가 실제 파일 경로와 맞는지 확인한다
