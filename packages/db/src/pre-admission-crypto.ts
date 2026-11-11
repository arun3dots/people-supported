import { decrypt, encrypt, isEncrypted } from "./crypto";

/**
 * ResidentPreAdmission field-level encryption (E-02).
 * - Parts B, E and F are encrypted as a whole: the JSON is stringified,
 *   encrypted, and stored as a JSON string in the JSONB column.
 * - Part A keeps its structure; only the identifiers below are encrypted.
 */
export const PRE_ADMISSION_ENCRYPTED_PARTS = ["partB", "partE", "partF"] as const;

export const PRE_ADMISSION_SENSITIVE_KEYS = {
  partA: ["dob", "nhsNumber", "nationalId", "previousAddress"],
} as const;

type EncryptedPart = (typeof PRE_ADMISSION_ENCRYPTED_PARTS)[number];
type KeyedPart = keyof typeof PRE_ADMISSION_SENSITIVE_KEYS;

const isWholePart = (key: string): key is EncryptedPart =>
  (PRE_ADMISSION_ENCRYPTED_PARTS as readonly string[]).includes(key);

const isKeyedPart = (key: string): key is KeyedPart =>
  key in PRE_ADMISSION_SENSITIVE_KEYS;

// Skips Prisma sentinels (DbNull/JsonNull), Dates and other class instances.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

export function encryptWholePart(value: unknown): unknown {
  if (Array.isArray(value) || isPlainObject(value)) {
    return encrypt(JSON.stringify(value));
  }
  return value;
}

export function decryptWholePart(value: unknown): unknown {
  if (typeof value !== "string" || !isEncrypted(value)) return value;
  const plain = decrypt(value);
  if (!plain) return null;
  try {
    return JSON.parse(plain) as unknown;
  } catch {
    return null;
  }
}

function mapSensitiveKeys(
  value: unknown,
  keys: readonly string[],
  fn: (text: string) => string | null | undefined,
): unknown {
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = { ...value };
  for (const key of keys) {
    const current = out[key];
    if (typeof current === "string" && current) {
      out[key] = fn(current) ?? current;
    }
  }
  return out;
}

export function encryptPartA(value: unknown): unknown {
  return mapSensitiveKeys(value, PRE_ADMISSION_SENSITIVE_KEYS.partA, (t) =>
    encrypt(t),
  );
}

export function decryptPartA(value: unknown): unknown {
  return mapSensitiveKeys(value, PRE_ADMISSION_SENSITIVE_KEYS.partA, (t) =>
    decrypt(t),
  );
}

/** Returns a copy of a write payload with sensitive parts encrypted. */
export function encryptPreAdmissionData<T extends Record<string, unknown>>(
  data: T,
): T {
  const out: Record<string, unknown> = { ...data };
  for (const key of Object.keys(out)) {
    if (isWholePart(key)) out[key] = encryptWholePart(out[key]);
    else if (isKeyedPart(key)) out[key] = encryptPartA(out[key]);
  }
  return out as T;
}
