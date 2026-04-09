import "@test";

import { assertEquals } from "@std/assert";
import { resetConfigCache } from "@config";
import { replaceKongWithNgrok } from "./ngrok.ts";

// --- Helper ------------------------------------------------------------------

function withNgrokEnv(ngrokUrl: string | undefined, fn: () => void): void {
  const original = Deno.env.get("NGROK_URL");
  try {
    if (ngrokUrl === undefined) {
      Deno.env.delete("NGROK_URL");
    } else {
      Deno.env.set("NGROK_URL", ngrokUrl);
    }
    resetConfigCache();
    fn();
  } finally {
    if (original === undefined) {
      Deno.env.delete("NGROK_URL");
    } else {
      Deno.env.set("NGROK_URL", original);
    }
    resetConfigCache();
  }
}

// --- Tests -------------------------------------------------------------------

Deno.test("replaceKongWithNgrok - null 입력 -> null 반환", () => {
  withNgrokEnv(undefined, () => {
    const result = replaceKongWithNgrok(null);
    assertEquals(result, null);
  });
});

Deno.test("replaceKongWithNgrok - NGROK_URL 미설정 -> 원본 URL 반환", () => {
  withNgrokEnv(undefined, () => {
    const url = "http://kong:8000/functions/v1/api/test";
    const result = replaceKongWithNgrok(url);
    assertEquals(result, url);
  });
});

Deno.test("replaceKongWithNgrok - NGROK_URL 설정 시 -> kong:8000을 ngrok host로 치환", () => {
  withNgrokEnv("https://abc123.ngrok.io", () => {
    const url = "http://kong:8000/functions/v1/api/test";
    const result = replaceKongWithNgrok(url);
    assertEquals(result, "http://abc123.ngrok.io/functions/v1/api/test");
  });
});

Deno.test("replaceKongWithNgrok - kong:8000이 없는 URL -> 원본 그대로 반환", () => {
  withNgrokEnv("https://abc123.ngrok.io", () => {
    const url = "https://test.supabase.co/functions/v1/api/test";
    const result = replaceKongWithNgrok(url);
    assertEquals(result, url);
  });
});
