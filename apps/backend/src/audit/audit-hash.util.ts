import { createHmac } from 'crypto';
import { getAllAuditHmacKeys } from '@repo/db';
import type { AuditEvent } from './audit.types';

export function assertAuditSigningKeyConfigured(
  rawKey: string | undefined = process.env.AUDIT_SIGNING_KEY,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  if (!rawKey || rawKey.trim().length < 16) {
    if (nodeEnv === 'test' && process.env.STRICT_SECRET_CHECK !== 'true') {
      return 'test-only-ephemeral-audit-signing-key-32b';
    }
    throw new Error(
      'FATAL [C-03]: AUDIT_SIGNING_KEY environment variable is required (min 16 characters) for tamper-evident audit logging.',
    );
  }
  return rawKey.trim();
}

function getAuditVerificationKeys(signingKey: string): Array<Buffer | string> {
  const keys: Array<Buffer | string> = [signingKey, ...getAllAuditHmacKeys()];
  const legacy = process.env.AUDIT_SIGNING_KEY_LEGACY?.trim();
  if (legacy && legacy.length >= 16 && legacy !== signingKey) keys.push(legacy);
  return keys;
}

export function computeAuditRecordHash(
  event: Partial<AuditEvent>,
  previousHash: string | null,
  signingKey: Buffer | string,
): string {
  const payload = JSON.stringify({
    tenantId: event.tenantId,
    userId: event.userId,
    categoryType: event.categoryType,
    actionType: event.actionType,
    entityType: event.entityType,
    entityId: event.entityId,
    oldValue: event.oldValue,
    newValue: event.newValue,
    metadata: event.metadata,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    locationName: event.locationName ?? undefined,
    previousHash,
  });
  return createHmac('sha256', signingKey).update(payload).digest('hex');
}

export function computeCumulativeBlockHash(
  recordHashes: string[],
  signingKey: Buffer | string,
): string {
  return createHmac('sha256', signingKey)
    .update(recordHashes.join(''))
    .digest('hex');
}

export function verifyAuditLogChain(
  logs: Array<{ id: string; recordHash: string } & Partial<AuditEvent>>,
  signingKey: string,
): {
  valid: boolean;
  checkedCount: number;
  brokenLinks: Array<{ id: string; expected: string; actual: string }>;
} {
  const brokenLinks: Array<{ id: string; expected: string; actual: string }> =
    [];
  const candidateKeys = getAuditVerificationKeys(signingKey);
  let prevHash: string | null = null;

  for (const log of logs) {
    const matched = candidateKeys.some(
      (key) => computeAuditRecordHash(log, prevHash, key) === log.recordHash,
    );
    if (!matched) {
      brokenLinks.push({
        id: log.id,
        expected: computeAuditRecordHash(log, prevHash, signingKey),
        actual: log.recordHash,
      });
    }
    prevHash = log.recordHash;
  }

  return {
    valid: brokenLinks.length === 0,
    checkedCount: logs.length,
    brokenLinks,
  };
}
