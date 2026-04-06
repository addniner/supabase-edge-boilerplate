---
name: deploy-env
description: Edge Functions 환경변수 배포. staging/production 환경에 secrets 배포 시 사용.
---

# Deploy Env

## Instructions

```bash
.scripts/infra-functions-secrets-sync.sh
```

환경(staging/production) 선택 프롬프트가 나옴.

## Important Notes

- 환경변수 파일: `supabase/functions/.env`
- 사용자 확인 후 실행할 것
