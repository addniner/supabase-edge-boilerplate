# 개발 가이드

## 프로젝트 구조

```
supabase/functions/api/
├── index.ts                 # 메인 엔트리포인트
├── deno.json                # Import map, lint 설정
├── app/                     # 프레임워크 레이어
│   ├── middleware/           # 인증, CORS, 에러 핸들링
│   ├── errors/              # 에러 클래스
│   ├── utils/               # 유틸리티
│   └── config/              # 설정
├── clients/                 # 외부 서비스 클라이언트
├── db/                      # DB 접근 (Drizzle ORM)
├── domains/                 # 도메인별 비즈니스 로직
│   ├── _example/            # 예제 도메인 (참고용)
│   ├── internal/            # 헬스체크, 스케줄러
│   └── users/               # 사용자/RBAC
└── shared/                  # 공유 타입, enum, validation
```

## 새 도메인 추가하기

`domains/_example/` 폴더를 참고하여 새 도메인을 추가합니다.

### 1. 도메인 폴더 생성

```
domains/your-domain/
├── index.ts                    # Public exports
├── your-domain.route.ts        # HTTP 라우트
├── your-domain.schema.ts       # Zod 검증 스키마
├── your-domain.service.ts      # Service (Facade)
├── your-domain.repository.ts   # DB 접근
└── usecases/                   # 비즈니스 로직
    ├── index.ts
    ├── create-your-domain.usecase.ts
    └── get-your-domain.usecase.ts
```

### 2. Import map 등록 (`deno.json`)

```json
{
  "imports": {
    "@domains/your-domain": "./domains/your-domain/index.ts"
  }
}
```

### 3. 라우트 등록 (`index.ts`)

```typescript
import { yourDomainRoute } from "@domains/your-domain";

// 인증 필요 라우트
app.route("/your-domain", yourDomainRoute);
```

### 4. 라우트 작성 예시

```typescript
import { Hono } from "@hono";
import type { Context } from "@app";
import { Response, zValidator, getValidated } from "@app/middleware";

const yourDomainRoute = new Hono();

yourDomainRoute.get("/:id", async (c: Context) => {
  const id = c.req.param("id");
  // ...
  return Response.ok(c, result);
});

yourDomainRoute.post(
  "/",
  zValidator("json", CreateSchema),
  async (c: Context) => {
    const input = getValidated<CreateInput>(c);
    // ...
    return Response.created(c, result);
  },
);

export { yourDomainRoute };
```

## 로컬 개발

```bash
# Supabase 로컬 서버 시작
supabase start

# Edge Functions 서빙 (핫 리로드)
supabase functions serve

# 타입 체크 + 린트 + 테스트
.scripts/deno-check.sh
```

## API 문서

로컬 서버 실행 후 Swagger UI에서 확인:

- http://127.0.0.1:54321/functions/v1/api/docs
