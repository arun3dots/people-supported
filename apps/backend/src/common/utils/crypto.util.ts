import { decrypt } from '@repo/db';

/**
 * Safely decrypts a string. If the value is empty or not decryptable,
 * returns the original value or null.
 */
export function safeDecryptStr(val?: string | null): string | null {
  if (!val) return val ?? null;
  return decrypt(val) ?? val;
}
