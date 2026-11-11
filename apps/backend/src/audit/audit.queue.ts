import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AuditDbService } from './audit-db.service';
import { AuditJobData } from './audit.types';

export const AUDIT_QUEUE_NAME = 'audit-events';

/**
 * AuditQueueProcessor
 *
 * Processes audit events from the BullMQ queue asynchronously.
 * The main application emits events to the queue (non-blocking)
 * and this processor handles the actual DB write.
 *
 * Retry strategy:
 *   - 3 attempts with exponential backoff (2s, 4s, 8s)
 *   - Failed jobs after 3 attempts are moved to BullMQ dead letter
 *   - AuditDbService also writes a local dead-letter JSONL file as secondary fallback
 *
 * NHS/CQC compliance:
 *   - Audit writes NEVER block or crash the main application
 *   - Events are durably queued in Redis before processing
 *   - Dead-letter log ensures no event is permanently lost
 */
@Processor(AUDIT_QUEUE_NAME, {
  concurrency: 3, // Process up to 3 audit events simultaneously
})
export class AuditQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditQueueProcessor.name);

  constructor(private readonly auditDbService: AuditDbService) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    const { event, enqueuedAt } = job.data;

    this.logger.debug(
      `Processing audit job #${job.id}: ${event.categoryType}/${event.actionType} (enqueued ${enqueuedAt})`,
    );

    await this.auditDbService.writeEvent(event);
  }
}
