import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { addMonths } from 'date-fns';
import {
  prisma,
  Payment,
  SubscriptionPackage,
  PrismaTransactionClient,
} from '@repo/db';
import { VerifyRazorpayPaymentDTO } from '@repo/schema';
import { MailService } from '../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './payment-provider.interface';

interface PaymentCustomer {
  name: string;
  email: string;
  phone?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  /** True when the active provider settles payments via webhook (vs manual). */
  get isManualProvider(): boolean {
    return this.provider.name === 'manual';
  }

  /**
   * Creates a Payment row + provider payment link for a tenant's subscription.
   * Returns the persisted Payment (caller emails `shortUrl`).
   */
  async createPaymentForTenant(
    tenantId: string,
    pkg: Pick<SubscriptionPackage, 'id' | 'name' | 'priceMonthly' | 'currency'>,
    customer: PaymentCustomer,
    isRenewal = false,
  ): Promise<Payment> {
    const token = crypto.randomBytes(24).toString('hex');

    const link = await this.provider.createPaymentLink({
      tenantId,
      paymentToken: token,
      packageInfo: { id: pkg.id, name: pkg.name },
      amount: pkg.priceMonthly,
      currency: pkg.currency,
      customer,
    });

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        packageId: pkg.id,
        provider: this.provider.name,
        amount: pkg.priceMonthly,
        currency: pkg.currency,
        status: 'created',
        isRenewal,
        providerLinkId: link.providerLinkId,
        providerOrderId: link.providerOrderId,
        shortUrl: link.shortUrl,
        token,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'PAYMENT_LINK_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      tenantId,
      metadata: { amount: pkg.priceMonthly, currency: pkg.currency },
    });

    return payment;
  }

  /** Emails a payment link to the tenant's primary contact. */
  async emailPaymentLink(
    email: string,
    tenantName: string,
    shortUrl: string,
  ): Promise<void> {
    try {
      await this.mailService.sendNotification(
        email,
        'Complete your subscription payment',
        `Your ${tenantName} account is ready. Please complete your subscription payment to activate full access.`,
        shortUrl,
      );
    } catch (err) {
      this.logger.error('Failed to send payment link email', err as Error);
    }
  }

  /** Subscription status + assigned package + the active (unpaid) link. */
  async getBillingStatus(tenantId: string): Promise<{
    subscriptionStatus: string;
    paymentUrl?: string;
    packageId: string | null;
    packageName: string | null;
  }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        subscriptionStatus: true,
        packageId: true,
        package: { select: { name: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let paymentUrl: string | undefined;
    if (tenant.subscriptionStatus !== 'active') {
      const latest = await prisma.payment.findFirst({
        where: { tenantId, status: 'created' },
        orderBy: { createdAt: 'desc' },
      });
      paymentUrl = latest?.shortUrl ?? undefined;
    }

    return {
      subscriptionStatus: tenant.subscriptionStatus,
      paymentUrl,
      packageId: tenant.packageId ?? null,
      packageName: tenant.package?.name ?? null,
    };
  }

  /**
   * Tenant Admin selects (or switches to) a public package. Sets the tenant's
   * package, cancels any still-unpaid payment (so a stale amount can't be paid),
   * and creates a fresh payment link for the new plan. Returns the link.
   */
  async selectPackage(
    tenantId: string,
    packageId: string,
  ): Promise<{ paymentUrl?: string }> {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg || !pkg.isActive || !pkg.isPublic) {
      throw new BadRequestException('Invalid or unavailable package');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.subscriptionStatus === 'active') {
      throw new BadRequestException(
        'Subscription is already active; cannot change package here',
      );
    }

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { packageId: pkg.id },
      });
      // Void any outstanding link so its (now-stale) amount can't be paid.
      await tx.payment.updateMany({
        where: { tenantId, status: 'created' },
        data: {
          status: 'cancelled',
          failureReason: 'Plan changed before payment',
        },
      });
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'PACKAGE_SELECTED',
      entityType: 'Tenant',
      entityId: tenantId,
      tenantId,
      metadata: { packageId: pkg.id, packageName: pkg.name },
    });

    const payment = await this.createPaymentForTenant(tenantId, pkg, {
      name: tenant.primaryContactName ?? tenant.name,
      email: tenant.primaryContactEmail ?? '',
      phone: tenant.primaryContactPhone ?? undefined,
    });
    return { paymentUrl: payment.shortUrl ?? undefined };
  }

  /** Returns the newest unpaid payment link, recreating one if none exists. */
  async getOrCreateActiveLink(
    tenantId: string,
  ): Promise<{ paymentUrl?: string }> {
    const existing = await prisma.payment.findFirst({
      where: { tenantId, status: 'created' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.shortUrl) return { paymentUrl: existing.shortUrl };

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { package: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.subscriptionStatus === 'active') return {};
    if (!tenant.package) {
      throw new NotFoundException('No subscription package assigned');
    }

    const payment = await this.createPaymentForTenant(
      tenantId,
      tenant.package,
      {
        name: tenant.primaryContactName ?? tenant.name,
        email: tenant.primaryContactEmail ?? '',
        phone: tenant.primaryContactPhone ?? undefined,
      },
    );
    return { paymentUrl: payment.shortUrl ?? undefined };
  }

  /**
   * Handles a provider webhook. Verifies the signature, then (if paid) activates
   * the tenant idempotently. Safe to call multiple times for the same event.
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const result = this.provider.verifyWebhook(rawBody, signature);
    if (result.status === 'ignored') return;

    const payment = result.linkId
      ? await prisma.payment.findFirst({
          where: { providerLinkId: result.linkId },
        })
      : null;

    if (!payment) {
      this.logger.warn(
        `Webhook ${result.event} for unknown link ${result.linkId ?? '(none)'}`,
      );
      return;
    }

    if (result.status === 'paid') {
      await this.activatePayment(payment.id, result.paymentId);
    } else if (payment.status === 'created') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          providerPaymentId: result.paymentId,
          failureReason:
            result.status === 'cancelled'
              ? 'Payment was cancelled before completion.'
              : 'Payment failed at the provider.',
        },
      });
    }
  }

  /**
   * Handles the provider's signed redirect/callback (e.g. Razorpay payment-link
   * callback_url). Activates the tenant when the callback verifies as paid.
   * Returns whether the payment is now active. Never throws.
   */
  async handleReturn(
    token: string | undefined,
    query: Record<string, string>,
  ): Promise<boolean> {
    if (!this.provider.verifyReturn) return false;
    const result = this.provider.verifyReturn(query);
    if (result.status !== 'paid') return false;

    const payment = result.linkId
      ? await prisma.payment.findFirst({
          where: { providerLinkId: result.linkId },
        })
      : token
        ? await prisma.payment.findUnique({ where: { token } })
        : null;

    if (!payment) return false;
    await this.activatePayment(payment.id, result.paymentId);
    return true;
  }

  /** Manual-provider confirmation by Payment.token (dev only). */
  async confirmManual(token: string): Promise<{ success: boolean }> {
    const payment = await prisma.payment.findUnique({ where: { token } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.activatePayment(payment.id, `manual_${token}`);
    return { success: true };
  }

  /** SuperAdmin override: mark a payment paid. */
  async markPaid(paymentId: string): Promise<{ success: boolean }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.activatePayment(
      payment.id,
      payment.providerPaymentId ?? undefined,
    );
    return { success: true };
  }

  /**
   * Single source of truth for the paid -> active transition. Idempotent: the
   * Payment update is guarded by `status: 'created'` so concurrent webhooks
   * cannot double-activate, and an already-paid payment is a no-op.
   */
  private async activatePayment(
    paymentId: string,
    providerPaymentId?: string,
  ): Promise<void> {
    const now = new Date();
    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const flip = await tx.payment.updateMany({
        where: { id: paymentId, status: 'created' },
        data: {
          status: 'paid',
          paidAt: now,
          providerPaymentId,
        },
      });

      // Already paid (duplicate webhook) — nothing more to do.
      if (flip.count === 0) return;

      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) return;

      await tx.tenant.update({
        where: { id: payment.tenantId },
        data: {
          subscriptionStatus: 'active',
          subscriptionActivatedAt: now,
          // Monthly billing — next renewal one month out.
          nextRenewalAt: addMonths(now, 1),
          status: 'Active',
        },
      });

      void this.auditService.emit({
        categoryType: 'SYSTEM',
        actionType: 'SUBSCRIPTION_ACTIVATED',
        entityType: 'Payment',
        entityId: payment.id,
        tenantId: payment.tenantId,
        metadata: { amount: payment.amount, currency: payment.currency },
      });
    });
  }

  /** Human-readable invoice number derived from the payment (stable). */
  private invoiceNumber(payment: Pick<Payment, 'id' | 'createdAt'>): string {
    const d = payment.createdAt;
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `CC-${ym}-${payment.id.slice(0, 8).toUpperCase()}`;
  }

  /**
   * Billing history + subscription summary for a tenant. Used by the
   * /subscriptions page. Includes every payment (paid, failed, cancelled,
   * pending) with a derived invoice number and display fields.
   */
  async getBillingHistory(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        subscriptionStatus: true,
        nextRenewalAt: true,
        package: { select: { name: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const payments = await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { package: { select: { name: true } } },
    });

    return {
      tenantName: tenant.name,
      subscriptionStatus: tenant.subscriptionStatus,
      nextRenewalAt: tenant.nextRenewalAt,
      packageName: tenant.package?.name ?? null,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        isRenewal: p.isRenewal,
        failureReason: p.failureReason,
        packageName: p.package?.name ?? null,
        invoiceNumber: this.invoiceNumber(p),
        shortUrl: p.status === 'created' ? p.shortUrl : null,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
    };
  }

  /**
   * Loads a PAID payment for invoice generation, tenant-scoped. Throws if the
   * payment doesn't exist, belongs to another tenant, or isn't paid.
   */
  async getInvoiceContext(paymentId: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        package: { select: { name: true } },
        tenant: {
          select: {
            name: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            postcode: true,
            primaryContactEmail: true,
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'paid') {
      throw new NotFoundException(
        'Invoice is only available for paid payments',
      );
    }
    return { payment, invoiceNumber: this.invoiceNumber(payment) };
  }

  /**
   * Creates a renewal payment link for an active tenant (used by the renewal
   * cron). No-op (returns null) if the tenant is missing a package or already
   * has an open renewal payment.
   */
  async createRenewalPayment(tenantId: string): Promise<Payment | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { package: true },
    });
    if (!tenant?.package) return null;

    const existing = await prisma.payment.findFirst({
      where: { tenantId, status: 'created', isRenewal: true },
    });
    if (existing) return existing;

    const payment = await this.createPaymentForTenant(
      tenantId,
      tenant.package,
      {
        name: tenant.primaryContactName ?? tenant.name,
        email: tenant.primaryContactEmail ?? '',
        phone: tenant.primaryContactPhone ?? undefined,
      },
      true,
    );

    if (payment.shortUrl && tenant.primaryContactEmail) {
      await this.mailService
        .sendNotification(
          tenant.primaryContactEmail,
          'Your Cantra Care subscription is due for renewal',
          `Your subscription for ${tenant.name} is due to renew soon. Please renew to keep full access to your dashboard.`,
          payment.shortUrl,
        )
        .catch(() => {});
    }
    return payment;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // In-app Razorpay Standard Checkout (NEW — additive, nothing above changed)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns Razorpay Order details for the current tenant's pending payment.
   * Lazily creates the Order on first call; returns cached orderId thereafter.
   * Used by authenticated users (overlay / billing page).
   */
  async createOrderForTenant(tenantId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    paymentToken: string;
  }> {
    if (!this.provider.createOrder) {
      throw new BadRequestException(
        'In-app checkout is not supported by the current payment provider',
      );
    }

    const payment = await prisma.payment.findFirst({
      where: { tenantId, status: 'created' },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException('No pending payment found for this tenant');
    }

    // Idempotent: reuse an existing Razorpay Order if already created.
    if (payment.providerOrderId) {
      return {
        orderId: payment.providerOrderId,
        amount: payment.amount,
        currency: payment.currency,
        key: process.env.RAZORPAY_KEY_ID ?? '',
        paymentToken: payment.token,
      };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const orderResult = await this.provider.createOrder({
      tenantId,
      paymentToken: payment.token,
      packageInfo: {
        id: payment.packageId ?? undefined,
        name: payment.package?.name ?? 'Subscription',
      },
      amount: payment.amount,
      currency: payment.currency,
      customer: {
        name: tenant.primaryContactName ?? tenant.name,
        email: tenant.primaryContactEmail ?? '',
        phone: tenant.primaryContactPhone ?? undefined,
      },
    });

    // Persist the Razorpay orderId so subsequent calls are idempotent.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerOrderId: orderResult.orderId },
    });

    return {
      orderId: orderResult.orderId,
      amount: payment.amount,
      currency: payment.currency,
      key: process.env.RAZORPAY_KEY_ID ?? '',
      paymentToken: payment.token,
    };
  }

  /**
   * Returns Razorpay Order details by our own Payment.token.
   * Unauthenticated — used on the post-signup/onboarding page before the user
   * has verified their email or logged in. Token is opaque (48 hex chars).
   */
  async getOrderByToken(token: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    paymentToken: string;
  }> {
    if (!this.provider.createOrder) {
      throw new BadRequestException(
        'In-app checkout is not supported by the current payment provider',
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { token },
      include: { package: true, tenant: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'paid') {
      throw new BadRequestException('Payment is already complete');
    }

    // Idempotent: reuse existing Order if already created.
    if (payment.providerOrderId) {
      return {
        orderId: payment.providerOrderId,
        amount: payment.amount,
        currency: payment.currency,
        key: process.env.RAZORPAY_KEY_ID ?? '',
        paymentToken: payment.token,
      };
    }

    const tenant = payment.tenant;
    const orderResult = await this.provider.createOrder({
      tenantId: payment.tenantId,
      paymentToken: payment.token,
      packageInfo: {
        id: payment.packageId ?? undefined,
        name: payment.package?.name ?? 'Subscription',
      },
      amount: payment.amount,
      currency: payment.currency,
      customer: {
        name: tenant.primaryContactName ?? tenant.name,
        email: tenant.primaryContactEmail ?? '',
        phone: tenant.primaryContactPhone ?? undefined,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerOrderId: orderResult.orderId },
    });

    return {
      orderId: orderResult.orderId,
      amount: payment.amount,
      currency: payment.currency,
      key: process.env.RAZORPAY_KEY_ID ?? '',
      paymentToken: payment.token,
    };
  }

  /**
   * Verifies the HMAC Razorpay.js sends to the browser after a successful
   * in-app payment, then activates the subscription via the existing
   * activatePayment() method (idempotent, single source of truth).
   */
  async verifyAndActivate(
    dto: VerifyRazorpayPaymentDTO,
  ): Promise<{ success: boolean }> {
    const payment = await prisma.payment.findUnique({
      where: { token: dto.paymentToken },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (!this.provider.verifyOrderPayment) {
      throw new BadRequestException(
        'In-app checkout verification not supported by current provider',
      );
    }

    const valid = this.provider.verifyOrderPayment(
      dto.orderId,
      dto.paymentId,
      dto.signature,
    );
    if (!valid) {
      throw new UnauthorizedException('Payment signature verification failed');
    }

    await this.activatePayment(payment.id, dto.paymentId);
    return { success: true };
  }
}
