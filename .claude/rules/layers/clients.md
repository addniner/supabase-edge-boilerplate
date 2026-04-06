---
paths:
  - supabase/functions/api/infrastructure/clients/**/*.ts
---

# Client Layer Rules

## Purpose

Clients handle **external API calls** and nothing else.

## Core Principles

- ✅ **외부 API 호출만** - 비즈니스 로직 없음
- ✅ **클래스로 구현** - DI를 통한 테스트 가능성 확보
- ✅ **자체 응답 타입 정의** - 외부 API 응답 형태를 인터페이스로 선언
- ✅ **에러 변환** - 외부 API 에러를 DomainError로 변환
- ❌ **Entity 타입 import 금지** - repository 타입과 독립적
- ❌ **비즈니스 로직 금지** - 데이터 변환은 usecase에서

## Template

```typescript
import { InternalServerError } from "@errors";
import { Logger } from "@logger";
import { getConfig } from "@config";

export interface MyApiResponse {
  id: string;
  title: string;
}

export class MyClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? getConfig().externalApi.MY_API_KEY;
  }

  async fetchItems(): Promise<MyApiResponse[]> {
    const res = await fetch("https://api.example.com/items", {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      Logger.error("[MyClient] API 실패", { status: res.status });
      throw new InternalServerError(`MyAPI error: ${res.status}`);
    }

    return await res.json();
  }
}

```

## Important Notes

- 클래스 생성자에서 API key를 DI로 받되, 기본값은 `getConfig()`에서
- `ElevenLabsClient` 참고 (`clients/elevenlabs.client.ts`)
