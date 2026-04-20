# 프로젝트 설치 가이드

## 1. 필수 프로그램 설치

### 1.1 Docker Desktop
```bash
# macOS (Homebrew)
brew install --cask docker-desktop
```
> ⚠️ Docker가 실행 중이어야 Supabase 로컬 서버가 동작합니다.

### 1.2 Supabase CLI
```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# npm (대안)
npm install -g supabase
```

### 1.3 Deno (v2)
```bash
# macOS (Homebrew)
brew install deno

# 또는 공식 설치 스크립트
curl -fsSL https://deno.land/install.sh | sh
```

---

## 2. 환경 설정 파일 생성

각 `.example` 파일을 복사한 후, 내용을 참고하여 값을 설정하세요.

```bash
# Supabase 환경변수
cp supabase/.env.example supabase/.env

# Edge Functions 환경변수
cp supabase/functions/.env.example supabase/functions/.env

# Vault 시크릿
cp supabase/seeds/00_vault.sql.example supabase/seeds/00_vault.sql

# Claude Code MCP 설정 (선택)
cp .mcp.json.example .mcp.json
```

---

## 3. 로컬 서버 실행

### 3.1 Docker 실행 확인
```bash
docker info
```

### 3.2 Supabase 시작
```bash
supabase start
```

> 첫 실행 시 Docker 이미지 다운로드로 시간이 걸릴 수 있습니다.

### 3.3 실행 결과 확인
```bash
supabase status
```

---

## 4. 원격 환경 인프라 구축 (Staging / Production)

Terraform을 사용하여 Supabase 프로젝트를 코드로 관리합니다.

### 4.1 Terraform 설치

```bash
# macOS (Homebrew)
brew install terraform
```

### 4.2 사전 준비

| 항목 | 발급 경로 |
|------|----------|
| Supabase Access Token | https://supabase.com/dashboard/account/tokens |
| Organization ID | https://supabase.com/dashboard/org/_/settings |

### 4.3 환경변수 파일 생성

```bash
cp infra/.env.example infra/.env.staging
cp infra/.env.example infra/.env.production
# → 각 파일에 토큰, 비밀번호 등 입력 (키 설명은 infra/.env.example 참조)
```

### 4.4 프로젝트 생성

```bash
# 미리보기
.scripts/infra-tf.sh staging plan

# 프로젝트 생성 (Supabase 프로젝트가 생성됨)
.scripts/infra-tf.sh staging apply
```

`apply` 완료 후 출력되는 값:
- `project_id` — Supabase 프로젝트 ID
- `api_url` — API 엔드포인트 (예: `https://xxxxx.supabase.co`)
- `anon_key` — 클라이언트용 공개 키
- `service_role_key` — 서버용 비밀 키

> 민감한 값 확인: `terraform -chdir=infra/environments/staging output -raw service_role_key`

### 4.5 Edge Functions 배포

프로젝트 생성 후, Edge Functions를 배포합니다.

```bash
# Supabase 프로젝트 연결
supabase link --project-ref <project_id>

# 마이그레이션 적용
supabase db push

# Edge Functions 배포
supabase functions deploy --no-verify-jwt
```

### 4.6 CI/CD 자동 배포 (GitHub Actions)

`develop` 브랜치에 push하면 자동으로 staging에 배포됩니다.

GitHub repo `Settings > Environments > staging`에 시크릿 등록:

| 시크릿 | 설명 |
|--------|------|
| `SUPABASE_ACCESS_TOKEN` | Supabase 액세스 토큰 |
| `SUPABASE_PROJECT_ID` | `terraform output -raw project_id`로 확인 |

### 4.7 인프라 삭제

```bash
# 주의: Supabase 프로젝트가 삭제됩니다
.scripts/infra-tf.sh staging destroy
```

---

## 체크리스트

### 로컬 개발
- [ ] Docker Desktop 설치 및 실행
- [ ] Supabase CLI 설치
- [ ] Deno v2 설치
- [ ] `supabase/.env` 생성
- [ ] `supabase/functions/.env` 생성
- [ ] `supabase/seeds/00_vault.sql` 생성
- [ ] `.mcp.json` 생성 (Claude Code 사용 시)
- [ ] `supabase start` 실행
- [ ] http://127.0.0.1:54323 (Studio) 접속 확인

### 원격 환경 (Staging/Production)
- [ ] Terraform 설치
- [ ] Supabase Access Token 발급
- [ ] Organization ID 확인
- [ ] `infra/.env.staging` 생성 (`infra/.env.example` 참고)
- [ ] `.scripts/infra-tf.sh staging apply` 실행
- [ ] `project_id` 확인
- [ ] GitHub Secrets 등록 (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`)
