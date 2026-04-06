---
description: 테스트 작성 규칙. 테스트 추가/수정, 커버리지 개선, mock 작성 시 참고.
globs: ["**/*.test.ts", "**/__tests__/**"]
---

# Testing Rules

## 파일 위치 & 스타일

- 대상 파일과 동위치: `my-feature.usecase.ts` → `my-feature.usecase.test.ts`
- `Deno.test()` 사용 (`describe/it` 사용하지 않는다)
- 첫 번째 import는 반드시 `import "@test/env"` (환경변수 초기화)

```typescript
import "@test/env";
import { assertEquals, assertRejects } from "@std/assert";

Deno.test("ClassName - 시나리오 설명", async () => {
  // arrange → act → assert
});
```

### 네이밍

`"ClassName - 시나리오: 예상 결과"` — 한글 사용.

## 테스트 격리

**모든 상태는 `Deno.test()` 콜백 안에서 선언한다.** 모듈 레벨 변수 금지.

```typescript
// ❌ BAD — 모듈 레벨 상태 → 테스트 간 오염, 병렬 실행 시 race condition
let captured: string[] = [];

Deno.test("test A", async () => {
  captured = [];  // 수동 초기화 필요 → 실수 유발
  // ...
});

// ✅ GOOD — 테스트 내부에서 선언
Deno.test("test A", async () => {
  const captured: string[] = [];
  const mockRepo = {
    update: (id: string) => { captured.push(id); return Promise.resolve({}); },
  };
  // ...
});
```

## Mock 패턴

### 생성자 DI

`as never`로 타입 단언 (DI 인터페이스 미도입 상태):

```typescript
const usecase = new MyUseCase(mockRepo as never, mockClient as never);
```

### Mock Factory Helper

같은 의존성을 여러 테스트에서 사용할 때, 파일 상단에 factory 정의.
**기본값은 실패로** — override 누락 시 테스트가 자동 통과하는 것을 방지:

```typescript
function makeMockRepo(overrides: {
  findById: (id: string) => Promise<unknown>;
  update?: (id: string, data: unknown) => Promise<unknown>;
}) {
  return {
    findById: () => Promise.reject(new Error("findById not mocked")),
    update: () => Promise.reject(new Error("update not mocked")),
    ...overrides,
  };
}
```

### 파라미터 캡처 — 전달값 검증 필수

mock이 파라미터를 무시(`_opts`)하지 말고, 캡처해서 검증한다:

```typescript
// ❌ BAD — 파라미터 무시
const mockRepo = {
  findByUserId: (_userId: string, _opts: unknown) => Promise.resolve([]),
};

// ✅ GOOD — 파라미터 캡처 후 검증
Deno.test("GetPaymentHistory - pagination 파라미터 전달", async () => {
  let capturedOpts: unknown = null;
  const mockRepo = {
    findByUserId: (_userId: string, opts: unknown) => {
      capturedOpts = opts;
      return Promise.resolve([]);
    },
    countByUserId: () => Promise.resolve(0),
  };

  await usecase.execute({ userId: "user-1", limit: 10, offset: 20 });

  assertEquals(capturedOpts, { limit: 10, offset: 20, status: undefined });
});
```

### 호출 순서 검증 — 순서 의존 로직에 필수

결제, 구독 등 단계별 실행이 중요한 usecase는 호출 순서를 검증한다:

```typescript
Deno.test("CancelSubscription - setAutoRenewal 후 revoke 실행", async () => {
  const callOrder: string[] = [];
  const mockSubsRepo = {
    findActiveByUserId: () => Promise.resolve(mockSub),
    setAutoRenewal: () => { callOrder.push("setAutoRenewal"); return Promise.resolve({}); },
  };
  const mockRevoke = {
    execute: () => { callOrder.push("revoke"); return Promise.resolve(); },
  };

  await usecase.execute({ userId: "user-1" });

  assertEquals(callOrder, ["setAutoRenewal", "revoke"]);
});
```

## 테스트 케이스 구성

usecase 테스트는 최소 다음을 포함:

1. **정상 경로** — 기본 입력으로 성공 + 반환값 검증
2. **에러 경로** — 리소스 없음, 권한 없음, 외부 API 실패
3. **엣지 케이스** — 빈 배열, 경계값, null

```typescript
// 에러 경로
Deno.test("MyUseCase - 존재하지 않는 ID: NotFoundError", async () => {
  await assertRejects(
    () => usecase.execute({ id: "nonexistent" }),
    NotFoundError,
  );
});
```

**결제/구독/크레딧** usecase는 추가로:
- 외부 API(포트원 등) 실패 시 상태 일관성
- 부분 실패 시나리오 (일부 단계 성공 후 실패)
- 경계값 (잔액 == 차감액, 만료 직전 등)

## Assert

`@std/assert`만 사용:

- 동기 에러: `assertThrows(() => fn(), ErrorClass)`
- 비동기 에러: `await assertRejects(() => fn(), ErrorClass)`
- 단순 mock 반환값만 비교하는 assertion 지양 — 비즈니스 로직의 분기를 검증할 것

## Do NOT

- 모듈 레벨에 mutable 변수 선언하지 않는다 (`let captured = []` 등)
- mock에서 파라미터를 무시하지 않는다 (`_opts: unknown` → 캡처 후 검증)
- mock 기본값을 성공으로 설정하지 않는다 (override 누락 시 자동 통과 방지)
- 외부 mock 라이브러리(sinon, jest 등) 사용하지 않는다
- `import "@test/env"` 누락하지 않는다
- `console.*` 사용하지 않는다 — Logger 사용
