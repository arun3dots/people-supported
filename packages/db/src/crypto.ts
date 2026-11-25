import * as crypto from "crypto";
import {
  getActiveFieldEncryptionKey,
  getFieldDecryptionKey,
} from "./kms-keyring";

const ALGORITHM = "aes-256-gcm";
const PUBLIC_DEMO_HEX_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TEST_EPHEMERAL_HEX_KEY =
  "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
const KMS_ENVELOPE_REGEX =
  /^kms:v1:([1-9]\d*):([0-9a-f]{32}):([0-9a-f]{32}):([0-9a-f]*)$/i;
const LEGACY_ENVELOPE_REGEX = /^([0-9a-f]{32}):([0-9a-f]{32}):([0-9a-f]*)$/i;
const KMS_ENVELOPE_PREFIX = /^kms:/i;
const LEGACY_ENVELOPE_PREFIX = /^[0-9a-f]{32}:/i;

type DecryptionFailure =
  | "key_unavailable"
  | "authentication"
  | "invalid_envelope"
  | "invalid_json";
let reportDecryptionFailure: ((reason: DecryptionFailure) => void) | undefined;

export function setDecryptionFailureReporter(
  reporter?: (reason: DecryptionFailure) => void,
): void {
  reportDecryptionFailure = reporter;
}

export function decryptionFailure(
  reason: DecryptionFailure,
  message: string,
): Error {
  reportDecryptionFailure?.(reason);
  return new Error(message);
}

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
    return TEST_EPHEMERAL_HEX_KEY;
  }
  return assertEncryptionKeyConfigured();
}

export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  return KMS_ENVELOPE_PREFIX.test(text) || LEGACY_ENVELOPE_PREFIX.test(text);
}

export function encrypt(
  text: string | null | undefined,
): string | null | undefined {
  if (!text) return text;
  if (isEncrypted(text)) {
    decrypt(text);
    return text;
  }

  const iv = crypto.randomBytes(16);
  const kmsKey = getActiveFieldEncryptionKey();
  const key = kmsKey ? kmsKey.key : Buffer.from(resolveKeyHex(), "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  if (kmsKey) {
    return `kms:v1:${kmsKey.version}:${iv.toString("hex")}:${authTag}:${encrypted}`;
  }
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function tryDecryptGcm(
  ivHex: string,
  authTagHex: string,
  encryptedText: string,
  keyInput: string | Buffer,
): string | null {
  if (encryptedText.length % 2 !== 0) return null;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key =
      typeof keyInput === "string" ? Buffer.from(keyInput, "hex") : keyInput;
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

function resolveLegacyDecryptKeys(): string[] {
  const candidates: string[] = [];
  for (const raw of [
    process.env.ENCRYPTION_KEY_LEGACY,
    process.env.ENCRYPTION_KEY,
    process.env.ENCRYPTION_KEY_PREVIOUS,
  ]) {
    const trimmed = raw?.trim();
    if (trimmed && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
      candidates.push(trimmed);
    }
  }
  if (
    candidates.length === 0 &&
    process.env.NODE_ENV === "test" &&
    process.env.STRICT_SECRET_CHECK !== "true"
  ) {
    candidates.push(TEST_EPHEMERAL_HEX_KEY);
  }
  return candidates;
}

function decryptOnce(text: string): string {
  const kmsMatch = text.match(KMS_ENVELOPE_REGEX);
  if (kmsMatch) {
    const version = Number(kmsMatch[1]);
    const key = getFieldDecryptionKey(version);
    if (!key) {
      throw decryptionFailure(
        "key_unavailable",
        `[E-02] KMS field key v${version} is unavailable.`,
      );
    }
    const decrypted = tryDecryptGcm(
      kmsMatch[2]!,
      kmsMatch[3]!,
      kmsMatch[4]!,
      key,
    );
    if (decrypted === null) {
      throw decryptionFailure(
        "authentication",
        `[E-02] KMS field authentication failed for key v${version}.`,
      );
    }
    return decrypted;
  }
  const legacyMatch = text.match(LEGACY_ENVELOPE_REGEX);
  if (!legacyMatch) {
    throw decryptionFailure(
      "invalid_envelope",
      "[E-02] Invalid encrypted field envelope.",
    );
  }
  for (const keyHex of resolveLegacyDecryptKeys()) {
    const decrypted = tryDecryptGcm(
      legacyMatch[1]!,
      legacyMatch[2]!,
      legacyMatch[3]!,
      keyHex,
    );
    if (decrypted !== null) return decrypted;
  }
  throw decryptionFailure(
    "authentication",
    "[E-02] Legacy field authentication failed.",
  );
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

  if (isEncrypted(current)) {
    throw decryptionFailure(
      "invalid_envelope",
      "[E-02] Could not fully unwrap encrypted field.",
    );
  }
  return current;
}

export function inspectCiphertext(
  value: string,
  encryptedJson = false,
): {
  format: "legacy" | "kms" | "plaintext";
  version?: number;
  candidate: boolean;
} {
  const match = value.match(KMS_ENVELOPE_REGEX);
  const inner = match ? decryptOnce(value) : value;
  const decoded = decrypt(inner);
  if (encryptedJson && isEncrypted(value)) {
    try {
      if (typeof decoded !== "string") throw new Error();
      JSON.parse(decoded);
    } catch {
      throw decryptionFailure(
        "invalid_json",
        "[E-02] Encrypted field does not contain valid JSON.",
      );
    }
  }
  if (match)
    return {
      format: "kms",
      version: Number(match[1]),
      candidate: inner !== decoded,
    };
  return {
    format: isEncrypted(value) ? "legacy" : "plaintext",
    candidate: true,
  };
}

export function reencryptWithKms(text: string): string {
  const isKmsEnvelope = KMS_ENVELOPE_REGEX.test(text);
  const inner = isKmsEnvelope ? decryptOnce(text) : text;
  const plaintext = decrypt(inner);
  if (typeof plaintext !== "string" || isEncrypted(plaintext)) {
    throw new Error("[E-02] Could not fully unwrap field for KMS backfill.");
  }
  if (isKmsEnvelope && inner === plaintext) return text;
  if (!plaintext) return plaintext;

  const replacement = encrypt(plaintext);
  if (!replacement || !KMS_ENVELOPE_REGEX.test(replacement)) {
    throw new Error("[E-02] Backfill requires an active KMS field write key.");
  }
  return replacement;
}
