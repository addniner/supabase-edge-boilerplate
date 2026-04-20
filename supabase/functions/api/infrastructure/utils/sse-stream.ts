/**
 * SSE Stream 유틸리티
 * ReadableStream에서 안전한 enqueue/close를 제공
 */

export interface SafeStreamController {
  enqueue: (chunk: Uint8Array) => void;
  close: () => void;
  sseEncode: (data: Record<string, unknown>) => Uint8Array;
  encoder: TextEncoder;
}

/**
 * ReadableStream controller를 감싸서 이미 닫힌 스트림에
 * enqueue/close 시도 시 에러를 무시하는 래퍼를 생성
 */
export function createSafeStreamController(
  controller: ReadableStreamDefaultController<Uint8Array>,
): SafeStreamController {
  let closed = false;
  const encoder = new TextEncoder();

  return {
    encoder,
    enqueue: (chunk: Uint8Array) => {
      if (closed) return;
      try { controller.enqueue(chunk); } catch { closed = true; }
    },
    close: () => {
      if (closed) return;
      try { controller.close(); } catch { closed = true; }
    },
    sseEncode: (data: Record<string, unknown>) =>
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
  };
}
