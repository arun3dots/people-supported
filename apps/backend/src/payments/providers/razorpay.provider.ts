import {
  Injectable,
  Logger,
  BadGatewayException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CreatePaymentLinkInput,
  CreatePaymentLinkResult,
  CreateOrderResult,
  PaymentProvider,
  VerifiedWebhook,
} from '../payment-provider.interface';

/**
 * Razorpay provider using the Payment Links API via plain `fetch` + `crypto`
 * (no SDK dependency). Razorpay deals in the smallest currency unit (paise for
 * INR), so amounts are multiplied by 100 only at this boundary — the rest of
 * the system stores major units (rupees).
 */
@Injectable()
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay';
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly apiBase = 'https://api.razorpay.com/v1';

  private authHeader(): string {
    const keyId = process.env.RAZORPAY_KEY_ID ?? '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return `Basic ${token}`;
  }

  async createPaymentLink(
    input: CreatePaymentLinkInput,
  ): Promise<CreatePaymentLinkResult> {
    const apiUrl = process.env.API_URL || 'http://localhost:4400/api';
    const body = {
      amount: Math.round(input.amount * 100), // major units -> paise
      currency: input.currency,
      accept_partial: false,
      description: `Subscription: ${input.packageInfo.name}`,
      // `contact` is intentionally omitted: Razorpay rejects links when the
      // phone fails its validation (format / "recurring digits"), which would
      // break onboarding. Email is sufficient for payment links.
      customer: {
        name: input.customer.name,
        email: input.customer.email,
      },
      notify: { email: true, sms: false },
      reminder_enable: true,
      notes: {
        tenantId: input.tenantId,
        paymentToken: input.paymentToken,
        ...(input.metadata ?? {}),
      },
      callback_url: `${apiUrl}/payments/return?token=${input.paymentToken}`,
      callback_method: 'get',
    };

    let res: Response;
    try {
      res = await fetch(`${this.apiBase}/payment_links`, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error('Razorpay payment link request failed', err as Error);
      throw new BadGatewayException('Payment provider unreachable');
    }

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Razorpay error ${res.status}: ${text}`);
      throw new BadGatewayException('Failed to create payment link');
    }

    const json = (await res.json()) as {
      id: string;
      short_url: string;
      order_id?: string;
    };

    return {
      providerLinkId: json.id,
      shortUrl: json.short_url,
      providerOrderId: json.order_id,
    };
  }

  private timingSafeEqualHex(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
  }

  verifyWebhook(rawBody: Buffer, signature: string): VerifiedWebhook {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (!this.timingSafeEqualHex(expected, signature ?? '')) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event: string;
      payload?: {
        payment_link?: { entity?: { id?: string } };
        payment?: { entity?: { id?: string } };
      };
    };

    const linkId = payload.payload?.payment_link?.entity?.id;
    const paymentId = payload.payload?.payment?.entity?.id;

    switch (payload.event) {
      case 'payment_link.paid':
        return { event: payload.event, status: 'paid', linkId, paymentId };
      case 'payment_link.cancelled':
        return { event: payload.event, status: 'cancelled', linkId, paymentId };
      case 'payment.failed':
        return { event: payload.event, status: 'failed', linkId, paymentId };
      default:
        return { event: payload.event, status: 'ignored', linkId, paymentId };
    }
  }

  /**
   * Verifies the signed query Razorpay appends to the payment-link callback_url
   * after the user pays. Signature =
   *   HMAC_SHA256(link_id|reference_id|link_status|payment_id, KEY_SECRET).
   * Uses the API key secret (not the webhook secret), so activation works on
   * redirect even before a webhook is configured.
   */
  verifyReturn(query: Record<string, string>): VerifiedWebhook {
    const linkId = query.razorpay_payment_link_id;
    const referenceId = query.razorpay_payment_link_reference_id ?? '';
    const linkStatus = query.razorpay_payment_link_status ?? '';
    const paymentId = query.razorpay_payment_id ?? '';
    const signature = query.razorpay_signature ?? '';

    if (!linkId || !signature) {
      return { event: 'payment_link.return', status: 'ignored' };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${linkId}|${referenceId}|${linkStatus}|${paymentId}`)
      .digest('hex');

    if (!this.timingSafeEqualHex(expected, signature)) {
      return { event: 'payment_link.return', status: 'ignored' };
    }

    return {
      event: 'payment_link.return',
      status: linkStatus === 'paid' ? 'paid' : 'ignored',
      linkId,
      paymentId,
    };
  }

  /**
   * Creates a Razorpay Order for in-app Standard Checkout.
   * Stores the orderId in Payment.providerOrderId (already on the model).
   * Amount is converted to paise at this boundary only.
   */
  async createOrder(input: CreatePaymentLinkInput): Promise<CreateOrderResult> {
    const body = {
      amount: Math.round(input.amount * 100), // major units → paise
      currency: input.currency,
      receipt: input.paymentToken,
      notes: {
        tenantId: input.tenantId,
        paymentToken: input.paymentToken,
        ...(input.metadata ?? {}),
      },
    };

    let res: Response;
    try {
      res = await fetch(`${this.apiBase}/orders`, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error('Razorpay create order request failed', err as Error);
      throw new BadGatewayException('Payment provider unreachable');
    }

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Razorpay order error ${res.status}: ${text}`);
      throw new BadGatewayException('Failed to create payment order');
    }

    const json = (await res.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      orderId: json.id,
      amount: input.amount, // return in major units (consistent with rest of system)
      currency: input.currency,
    };
  }

  /**
   * Verifies the HMAC Razorpay.js sends to the browser's handler callback.
   * signature = HMAC_SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
   */
  verifyOrderPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return this.timingSafeEqualHex(expected, signature);
  }
}
