import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PUBLIC_DEMO_HEX_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

/**
 * Validates that ENCRYPTION_KEY is explicitly configured as a 64-character hex
 * string (32 bytes for AES-256-GCM) and rejects the public demo key in production.
 * Satisfies Compliance Finding E-02 (Fail closed without ENCRYPTION_KEY).
 */
export function assertEncryptionKeyConfigured(
  rawKey: string | undefined = process.env.ENCRYPTION_KEY,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  if (!rawKey || !/^[0-9a-fA-F]{64}$/.test(rawKey.trim())) {
    throw new Error(
      "FATAL [E-02]: ENCRYPTION_KEY environment variable is required and must be a 64-character hex string (32 bytes).",
    );
  }
  const normalized = rawKey.trim();
  if (
    nodeEnv === "production" &&
    normalized.toLowerCase() === PUBLIC_DEMO_HEX_KEY
  ) {
    throw new Error(
      "FATAL [E-02]: Refusing to use known public default ENCRYPTION_KEY in production.",
    );
  }
  return normalized;
}

function resolveKeyHex(): string {
  if (
    !process.env.ENCRYPTION_KEY &&
    process.env.NODE_ENV === "test" &&
    process.env.STRICT_SECRET_CHECK !== "true"
  ) {
    // Allow isolated unit tests that don't test missing-key failure to run
    // with an ephemeral test key unless STRICT_SECRET_CHECK='true' is set.
    return "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
  }
  return assertEncryptionKeyConfigured();
}

export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  // Encrypted strings start with a 32-character hex IV followed by a colon
  return /^[0-9a-fA-F]{32}:/.test(text);
}

export function encrypt(
  text: string | null | undefined,
): string | null | undefined {
  if (!text) return text;
  if (isEncrypted(text)) return text;

  const keyHex = resolveKeyHex();
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(keyHex, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:encryptedText
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function tryDecryptGcm(
  ivHex: string,
  authTagHex: string,
  encryptedText: string,
  keyHex: string,
): string | null {
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(keyHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

function decryptOnce(text: string): string {
  if (!text.includes(":")) return text;

  const parts = text.split(":");

  // 1. Try Primary AES-256-GCM (3 parts: iv:authTag:ciphertext)
  if (parts.length === 3) {
    const keyHex = resolveKeyHex();
    const primaryDecrypted = tryDecryptGcm(
      parts[0]!,
      parts[1]!,
      parts[2]!,
      keyHex,
    );
    if (primaryDecrypted !== null) {
      return primaryDecrypted;
    }

    // 2. Try Key-Rotation fallback (ENCRYPTION_KEY_PREVIOUS) if configured
    const prevKey = process.env.ENCRYPTION_KEY_PREVIOUS?.trim();
    if (prevKey && /^[0-9a-fA-F]{64}$/.test(prevKey)) {
      const rotatedDecrypted = tryDecryptGcm(
        parts[0]!,
        parts[1]!,
        parts[2]!,
        prevKey,
      );
      if (rotatedDecrypted !== null) {
        return rotatedDecrypted;
      }
    }
  }

  return text;
}

export function decrypt(
  text: string | null | undefined,
): string | null | undefined {
  if (!text) return text;
  let current = text;
  let attempts = 0;

  // Recursively unwrap multi-layer encrypted strings (up to 100 iterations safety guard)
  while (
    current &&
    typeof current === "string" &&
    isEncrypted(current) &&
    attempts < 100
  ) {
    const next = decryptOnce(current);
    if (next === current) break;
    current = next;
    attempts++;
  }

  return current;
}
