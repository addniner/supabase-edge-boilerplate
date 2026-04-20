import "@test/env";
import { assertEquals } from "@std/assert";
import { createSafeStreamController } from "./sse-stream.ts";

// ─── Mock Factory ────────────────────────────────────────────

function makeMockController(overrides?: {
  enqueue?: (chunk: Uint8Array) => void;
  close?: () => void;
}) {
  const calls: { method: string; arg?: unknown }[] = [];
  return {
    calls,
    controller: {
      enqueue: (chunk: Uint8Array) => {
        calls.push({ method: "enqueue", arg: chunk });
        overrides?.enqueue?.(chunk);
      },
      close: () => {
        calls.push({ method: "close" });
        overrides?.close?.();
      },
      desiredSize: 1,
    } as unknown as ReadableStreamDefaultController<Uint8Array>,
  };
}

// ─── enqueue ────────────────────────────────────────────────

Deno.test("createSafeStreamController - enqueue: 정상 전달", () => {
  const { controller, calls } = makeMockController();
  const safe = createSafeStreamController(controller);

  const chunk = new Uint8Array([1, 2, 3]);
  safe.enqueue(chunk);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].method, "enqueue");
  assertEquals(calls[0].arg, chunk);
});

Deno.test("createSafeStreamController - enqueue: 에러 발생 시 closed 전환, 이후 무시", () => {
  const { controller } = makeMockController({
    enqueue: () => { throw new Error("stream closed"); },
  });
  const safe = createSafeStreamController(controller);

  safe.enqueue(new Uint8Array([1]));
  // 에러 후 closed=true, 두 번째 호출은 무시
  safe.enqueue(new Uint8Array([2]));
  // 에러 없이 통과하면 성공
});

// ─── close ──────────────────────────────────────────────────

Deno.test("createSafeStreamController - close: 정상 호출", () => {
  const { controller, calls } = makeMockController();
  const safe = createSafeStreamController(controller);

  safe.close();

  assertEquals(calls.length, 1);
  assertEquals(calls[0].method, "close");
});

Deno.test("createSafeStreamController - close: 에러 없는 중복 호출은 controller에 전달", () => {
  const { controller, calls } = makeMockController();
  const safe = createSafeStreamController(controller);

  safe.close();
  safe.close();

  // closed 플래그는 catch에서만 설정 → 에러 없으면 두 번 다 전달
  assertEquals(calls.length, 2);
});

Deno.test("createSafeStreamController - close: 두 번째 에러 시 이후 무시", () => {
  let callCount = 0;
  const { controller } = makeMockController({
    close: () => {
      callCount++;
      if (callCount >= 2) throw new Error("already closed");
    },
  });
  const safe = createSafeStreamController(controller);

  safe.close(); // 성공
  safe.close(); // 에러 → closed=true
  safe.close(); // 무시

  assertEquals(callCount, 2);
});

Deno.test("createSafeStreamController - close: 에러 발생 시 closed 전환", () => {
  const { controller } = makeMockController({
    close: () => { throw new Error("already closed"); },
  });
  const safe = createSafeStreamController(controller);

  safe.close();
  // 에러 후 closed=true, enqueue도 무시
  safe.enqueue(new Uint8Array([1]));
  // 에러 없이 통과하면 성공
});

// ─── sseEncode ──────────────────────────────────────────────

Deno.test("createSafeStreamController - sseEncode: JSON SSE 포맷", () => {
  const { controller } = makeMockController();
  const safe = createSafeStreamController(controller);

  const encoded = safe.sseEncode({ type: "progress", value: 42 });
  const decoded = new TextDecoder().decode(encoded);

  assertEquals(decoded, `data: {"type":"progress","value":42}\n\n`);
});

// ─── close 후 enqueue ──────────────────────────────────────

Deno.test("createSafeStreamController - close 에러 후 enqueue 무시", () => {
  const { controller, calls } = makeMockController({
    close: () => { throw new Error("already closed"); },
  });
  const safe = createSafeStreamController(controller);

  safe.close(); // 에러 → closed=true
  safe.enqueue(new Uint8Array([1])); // 무시

  // close 시도는 calls에 기록되고, enqueue는 도달 안 함
  assertEquals(calls.length, 1);
  assertEquals(calls[0].method, "close");
});
