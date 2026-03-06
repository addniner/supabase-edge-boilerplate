---
name: deploy-infra
description: Terraform 인프라 배포. staging/production 인프라 변경, GitHub Secrets 동기화, Terraform 포맷팅 시 사용.
---

# Deploy Infra

## Instructions

```bash
# Terraform 배포
.scripts/infra-deploy.sh staging plan
.scripts/infra-deploy.sh staging apply
.scripts/infra-deploy.sh production plan
.scripts/infra-deploy.sh production apply

# GitHub Secrets 동기화
.scripts/setup-github-secrets.sh

# Terraform 포맷팅
.scripts/terraform-fmt.sh         # 포맷 적용
.scripts/terraform-fmt.sh check   # 포맷 검사만
```

## Important Notes

- 환경변수: `infra/.env` + `infra/.env.<env>`
- apply는 반드시 plan 확인 후 실행
- 사용자 확인 후 실행할 것
