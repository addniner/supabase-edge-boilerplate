---
name: serve
description: Edge Functions 로컬 서버 시작. 로컬 테스트, API 확인, 서버 실행 요청 시 사용.
---

# Serve

## Instructions

```bash
.scripts/serve.sh           # 일반 실행
.scripts/serve.sh -i        # 디버거 연결
.scripts/serve.sh -ib       # 디버거 + 시작점 중단
```

## Important Notes

- API URL: `http://127.0.0.1:54321/functions/v1/api/`
- Supabase가 먼저 실행 중이어야 함
