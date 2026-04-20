---
description: Usecase layer rules - all business logic lives here
paths:
  - supabase/functions/api/application/usecases/**
---

# Usecase Layer Rules

## Purpose

Usecases contain **all business logic**. Route handlers always call usecases, never repositories directly.

## Core Principles

- ✅ **All business logic** — Both single-domain and cross-domain
- ✅ **Single responsibility** — One class, one `execute()` method
- ✅ **Constructor DI** — Default instances for production, mock injection for tests
- ✅ **Plain input/output** — No HTTP concerns (Hono context, Request, Response)
- ✅ **Own DTO + Mapper** — 각 usecase 그룹이 자기 dto.ts, mapper.ts 소유
- ❌ **No framework concerns** — No middleware, no route definitions
- ❌ **No direct DB queries** — Always use repositories
- ❌ **No service layer** — Services are replaced by usecases

## Template

```typescript
import { NotFoundError } from "@domain/exceptions";
import type { PaymentGateway } from "@domain/gateways";
import { Logger } from "@logger";
import type { PaymentsRepository, CreditsRepository } from "@domain/repositories";
import { PaymentsRepositoryImpl, CreditsRepositoryImpl } from "@repositories";
import { PortOnePaymentAdapter } from "@adapters";

export class MyUseCase {
  constructor(
    private paymentsRepo: PaymentsRepository = new PaymentsRepositoryImpl(),
    private creditsRepo: CreditsRepository = new CreditsRepositoryImpl(),
    private portone: PaymentGateway = new PortOnePaymentAdapter(),   // gateway DI
  ) {}

  async execute(input: { userId: string }) {
    // business logic
  }
}
```

## Usecase Group Structure

```
application/usecases/payment-processing/
├── handle-payment-paid.usecase.ts
├── get-payment-history.usecase.ts
├── dto.ts              # Input/Output 타입 정의
├── mapper.ts           # 외부 응답 → 내부 모델 변환
├── index.ts            # barrel export
└── *.usecase.test.ts
```

## DI 패턴

```typescript
// 패턴 1: 구현체 직접 주입 (repository, gateway adapter)
private portone: PaymentGateway = new PortOnePaymentAdapter(),

// 패턴 2a: factory 함수 주입 (provider 분기 필요 시)
private gatewayFactory: typeof createStockVideoGateway = createStockVideoGateway,

// 패턴 2b: factory 함수 DI (route에서 API keys만 전달, usecase 내부에서 gateway 생성)
private gatewaysFactory: (apiKeys: TtsApiKeys) => TtsGateway[] = createTtsGateways,

// 패턴 3: 일반 함수 주입 (adapter 미전환 과도기)
private chatCompletion: typeof createChatCompletion = createChatCompletion,
```

## Important Notes

- Route → UseCase → Repository/Gateway (service 레이어 없음)
- Usecase 간 조합 가능 (`@usecases/*` alias로 import)
- 도메인 규칙은 `@domain`에서 import (generatePaymentId, Permission 등)
- 외부 API adapter는 `@domain/gateways` 인터페이스로 DI (PaymentGateway 등), 구현체는 `@adapters`에서 import
- gateway factory는 `@factories`에서 import (createTtsGateway, createStockVideoGateway)
- 테스트 파일 동위치: `*.usecase.test.ts`
