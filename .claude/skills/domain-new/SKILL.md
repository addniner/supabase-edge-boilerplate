---
name: domain-new
description: 새 도메인 모듈 생성. route, service, repository, schema, index.ts를 아키텍처 패턴에 맞게 생성. 새 API 엔드포인트나 기능 추가 시 사용.
---

# Domain New

## Instructions

1. `domains/_example/` 파일들을 참고하여 구조 파악
2. `domains/{domain}/` 폴더 생성
3. 필요한 파일 생성 (아래 구조)
4. `index.ts`에서 외부 export 정의
5. 메인 `index.ts`에 라우트 등록

## 파일 구조

```
domains/{domain}/
├── index.ts                  # 외부 exports
├── {name}.route.ts           # OpenAPI 라우트 + 핸들러
├── {name}.service.ts         # 비즈니스 로직
├── {name}.repository.ts      # 데이터 접근 (CRUD)
└── {name}.schema.ts          # Zod 스키마 (optional)
```

## Important Notes

- `_example` 도메인의 패턴을 따를 것
- Route → Service → Repository 단방향 의존
- `@app/middleware`에서 `AppEnv`, `createRoute`, `z` import
- 라우트 등록: `index.ts`에서 `app.route("/path", domainRoute)`
