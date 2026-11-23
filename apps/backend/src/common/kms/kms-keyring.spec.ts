import { DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import * as crypto from 'crypto';
import {
  decrypt,
  encrypt,
  initKmsKeyRing,
  isEncrypted,
  resetKmsKeyRingForTesting,
  type EncryptionKeyDb,
  type EncryptionKeyRecord,
} from '@repo/db';

describe('AWS KMS Envelope KeyRing (E-02 & C-03)', () => {
  const originalEnv = process.env;
  const keyArn = 'arn:aws:kms:eu-west-2:123456789012:key/test-key';

  function createMockDb(initialRows: EncryptionKeyRecord[] = []): {
    db: EncryptionKeyDb;
    rows: EncryptionKeyRecord[];
  } {
    const rows = [...initialRows];
    const db: EncryptionKeyDb = {
      encryptionKey: {
        findMany: jest.fn(async ({ where }) =>
          rows.filter((row) => row.purpose === where.purpose),
        ),
        createMany: jest.fn(async ({ data }) => {
          if (
            rows.some(
              (row) =>
                row.purpose === data.purpose && row.version === data.version,
            )
          ) {
            return { count: 0 };
          }
          const rec: EncryptionKeyRecord = {
            id: `key-${rows.length + 1}`,
            createdAt: new Date(),
            rotatedAt: null,
            status: 'Active',
            ...data,
          };
          rows.push(rec);
          return { count: 1 };
        }),
      },
    };
    return { db, rows };
  }

  function createMockKms() {
    const wrappedStore = new Map<string, Buffer>();
    let seq = 0;
    const send = jest.fn(
      async (command: GenerateDataKeyCommand | DecryptCommand) => {
        if (command instanceof GenerateDataKeyCommand) {
          seq++;
          const plaintext = crypto.randomBytes(32);
          const cipherBlob = Buffer.from(`wrapped-dek-${seq}`);
          wrappedStore.set(
            cipherBlob.toString('base64'),
            Buffer.from(plaintext),
          );
          return {
            Plaintext: plaintext,
            CiphertextBlob: cipherBlob,
            KeyId: keyArn,
          };
        }
        if (command instanceof DecryptCommand) {
          const blobB64 = Buffer.from(
            command.input.CiphertextBlob as Uint8Array,
          ).toString('base64');
          const plaintext = wrappedStore.get(blobB64);
          if (!plaintext) {
            throw new Error('KMS InvalidCiphertextException');
          }
          return { Plaintext: Buffer.from(plaintext) };
        }
        throw new Error('Unexpected KMS command');
      },
    );
    return { send, wrappedStore };
  }

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      KMS_FIELD_WRITES_ENABLED: 'false',
      ENCRYPTION_KEY:
        '111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000',
    };
    resetKmsKeyRingForTesting();
  });

  afterEach(() => {
    resetKmsKeyRingForTesting();
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('throws FATAL [E-02] in production when AWS_KMS_DATA_KEY_ID is missing', async () => {
    const { db } = createMockDb();
    await expect(
      initKmsKeyRing(db, { kmsKeyId: '', nodeEnv: 'production' }),
    ).rejects.toThrow(/FATAL \[E-02\]/);
    await expect(
      initKmsKeyRing(db, { kmsKeyId: '', writeFieldsWithKms: true }),
    ).rejects.toThrow(/FATAL \[E-02\]/);
  });

  it('fails field writes if a process enables KMS before loading the keyring', () => {
    process.env.KMS_FIELD_WRITES_ENABLED = 'true';
    expect(() => encrypt('New value')).toThrow(
      /require an initialized keyring/,
    );
  });

  it('can require existing KMS records without generating missing keys', async () => {
    const { db, rows } = createMockDb();
    const kmsClient = createMockKms();

    await expect(
      initKmsKeyRing(db, {
        kmsKeyId: keyArn,
        kmsClient,
        bootstrapMissingKeys: false,
      }),
    ).rejects.toThrow(/No persisted KMS data keys for DB_FIELD/);
    expect(rows).toHaveLength(0);
    expect(kmsClient.send).not.toHaveBeenCalled();
  });

  it('loads persisted KMS keys while writing legacy ciphertext by default', async () => {
    const { db, rows } = createMockDb();
    const kmsClient = createMockKms();

    const options = {
      kmsKeyId: 'alias/cantra-sl-data',
      kmsClient,
      nodeEnv: 'production',
    };
    await initKmsKeyRing(db, { ...options, writeFieldsWithKms: true });
    const kmsCiphertext = encrypt('KMS text');
    expect(kmsCiphertext).toMatch(/^kms:v1:1:/);
    expect(isEncrypted(kmsCiphertext)).toBe(true);
    expect(rows.map(({ kmsKeyId }) => kmsKeyId)).toEqual([keyArn, keyArn]);

    resetKmsKeyRingForTesting();
    await expect(initKmsKeyRing(db, options)).resolves.toEqual({
      mode: 'kms',
      fieldKeyVersion: 1,
      auditKeyVersion: 1,
      writeFieldsWithKms: false,
    });
    expect(decrypt(kmsCiphertext)).toBe('KMS text');
    const legacyCiphertext = encrypt('Legacy text');
    expect(legacyCiphertext).toMatch(/^[0-9a-f]{32}:/);
    expect(decrypt(legacyCiphertext)).toBe('Legacy text');
    expect(() =>
      decrypt(kmsCiphertext?.replace('kms:v1:1:', 'kms:v1:999:')),
    ).toThrow(/key v999 is unavailable/);
    const tampered = kmsCiphertext?.replace(/([0-9a-f])$/, (digit) =>
      digit === '0' ? '1' : '0',
    );
    expect(() => decrypt(tampered)).toThrow(/KMS field authentication failed/);
  });

  it('unwraps the same persisted keys on concurrent first startup', async () => {
    const { db, rows } = createMockDb();
    const kmsClient = createMockKms();
    const options = { kmsKeyId: 'alias/cantra-sl-data', kmsClient };

    const results = await Promise.all([
      initKmsKeyRing(db, options),
      initKmsKeyRing(db, options),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect(rows).toHaveLength(2);

    const decrypts = kmsClient.send.mock.calls
      .map(([cmd]) => cmd)
      .filter((cmd): cmd is DecryptCommand => cmd instanceof DecryptCommand);
    expect(decrypts).toHaveLength(4);
    for (const row of rows) {
      expect(
        decrypts.filter(
          (cmd) =>
            cmd.input.KeyId === keyArn &&
            Buffer.from(cmd.input.CiphertextBlob ?? []).toString('base64') ===
              row.encryptedDek,
        ),
      ).toHaveLength(2);
    }
  });

  it('uses the wrapping key in existing ciphertext when old rows store an alias', async () => {
    const { db, rows } = createMockDb();
    const kmsClient = createMockKms();
    const options = { kmsKeyId: 'alias/cantra-sl-data', kmsClient };
    await initKmsKeyRing(db, { ...options, writeFieldsWithKms: true });
    const ciphertext = encrypt('Existing KMS data');

    for (const row of rows) row.kmsKeyId = options.kmsKeyId;
    kmsClient.send.mockClear();
    resetKmsKeyRingForTesting();
    await initKmsKeyRing(db, options);

    expect(decrypt(ciphertext)).toBe('Existing KMS data');
    expect(kmsClient.send).toHaveBeenCalledTimes(2);
    for (const [command] of kmsClient.send.mock.calls) {
      expect(command).toBeInstanceOf(DecryptCommand);
      expect(command.input.KeyId).toBeUndefined();
    }
  });

  it('transparently decrypts legacy v1 ciphertexts using ENCRYPTION_KEY_LEGACY while KMS is active', async () => {
    const legacyHex =
      '111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000';
    process.env.ENCRYPTION_KEY = legacyHex;
    const legacyCipher = encrypt('legacy-nhs-number');
    expect(legacyCipher).toMatch(/^[0-9a-f]{32}:/);

    delete process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY_LEGACY = legacyHex;

    const { db } = createMockDb();
    const kmsClient = createMockKms();
    await initKmsKeyRing(db, {
      kmsKeyId: 'alias/cantra-sl-data',
      kmsClient,
      nodeEnv: 'production',
      writeFieldsWithKms: true,
    });

    expect(decrypt(legacyCipher)).toBe('legacy-nhs-number');
    const newCipher = encrypt('new-nhs-number');
    expect(newCipher).toMatch(/^kms:v1:1:/);
    expect(decrypt(newCipher)).toBe('new-nhs-number');
  });
});
