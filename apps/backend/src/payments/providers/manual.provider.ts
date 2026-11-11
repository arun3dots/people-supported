import { Injectable } from '@nestjs/common';
import {
  CreatePaymentLinkInput,
  CreatePaymentLinkResult,
  PaymentProvider,
  VerifiedWebhook,
} from '../payment-provider.interface';

/**
 * Dev/fallback provider used when no real provider keys are configured.
 * "Payment" is completed by visiting the in-app /pay/<token> page, which calls
 * the manual-confirm endpoint. No external calls, no webhook signatures.
 */
@Injectable()
export class ManualProvider implements PaymentProvider {
  readonly name = 'manual';

  createPaymentLink(
    input: CreatePaymentLinkInput,
  ): Promise<CreatePaymentLinkResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return Promise.resolve({
      providerLinkId: `manual_${input.paymentToken}`,
      shortUrl: `${frontendUrl}/pay/${input.paymentToken}`,
    });
  }

  verifyWebhook(): VerifiedWebhook {
    // Manual provider has no webhook; confirmation goes through confirmManual().
    return { event: 'manual', status: 'ignored' };
  }
}
