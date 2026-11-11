/**
 * Provider-agnostic payment abstraction. New providers (Stripe, etc.) only need
 * to implement this interface and be wired into the provider factory in
 * `payments.module.ts`. Nothing else in the codebase should know which provider
 * is active.
 */

/** DI token for the currently-selected PaymentProvider. */
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface CreatePaymentLinkInput {
  tenantId: string;
  /** Our own opaque Payment.token — used to build return/callback URLs. */
  paymentToken: string;
  packageInfo: { id?: string; name: string };
  /** Amount in major units (e.g. rupees). Providers convert as needed. */
  amount: number;
  /** ISO 4217 currency code, e.g. "INR". */
  currency: string;
  customer: { name: string; email: string; phone?: string };
  metadata?: Record<string, string>;
}

export interface CreatePaymentLinkResult {
  providerLinkId: string;
  shortUrl: string;
  providerOrderId?: string;
}

export type WebhookStatus = 'paid' | 'failed' | 'cancelled' | 'ignored';

export interface VerifiedWebhook {
  event: string;
  status: WebhookStatus;
  /** Provider payment id (for idempotency). */
  paymentId?: string;
  /** Provider link id — maps to Payment.providerLinkId. */
  linkId?: string;
}

export interface PaymentProvider {
  /** Stable provider name persisted on the Payment row, e.g. 'razorpay'. */
  readonly name: string;

  /** Creates a hosted payment link for the given subscription charge. */
  createPaymentLink(
    input: CreatePaymentLinkInput,
  ): Promise<CreatePaymentLinkResult>;

  /**
   * Verifies a provider webhook against the raw request body + signature and
   * returns a normalised result. MUST throw if the signature is invalid.
   */
  verifyWebhook(rawBody: Buffer, signature: string): VerifiedWebhook;

  /**
   * Optional: verifies the signed redirect/callback query a provider appends
   * when sending the user back after payment (e.g. Razorpay payment-link
   * callback). Lets us activate immediately on redirect without a webhook.
   * Returns `status: 'ignored'` (never throws) when the callback can't be
   * verified, so the return route degrades gracefully.
   */
  verifyReturn?(query: Record<string, string>): VerifiedWebhook;

  /**
   * NEW – Creates a Razorpay Order (used for in-app Standard Checkout modal).
   * Only Razorpay implements this; other providers omit it.
   */
  createOrder?(input: CreatePaymentLinkInput): Promise<CreateOrderResult>;

  /**
   * NEW – Verifies the HMAC that Razorpay.js sends to the browser handler
   * after a successful in-app payment.
   * signature = HMAC_SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
   */
  verifyOrderPayment?(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean;
}

/** Result of creating a Razorpay Order (distinct from a Payment Link). */
export interface CreateOrderResult {
  /** Razorpay order_id — stored in Payment.providerOrderId. */
  orderId: string;
  /** Amount in major units (e.g. rupees). */
  amount: number;
  currency: string;
}
