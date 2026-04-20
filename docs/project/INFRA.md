# 인프라 구축 가이드

Terraform을 사용하여 Supabase 프로젝트를 코드로 관리합니다.

## 1. 사전 준비

### 1.1 Terraform 설치

```bash
# macOS (Homebrew)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 설치 확인
terraform -version
```

### 1.2 Supabase CLI 설치

```bash
brew install supabase/tap/supabase

# 설치 확인
supabase -v
```

### 1.3 Terraform Cloud 가입

1. https://app.terraform.io 에서 계정 생성
2. Organization 생성
3. Workspace 2개 생성: `<project-name>-staging`, `<project-name>-production`
4. 각 Workspace > Settings > General > **Execution Mode → "Local"** 로 변경
5. API Token 발급: https://app.terraform.io/app/settings/tokens

### 1.4 인증 정보 발급

| 항목 | 발급 경로 |
|------|----------|
| Supabase Access Token | https://supabase.com/dashboard/account/tokens |
| Organization ID | https://supabase.com/dashboard/org/_/settings |
| Terraform Cloud API Token | https://app.terraform.io/app/settings/tokens |
| Google OAuth Client ID/Secret | https://console.cloud.google.com/apis/credentials |

---

## 2. 환경변수 파일 생성

```bash
cp infra/.env.example infra/.env.staging
cp infra/.env.example infra/.env.production
# → 각 파일에 토큰, 비밀번호 등 입력
```

> 키 설명 및 발급처는 `infra/.env.example` 참조

> Google OAuth는 선택사항입니다. 비워두면 활성화만 되고 실제 연동은 안 됩니다.

---

## 3. 프로젝트 초기화

스크립트를 실행하여 프로젝트명과 Terraform Cloud 조직명을 설정합니다:

```bash
.scripts/init-project-name.sh <project-name> <tf-org-name>

# 예시
.scripts/init-project-name.sh my-app my-org
```

이 스크립트는 `__PROJECT_NAME__`과 `__TF_ORG__` 플레이스홀더를 실제 값으로 치환합니다.

---

## 4. 프로젝트 생성

```bash
# 미리보기
.scripts/infra-tf.sh staging plan

# 생성
.scripts/infra-tf.sh staging apply
```

`apply` 완료 후 출력값:

| 출력 | 설명 |
|------|------|
| `project_id` | Supabase 프로젝트 ID |
| `api_url` | API 엔드포인트 (`https://xxxxx.supabase.co`) |
| `anon_key` | 클라이언트용 공개 키 |
| `service_role_key` | 서버용 비밀 키 |

민감한 값 확인:
```bash
terraform -chdir=infra/environments/staging output -raw service_role_key
```

### 출력된 project_id 기록

`apply` 완료 후 출력된 `project_id`를 환경별 `.env` 파일에 기록합니다:

```bash
# infra/.env.staging
PROJECT_ID=출력된_project_id
```

이 값은 이후 Edge Functions 배포와 CI/CD에서 사용됩니다.

---

## 5. Edge Functions 배포 (수동)

```bash
# 프로젝트 연결
supabase link --project-ref <project_id>

# DB 마이그레이션 적용
supabase db push

# Edge Functions 배포
supabase functions deploy --no-verify-jwt
```

### Edge Functions 환경변수 배포

```bash
.scripts/infra-functions-secrets-sync.sh
# → staging 또는 production 선택
```

---

## 6. CI/CD 자동 배포 (GitHub Actions)

`develop` → staging, `main` → production 자동 배포.

### 6.1 GitHub Secrets 등록

스크립트로 일괄 등록:

```bash
.scripts/infra-github-secrets-sync.sh
```

또는 수동 등록 (`Settings > Secrets and variables > Actions`):

**Repo-level secrets (공통)**:

| 시크릿 | 설명 |
|--------|------|
| `SUPABASE_ACCESS_TOKEN` | Supabase 액세스 토큰 |
| `ORGANIZATION_ID` | Supabase 조직 ID |
| `TF_API_TOKEN` | Terraform Cloud API 토큰 |

**Environment secrets (staging / production 각각)**:

| 시크릿 | 설명 |
|--------|------|
| `SUPABASE_PROJECT_ID` | `terraform output -raw project_id` |
| `DATABASE_PASSWORD` | DB 비밀번호 |
| `SITE_URL` | 사이트 URL |
| `EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `EXTERNAL_GOOGLE_SECRET` | Google OAuth 시크릿 |

### 6.2 워크플로우

| 워크플로우 | 트리거 | 역할 |
|-----------|--------|------|
| `terraform-staging.yml` | `develop` push (infra 변경 시) | Terraform Plan & Apply |
| `terraform-production.yml` | `main` push (infra 변경 시) | Terraform Plan & Apply |
| `staging.yaml` | `develop` push (supabase 변경 시) | DB 마이그레이션 + Edge Functions 배포 |
| `production.yaml` | `main` push (supabase 변경 시) | DB 마이그레이션 + Edge Functions 배포 |

등록 후 `develop` 브랜치에 push하면 자동으로 마이그레이션 + Edge Functions 배포.

---

## 7. State 관리

Terraform State는 **Terraform Cloud**로 원격 관리됩니다.

- State 잠금(Lock) 지원으로 동시 작업 충돌 방지
- State 버전 관리 및 백업
- Enhanced Free 플랜: 500 managed resources 무료

> 로컬 State에서 마이그레이션: `terraform init -migrate-state`
> `.tfstate`를 잃어버려도 실제 인프라는 유지됩니다. `terraform import`로 재연결 가능.

---

## 8. 인프라 삭제

```bash
# 주의: Supabase 프로젝트가 삭제됩니다
.scripts/infra-tf.sh staging destroy
```

---

## 디렉터리 구조

```
infra/
├── .env.example              # 환경변수 템플릿
├── environments/
│   ├── staging/
│   │   ├── main.tf           # Staging 환경 설정 (Terraform Cloud backend)
│   │   ├── variables.tf      # 입력 변수 정의
│   │   └── outputs.tf        # 출력값 정의
│   └── production/
│       ├── main.tf           # Production 환경 설정 (Terraform Cloud backend)
│       ├── variables.tf
│       └── outputs.tf
└── modules/
    └── supabase/
        ├── main.tf           # Supabase 리소스 정의 (재사용 모듈)
        ├── variables.tf
        └── outputs.tf
```
