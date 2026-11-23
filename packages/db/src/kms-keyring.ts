import {
  DecryptCommand,
  GenerateDataKeyCommand,
  KMSClient,
} from "@aws-sdk/client-kms";
import { getAwsClientConfig } from "./aws-client-config";

export type EncryptionKeyPurpose = "DB_FIELD" | "AUDIT_HMAC";

export interface EncryptionKeyRecord {
  id: string;
  version: number;
  purpose: string;
  kmsKeyId: string;
  encryptedDek: string;
  status: string;
  createdAt: Date;
  rotatedAt: Date | null;
}

export interface EncryptionKeyDb {
  encryptionKey: {
    findMany(args: {
      where: { purpose: EncryptionKeyPurpose };
    }): Promise<EncryptionKeyRecord[]>;
    createMany(args: {
      data: Pick<
        EncryptionKeyRecord,
        "version" | "purpose" | "kmsKeyId" | "encryptedDek"
      >;
      skipDuplicates: true;
    }): Promise<{ count: number }>;
  };
}

export interface KmsClientLike {
  send(command: GenerateDataKeyCommand | DecryptCommand): Promise<{
    KeyId?: string;
    Plaintext?: Uint8Array;
    CiphertextBlob?: Uint8Array;
  }>;
}

export interface KmsConnectionOptions {
  kmsKeyId?: string;
  region?: string;
  kmsClient?: KmsClientLike;
}

interface InitKmsKeyRingOptions extends KmsConnectionOptions {
  nodeEnv?: string;
  writeFieldsWithKms?: boolean;
  bootstrapMissingKeys?: boolean;
}

interface KeySet {
  keys: Map<number, Buffer>;
  activeVersion: number;
}

interface KmsKeyRingState {
  field: KeySet;
  audit: KeySet;
  writeFieldsWithKms: boolean;
}

const globalForKeyRing = globalThis as typeof globalThis & {
  __cantraKmsKeyRingState?: KmsKeyRingState;
};
const KEY_ARN = /^arn:[^:]+:kms:[^:]+:\d{12}:key\/.+$/;

export function getKmsClient(options: KmsConnectionOptions): KmsClientLike {
  if (options.kmsClient) return options.kmsClient;
  const config = getAwsClientConfig();
  return new KMSClient({ ...config, region: options.region || config.region });
}

export async function generateWrappedDataKey(
  kmsClient: KmsClientLike,
  kmsKeyId: string,
): Promise<{ kmsKeyId: string; encryptedDek: string }> {
  const generated = await kmsClient.send(
    new GenerateDataKeyCommand({ KeyId: kmsKeyId, KeySpec: "AES_256" }),
  );
  try {
    if (
      !generated.KeyId ||
      !KEY_ARN.test(generated.KeyId) ||
      (KEY_ARN.test(kmsKeyId) && kmsKeyId !== generated.KeyId) ||
      !generated.CiphertextBlob?.byteLength ||
      generated.Plaintext?.byteLength !== 32
    ) {
      throw new Error(
        "FATAL [E-02]: KMS returned an invalid wrapped data key.",
      );
    }
    return {
      kmsKeyId: generated.KeyId,
      encryptedDek: Buffer.from(generated.CiphertextBlob).toString("base64"),
    };
  } finally {
    generated.Plaintext?.fill(0);
  }
}

export async function unwrapDataKey(
  kmsClient: KmsClientLike,
  wrappedKey: { kmsKeyId: string; encryptedDek: string },
  label: string,
): Promise<Buffer> {
  const { kmsKeyId, encryptedDek } = wrappedKey;
  const result = await kmsClient.send(
    new DecryptCommand({
      // Legacy rows can contain an alias. The blob holds the original key ID.
      KeyId: KEY_ARN.test(kmsKeyId) ? kmsKeyId : undefined,
      CiphertextBlob: Buffer.from(encryptedDek, "base64"),
    }),
  );
  try {
    if (result.Plaintext?.byteLength !== 32) {
      throw new Error(`FATAL [E-02]: Invalid KMS data key for ${label}.`);
    }
    return Buffer.from(result.Plaintext);
  } finally {
    result.Plaintext?.fill(0);
  }
}

