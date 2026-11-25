import { DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  initKmsKeyRing,
  resetKmsKeyRingForTesting,
  getAllAuditHmacKeys,
  type EncryptionKeyDb,
  type EncryptionKeyRecord,
} from '@repo/db';

const mockAuditLogs: Array<Record<string, unknown>> = [];
const mockPrismaAuditClient = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  cqcAuditLog: {
    findFirst: jest.fn(
      async () => mockAuditLogs[mockAuditLogs.length - 1] ?? null,
    ),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const rec = {
        id: `audit-${mockAuditLogs.length + 1}`,
        timestamp: new Date(),
        ...data,
      };
      mockAuditLogs.push(rec);
      return rec;
    }),
    findMany: jest.fn(async () => [...mockAuditLogs]),
    count: jest.fn(async () => mockAuditLogs.length),
  },
  auditIntegrityBlock: {
    findFirst: jest.fn(async () => null),
    create: jest.fn(async () => ({})),
  },
};

jest.mock('@repo/audit-db', () => ({
  Prisma: {},
  PrismaClient: jest.fn(() => mockPrismaAuditClient),
}));

import { AuditDbService } from './audit-db.service';
import { computeAuditRecordHash } from './audit-hash.util';
import type { AuditEvent } from './audit.types';

describe('AuditDbService KMS HMAC Signing (C-03)', () => {
  beforeEach(() => {
    mockAuditLogs.length = 0;
    resetKmsKeyRingForTesting();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetKmsKeyRingForTesting();
  });

  it('returns and logs a sanitized error when the audit insert fails', async () => {
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    mockPrismaAuditClient.cqcAuditLog.create.mockRejectedValueOnce(
      new Error('fixture-sensitive-database-detail'),
    );
    try {
      const auditDb = new AuditDbService();
      await expect(
        auditDb.writeEvent({ categoryType: 'AUTH', actionType: 'LOGIN' }, true),
      ).rejects.toThrow('Audit event could not be written.');
      expect(logger.mock.calls).toEqual([
        ['Failed to write audit event to the audit database.'],
      ]);
    } finally {
      logger.mockRestore();
    }
  });

  it('continues signing with the legacy key and verifies KMS-signed history', async () => {
    const storedRows: EncryptionKeyRecord[] = [];
    const dekStore = new Map<string, Buffer>();
    let seq = 0;

    const db: EncryptionKeyDb = {
      encryptionKey: {
        findMany: jest.fn(async ({ where }) =>
          storedRows.filter((r) => r.purpose === where.purpose),
        ),
        createMany: jest.fn(async ({ data }) => {
          const rec: EncryptionKeyRecord = {
            id: `k-${storedRows.length + 1}`,
            createdAt: new Date(),
            rotatedAt: null,
            status: 'Active',
            ...data,
          };
          storedRows.push(rec);
          return { count: 1 };
        }),
      },
    };

    const kmsClient = {
      send: jest.fn(async (command: unknown) => {
        if (command instanceof GenerateDataKeyCommand) {
          seq++;
          const pt = crypto.randomBytes(32);
          const blob = Buffer.from(`wrapped-${seq}`);
          dekStore.set(blob.toString('base64'), Buffer.from(pt));
          return {
            Plaintext: pt,
            CiphertextBlob: blob,
            KeyId: 'arn:aws:kms:eu-west-2:123456789012:key/test-key',
          };
        }
        if (command instanceof DecryptCommand) {
          const b64 = Buffer.from(
            command.input.CiphertextBlob as Uint8Array,
          ).toString('base64');
          const plaintext = dekStore.get(b64);
          return { Plaintext: plaintext && Buffer.from(plaintext) };
        }
        throw new Error('Unexpected KMS command');
      }),
    };

    await initKmsKeyRing(db, {
      kmsKeyId: 'alias/cantra-sl-data',
      kmsClient,
      nodeEnv: 'production',
    });

    const auditDb = new AuditDbService();
    const event: AuditEvent = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      categoryType: 'AUTH',
      actionType: 'LOGIN',
      entityType: 'User',
      entityId: 'user-1',
    };
    const [auditKey] = getAllAuditHmacKeys();
    if (!auditKey) throw new Error('Expected a KMS audit verification key.');
    const kmsHash = computeAuditRecordHash(event, null, auditKey);
    mockAuditLogs.push({ ...event, id: 'kms-history', recordHash: kmsHash });

    await auditDb.writeEvent(event);

    expect(mockAuditLogs).toHaveLength(2);
    expect(mockAuditLogs[1]?.previousHash).toBe(kmsHash);
    expect(mockAuditLogs[1]?.recordHash).not.toBe(
      computeAuditRecordHash(event, kmsHash, auditKey),
    );
    const verification = await auditDb.verifyIntegrity('tenant-1');
    expect(verification).toEqual({
      valid: true,
      checkedCount: 2,
      brokenLinks: [],
    });
  });
});
