---
paths:
  - infra/**/*
---

# Infrastructure Rules (Terraform)

## 프로젝트 구조

```
infra/
├── .env                   # 공통 변수 (Supabase token, Org ID, TF Cloud)
├── .env.staging           # Staging TF_VAR_* + PROJECT_ID
├── .env.production        # Production TF_VAR_* + PROJECT_ID
├── modules/supabase/      # 재사용 가능한 Supabase 모듈
└── environments/
    ├── staging/
    └── production/
```

## 주요 명령어

```bash
.scripts/infra-deploy.sh staging plan
.scripts/infra-deploy.sh staging apply
.scripts/setup-github-secrets.sh    # GitHub Secrets 동기화
.scripts/env-deploy.sh              # Edge Functions secrets 배포
.scripts/terraform-fmt.sh           # 포맷 적용
.scripts/terraform-fmt.sh check     # 포맷 검사만 (CI용)
```

## 작업 원칙

- ✅ 환경별 변수 분리 (staging/production)
- ✅ Sensitive 정보는 GitHub Secrets 사용
- ✅ 하드코딩 항목 (site_url, uri_allow_list)은 환경별 `main.tf`에 직접 작성
- ❌ 마크다운 문서 생성 금지 (코드 주석으로만)
