import "@test/env";
import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { resetConfigCache } from "@config";
import { encryptSecret, decryptSecret } from "./crypto.ts";

Deno.test("encryptSecret/decryptSecret - 암호화 후 복호화하면 원본 복원", async () => {
  Deno.env.set("ENCRYPTION_KEY", "test-encryption-key-for-unit-test");
  resetConfigCache();

  const original = "super-secret-api-key-for-testing-12345";
  const encrypted = await encryptSecret(original);

  assertNotEquals(encrypted, original);
  const decrypted = await decryptSecret(encrypted);
  assertEquals(decrypted, original);
});

Deno.test("encryptSecret - 같은 입력도 매번 다른 암호문 생성 (랜덤 IV)", async () => {
  Deno.env.set("ENCRYPTION_KEY", "test-encryption-key-for-unit-test");
  resetConfigCache();

  const original = "another-test-key-67890";
  const a = await encryptSecret(original);
  const b = await encryptSecret(original);

  assertNotEquals(a, b);

  assertEquals(await decryptSecret(a), original);
  assertEquals(await decryptSecret(b), original);
});

Deno.test("decryptSecret - 잘못된 키로 복호화 시 실패", async () => {
  Deno.env.set("ENCRYPTION_KEY", "key-A");
  resetConfigCache();
  const encrypted = await encryptSecret("secret-data");

  Deno.env.set("ENCRYPTION_KEY", "key-B");
  resetConfigCache();
  await assertRejects(
    () => decryptSecret(encrypted),
  );
});

Deno.test("encryptSecret - ENCRYPTION_KEY 미설정 시 에러", async () => {
  Deno.env.delete("ENCRYPTION_KEY");
  resetConfigCache();

  await assertRejects(
    () => encryptSecret("test"),
    Error,
    "ENCRYPTION_KEY",
  );
});
