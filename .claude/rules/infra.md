---
paths:
  - infra/**/*
---

# Infrastructure Rules (Terraform)

## 프로젝트 구조

```
infra/
├── .env.example           # 환경변수 템플릿
├── .env.staging           # Staging 환경 전체 변수
├── .env.production        # Production 환경 전체 변수
├── modules/supabase/      # 재사용 가능한 Supabase 모듈
└── environments/
    ├── staging/
    └── production/
```

## 주요 명령어

```bash
.scripts/infra-tf.sh staging plan
.scripts/infra-tf.sh staging apply
.scripts/infra-github-secrets-sync.sh --env staging     # GitHub Secrets 동기화 (특정 환경)
.scripts/infra-github-secrets-sync.sh --all              # GitHub Secrets 동기화 (전체)
.scripts/infra-functions-secrets-sync.sh --env staging   # Functions secrets 동기화 (특정 환경)
.scripts/infra-functions-secrets-sync.sh --all            # Functions secrets 동기화 (전체)
.scripts/infra-tf-fmt.sh                  # 포맷 적용
.scripts/infra-tf-fmt.sh check            # 포맷 검사만 (CI용)
```

## 작업 원칙

- ✅ 환경별 변수 분리 (staging/production)
- ✅ Sensitive 정보는 GitHub Secrets 사용
- ✅ 하드코딩 항목 (site_url, uri_allow_list)은 환경별 `main.tf`에 직접 작성
- ❌ 마크다운 문서 생성 금지 (코드 주석으로만)
