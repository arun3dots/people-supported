import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays } from 'date-fns';
import { prisma } from '@repo/db';
import { PaymentService } from '../payments/payment.service';

/** How many days before the renewal date we start prompting the tenant. */
const RENEWAL_WINDOW_DAYS = 7;

@Injectable()
export class SubscriptionRenewalWorker {
  private readonly logger = new Logger(SubscriptionRenewalWorker.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Daily: find active tenants whose subscription renews within the next
   * {@link RENEWAL_WINDOW_DAYS} days and create a renewal payment link (unless
   * one is already open). The /subscriptions page surfaces it as "Renew now".
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async createDueRenewals() {
    const cutoff = addDays(new Date(), RENEWAL_WINDOW_DAYS);

    const dueTenants = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'active',
        nextRenewalAt: { not: null, lte: cutoff },
        deletedAt: null,
      },
      select: { id: true, name: true },
    });

    if (dueTenants.length === 0) return;
    this.logger.log(
      `Creating renewal links for ${dueTenants.length} tenant(s)`,
    );

    for (const tenant of dueTenants) {
      try {
        await this.paymentService.createRenewalPayment(tenant.id);
      } catch (err) {
        this.logger.error(
          `Failed to create renewal payment for tenant ${tenant.id}`,
          err as Error,
        );
      }
    }
  }
}
