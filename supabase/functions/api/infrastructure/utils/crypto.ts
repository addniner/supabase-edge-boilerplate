/**
 * AES-256-GCM 대칭 암호화 유틸리티
 *
 * 민감한 데이터를 암호화/복호화한다.
 * config의 `ENCRYPTION_KEY`를 암호화 키로 사용.
 *
 * 형식: base64(IV(12) + ciphertext + authTag)
 */

import { getConfig } from "@config";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100_000;
const SALT = new TextEncoder().encode("supabase-edge-secret");

async function deriveKey(password: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: SALT, iterations: KEY_ITERATIONS },
    raw,
    256,
  );

  return crypto.subtle.importKey("raw", bits, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const encryptionKey = getConfig().security.ENCRYPTION_KEY;

  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(ciphertext: string): Promise<string> {
  const encryptionKey = getConfig().security.ENCRYPTION_KEY;

  const key = await deriveKey(encryptionKey);
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted,
  );

  return new TextDecoder().decode(decrypted);
}
