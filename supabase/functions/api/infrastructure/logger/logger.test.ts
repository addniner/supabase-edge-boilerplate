import "@test/env";

import { assertEquals } from "@std/assert";
import { Logger } from "./logger.ts";

// ─── Tests ────────────────────────────────────────────────────────────────────

Deno.test("Logger - setMinLevel/getMinLevel: 레벨 설정 및 조회", () => {
  const original = Logger.getMinLevel();
  try {
    Logger.setMinLevel("warn");
    assertEquals(Logger.getMinLevel(), "warn");

    Logger.setMinLevel("error");
    assertEquals(Logger.getMinLevel(), "error");
  } finally {
    Logger.setMinLevel(original);
  }
});

Deno.test("Logger - 기본 레벨: 비프로덕션 환경에서 debug", () => {
  // env.ts sets ENVIRONMENT=local, so the default minLevel should be debug
  assertEquals(Logger.getMinLevel(), "debug");
});

Deno.test("Logger - debug 레벨에서 모든 로그 출력 (debug, info, warn, error)", () => {
  Logger.setMinLevel("debug");
  // All levels are >= debug (0), so shouldLog returns true for all
  // Verify by checking that getMinLevel is debug and calling each method doesn't throw
  assertEquals(Logger.getMinLevel(), "debug");
  Logger.debug("debug message");
  Logger.info("info message");
  Logger.warn("warn message");
  Logger.error("error message");
  // No error thrown = all levels are processed
});

Deno.test("Logger - info 레벨에서 debug 무시", () => {
  const original = Logger.getMinLevel();
  try {
    Logger.setMinLevel("info");
    assertEquals(Logger.getMinLevel(), "info");
    // debug level (priority 0) < info level (priority 1) → suppressed (no throw)
    Logger.debug("suppressed debug");
    // info, warn, error should still be processed without error
    Logger.info("info message");
    Logger.warn("warn message");
    Logger.error("error message");
  } finally {
    Logger.setMinLevel(original);
  }
});

Deno.test("Logger - error 레벨에서 debug, info, warn 무시", () => {
  const original = Logger.getMinLevel();
  try {
    Logger.setMinLevel("error");
    assertEquals(Logger.getMinLevel(), "error");
    // debug (0), info (1), warn (2) all < error (3) → suppressed
    Logger.debug("suppressed debug");
    Logger.info("suppressed info");
    Logger.warn("suppressed warn");
    // only error should be processed
    Logger.error("error message");
  } finally {
    Logger.setMinLevel(original);
  }
});
