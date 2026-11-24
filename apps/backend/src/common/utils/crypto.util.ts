import { decrypt } from '@repo/db';

/**
 * Reads both encrypted values and historical plaintext. Invalid ciphertext
 * propagates the decryption error.
 */
export function safeDecryptStr(val?: string | null): string | null {
  if (!val) return val ?? null;
  return decrypt(val) ?? val;
}