async function loadKeySet(
  db: EncryptionKeyDb,
  kmsClient: KmsClientLike,
  kmsKeyId: string,
  purpose: EncryptionKeyPurpose,
  bootstrapMissingKeys: boolean,
): Promise<KeySet> {
  const where = { purpose };
  let rows = await db.encryptionKey.findMany({ where });
  if (rows.length === 0) {
    if (!bootstrapMissingKeys) {
      throw new Error(
        `FATAL [E-02]: No persisted KMS data keys for ${purpose}.`,
      );
    }
    const wrapped = await generateWrappedDataKey(kmsClient, kmsKeyId);
    await db.encryptionKey.createMany({
      data: { version: 1, purpose, ...wrapped },
      skipDuplicates: true,
    });
    // Every process unwraps the persisted key, including the loser of a startup race.
    rows = await db.encryptionKey.findMany({ where });
  }

  const active = rows.filter((row) => row.status === "Active");
  if (active.length !== 1 || !active[0]) {
    throw new Error(
      `FATAL [E-02]: Expected one active KMS data key for ${purpose}.`,
    );
  }

  const keys = new Map<number, Buffer>();
  for (const row of rows) {
    if (row.status === "Retired") continue;
    if (row.status !== "Active" && row.status !== "DecryptOnly") {
      throw new Error(
        `FATAL [E-02]: Invalid KMS key status for ${purpose} v${row.version}.`,
      );
    }
    keys.set(
      row.version,
      await unwrapDataKey(kmsClient, row, `${purpose} v${row.version}`),
    );
  }
  return { activeVersion: active[0].version, keys };
}

export async function initKmsKeyRing(
  db: EncryptionKeyDb,
  options: InitKmsKeyRingOptions = {},
): Promise<
  | { mode: "legacy" }
  | {
      mode: "kms";
      fieldKeyVersion: number;
      auditKeyVersion: number;
      writeFieldsWithKms: boolean;
    }
> {
  const kmsKeyId = (
    options.kmsKeyId ??
    process.env.AWS_KMS_DATA_KEY_ID ??
    ""
  ).trim();
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const writeFieldsWithKms =
    options.writeFieldsWithKms ??
    process.env.KMS_FIELD_WRITES_ENABLED === "true";
  if (!kmsKeyId) {
    if (nodeEnv === "production" || writeFieldsWithKms) {
      throw new Error(
        "FATAL [E-02]: AWS_KMS_DATA_KEY_ID is required for KMS encryption.",
      );
    }
    return { mode: "legacy" };
  }

  const kmsClient = getKmsClient(options);
  const bootstrapMissingKeys = options.bootstrapMissingKeys ?? true;
  const field = await loadKeySet(
    db,
    kmsClient,
    kmsKeyId,
    "DB_FIELD",
    bootstrapMissingKeys,
  );
  const audit = await loadKeySet(
    db,
    kmsClient,
    kmsKeyId,
    "AUDIT_HMAC",
    bootstrapMissingKeys,
  );
  globalForKeyRing.__cantraKmsKeyRingState = {
    field,
    audit,
    writeFieldsWithKms,
  };

  return {
    mode: "kms",
    fieldKeyVersion: field.activeVersion,
    auditKeyVersion: audit.activeVersion,
    writeFieldsWithKms,
  };
}

export function getActiveFieldEncryptionKey(): {
  version: number;
  key: Buffer;
} | null {
  const state = globalForKeyRing.__cantraKmsKeyRingState;
  if (!state) {
    if (process.env.KMS_FIELD_WRITES_ENABLED === "true") {
      throw new Error(
        "FATAL [E-02]: KMS field writes require an initialized keyring.",
      );
    }
    return null;
  }
  if (!state.writeFieldsWithKms) return null;
  const version = state.field.activeVersion;
  const key = state.field.keys.get(version);
  if (!key)
    throw new Error(
      `FATAL [E-02]: Active KMS field key v${version} is unavailable.`,
    );
  return { version, key };
}

export function getFieldDecryptionKey(version: number): Buffer | undefined {
  return globalForKeyRing.__cantraKmsKeyRingState?.field.keys.get(version);
}

export function getAllAuditHmacKeys(): Buffer[] {
  const audit = globalForKeyRing.__cantraKmsKeyRingState?.audit;
  return audit ? [...audit.keys.values()] : [];
}

export function resetKmsKeyRingForTesting(): void {
  const state = globalForKeyRing.__cantraKmsKeyRingState;
  if (!state) return;
  for (const set of [state.field, state.audit]) {
    for (const key of set.keys.values()) key.fill(0);
  }
  delete globalForKeyRing.__cantraKmsKeyRingState;
}
