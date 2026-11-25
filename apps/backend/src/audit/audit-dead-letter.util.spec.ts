import { Logger } from '@nestjs/common';
import { encrypt, initKmsKeyRing, resetKmsKeyRingForTesting } from '@repo/db';
import { drainDeadLetterQueue } from './audit-dead-letter.util';

const mockLpop = jest.fn();
const mockRpush = jest.fn();
jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => ({ lpop: mockLpop, rpush: mockRpush, on: jest.fn() })),
}));

describe('audit dead-letter replay', () => {
  const oldEnv = process.env;
  const arn = 'arn:aws:kms:eu-north-1:123456789012:key/test-key';

  beforeEach(() => {
    process.env = {
      ...oldEnv,
      REDIS_URL: 'redis://fixture.invalid',
      KMS_FIELD_WRITES_ENABLED: 'false',
    };
  });
  afterEach(() => {
    process.env = oldEnv;
    resetKmsKeyRingForTesting();
    jest.resetAllMocks();
  });

  it('replays legacy and KMS ciphertext while retaining an unreadable entry', async () => {
    const event = {
      categoryType: 'AUTH',
      actionType: 'LOGIN',
      entityLabel: 'fixture-only',
    };
    const encoded = JSON.stringify({ event });
    const legacy = encrypt(encoded);
    await initKmsKeyRing(
      {
        encryptionKey: {
          findMany: async ({ where }) => [
            {
              id: where.purpose,
              purpose: where.purpose,
              status: 'Active',
              version: 1,
              kmsKeyId: arn,
              encryptedDek: 'dGVzdA==',
              createdAt: new Date(),
              rotatedAt: null,
            },
          ],
          createMany: async () => {
            throw new Error('No key creation expected');
          },
        },
      },
      {
        kmsKeyId: arn,
        kmsClient: { send: async () => ({ Plaintext: Buffer.alloc(32, 7) }) },
        writeFieldsWithKms: true,
      },
    );
    const kms = encrypt(encoded);
    const invalidJson = encrypt('fixture-sensitive-invalid-json');
    mockLpop
      .mockResolvedValueOnce(legacy)
      .mockResolvedValueOnce(kms)
      .mockResolvedValueOnce(invalidJson);
    const logger = new Logger('Fixture');
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const replay = jest.fn().mockResolvedValue(undefined);

    await expect(drainDeadLetterQueue(replay, logger)).resolves.toBe(2);
    expect(replay.mock.calls).toEqual([[event], [event]]);
    expect(mockRpush).toHaveBeenCalledWith(
      'cqc:audit:dead-letter:v1',
      invalidJson,
    );
    expect(warn).toHaveBeenCalledWith(
      'Encrypted audit dead-letter replay failed. Entry retained for retry.',
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('fixture-sensitive');
  });
});
