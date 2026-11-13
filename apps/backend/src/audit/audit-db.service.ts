import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHmac } from 'crypto';
import { Prisma, PrismaClient } from '@repo/audit-db';
import { AuditEvent } from './audit.types';
import { buildAreaFilter } from './audit-filter.util';
import {
  writeDeadLetterLog,
  drainDeadLetterQueue,
} from './audit-dead-letter.util';

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

@Injectable()
export class AuditDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditDbService.name);
  private readonly signingKey: string;
  private readonly auditClient: PrismaClient;
  private lastHash: string | null = null;

  constructor() {
    this.signingKey = assertAuditSigningKeyConfigured();

    this.auditClient = new PrismaClient({
      datasources: {
        db: { url: process.env.AUDIT_DATABASE_URL },
      },
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.auditClient.$connect();
      this.logger.log('Connected to CQC Audit Database ✓');
    } catch (err: unknown) {
      this.logger.error(
        'Failed to connect to CQC Audit Database — audit writes will use encrypted dead-letter queue',
        (err as Error).message,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.auditClient.$disconnect();
  }

  /**
   * Write a single audit event to the audit database.
   * Computes and chains the HMAC hash before inserting.
   */
  async writeEvent(event: AuditEvent, isReplay = false): Promise<void> {
    try {
      const previousHash = await this.getLastHash(event.tenantId);
      const recordHash = this.computeHash(event, previousHash);

      const created = await this.auditClient.cqcAuditLog.create({
        data: {
          tenantId: event.tenantId ?? null,
          userId: event.userId ?? null,
          userEmail: event.userEmail ?? null,
          userFullName: event.userFullName ?? null,
          userRoleName: event.userRoleName ?? null,
          categoryType: event.categoryType,
          actionType: event.actionType,
          entityType: event.entityType ?? null,
          entityId: event.entityId ?? null,
          entityLabel: event.entityLabel ?? null,
          oldValue: (event.oldValue as object) ?? undefined,
          newValue: (event.newValue as object) ?? undefined,
          metadata: (event.metadata as object) ?? undefined,
          ipAddress: event.ipAddress ?? null,
          userAgent: event.userAgent ?? null,
          latitude: event.latitude ?? null,
          longitude: event.longitude ?? null,
          locationName: event.locationName ?? null,
          recordHash,
          previousHash: previousHash ?? null,
        },
      });

      this.lastHash = recordHash;
      await this.maybeWriteIntegrityBlock(event.tenantId);

      this.logger.debug(
        `Audit event written: ${event.categoryType}/${event.actionType} [${created.id}]`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to write audit event to DB: ${err.message}`,
        err.stack,
      );
      if (!isReplay) {
        await writeDeadLetterLog(event, err, this.logger);
      }
      throw error;
    }
  }

  /**
   * Automatically replay queued encrypted dead-letter events every 15 minutes (C-03).
   */
  @Cron('0 */15 * * * *')
  async replayDeadLettersCron(): Promise<number> {
    const replayed = await drainDeadLetterQueue(
      (evt) => this.writeEvent(evt, true),
      this.logger,
    );
    if (replayed > 0) {
      this.logger.log(
        `Replayed ${replayed} dead-letter audit events into HMAC chain`,
      );
    }
    return replayed;
  }

  /**
   * Scheduled nightly integrity verification of the audit hash chain at 02:00 (C-03).
   */
  @Cron('0 0 2 * * *')
  async nightlyVerifyIntegrityCron(): Promise<void> {
    if (process.env.RUN_CRON === 'false') return;
    try {
      const result = await this.verifyIntegrity();
      if (!result.valid) {
        this.logger.error(
          `CRITICAL SECURITY ALERT [C-03]: Audit hash chain integrity check failed! ${result.brokenLinks.length} broken link(s) detected out of ${result.checkedCount} records.`,
        );
      } else {
        this.logger.log(
          `Nightly CQC audit hash chain verification passed (${result.checkedCount} records verified).`,
        );
      }
    } catch (err: unknown) {
      this.logger.error(
        `Nightly audit integrity check encountered an error: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Verify the hash chain integrity for a tenant's audit logs.
   */
  async verifyIntegrity(tenantId?: string | null): Promise<{
    valid: boolean;
    checkedCount: number;
    brokenLinks: Array<{ id: string; expected: string; actual: string }>;
  }> {
    const logs = await this.auditClient.cqcAuditLog.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        userEmail: true,
        userFullName: true,
        userRoleName: true,
        categoryType: true,
        actionType: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        oldValue: true,
        newValue: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        latitude: true,
        longitude: true,
        locationName: true,
        recordHash: true,
        previousHash: true,
        timestamp: true,
      },
    });

    const brokenLinks: Array<{ id: string; expected: string; actual: string }> =
      [];
    let prevHash: string | null = null;

    for (const log of logs) {
      const recomputedHash = this.computeHash(
        log as unknown as Partial<AuditEvent>,
        prevHash,
      );
      if (recomputedHash !== log.recordHash) {
        brokenLinks.push({
          id: log.id,
          expected: recomputedHash,
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

  async findAll(params: {
    tenantId?: string;
    userId?: string;
    categoryType?: string;
    actionType?: string;
    area?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    all?: boolean;
    search?: string;
  }) {
    const andConditions: Prisma.CqcAuditLogWhereInput[] = [];

    if (params.tenantId) andConditions.push({ tenantId: params.tenantId });
    if (params.userId) andConditions.push({ userId: params.userId });
    if (params.categoryType)
      andConditions.push({ categoryType: params.categoryType });
    if (params.actionType)
      andConditions.push({ actionType: params.actionType });
    if (params.entityId) andConditions.push({ entityId: params.entityId });

    if (params.startDate || params.endDate) {
      const timestampCond: Prisma.DateTimeFilter = {};
      if (params.startDate) timestampCond.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        timestampCond.lte = end;
      }
      andConditions.push({ timestamp: timestampCond });
    }

    const areaFilter = buildAreaFilter(params.area);
    if (areaFilter) {
      andConditions.push(areaFilter);
    }

    if (params.search) {
      const s = params.search;
      andConditions.push({
        OR: [
          { userFullName: { contains: s, mode: 'insensitive' } },
          { userEmail: { contains: s, mode: 'insensitive' } },
          { actionType: { contains: s, mode: 'insensitive' } },
          { entityType: { contains: s, mode: 'insensitive' } },
          { entityLabel: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.CqcAuditLogWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    if (params.all) {
      const logs = await this.auditClient.cqcAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
      });
      return { logs, total: logs.length };
    }

    const [logs, total] = await Promise.all([
      this.auditClient.cqcAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit ?? 100,
        skip: params.offset ?? 0,
      }),
      this.auditClient.cqcAuditLog.count({ where }),
    ]);

    return { logs, total };
  }

  private computeHash(
    event: Partial<AuditEvent>,
    previousHash: string | null,
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
    return createHmac('sha256', this.signingKey).update(payload).digest('hex');
  }

  private async getLastHash(tenantId?: string | null): Promise<string | null> {
    if (this.lastHash) return this.lastHash;

    const last = await this.auditClient.cqcAuditLog.findFirst({
      where: tenantId ? { tenantId } : {},
      orderBy: { timestamp: 'desc' },
      select: { recordHash: true },
    });

    this.lastHash = last?.recordHash ?? null;
    return this.lastHash;
  }

  private async maybeWriteIntegrityBlock(
    tenantId?: string | null,
  ): Promise<void> {
    const count = await this.auditClient.cqcAuditLog.count({
      where: tenantId ? { tenantId } : {},
    });

    if (count % 1000 !== 0) return;

    const logs = await this.auditClient.cqcAuditLog.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { timestamp: 'desc' },
      take: 1000,
      select: { id: true, recordHash: true },
    });

    if (logs.length === 0) return;

    const cumulativeHash = createHmac('sha256', this.signingKey)
      .update(logs.map((l: { recordHash: string }) => l.recordHash).join(''))
      .digest('hex');

    const lastBlock = await this.auditClient.auditIntegrityBlock.findFirst({
      where: tenantId ? { tenantId } : {},
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true },
    });

    await this.auditClient.auditIntegrityBlock.create({
      data: {
        tenantId: tenantId ?? null,
        blockNumber: (lastBlock?.blockNumber ?? 0) + 1,
        startRecordId: logs[logs.length - 1].id,
        endRecordId: logs[0].id,
        recordCount: logs.length,
        cumulativeHash,
      },
    });
  }
}
