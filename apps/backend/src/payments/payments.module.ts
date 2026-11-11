import { Module, Logger } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PaymentService } from './payment.service';
import { PackagesService } from './packages.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { ManualProvider } from './providers/manual.provider';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './payment-provider.interface';
import { BillingController } from './billing.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { PackagesController } from './packages.controller';
import { PackagesPublicController } from './packages-public.controller';

/**
 * Selects the active payment provider from env. Defaults to Razorpay, but falls
 * back to the manual provider when explicitly requested OR when Razorpay keys
 * are missing — so local dev works end-to-end with no credentials.
 */
function chooseProvider(
  razorpay: RazorpayProvider,
  manual: ManualProvider,
): PaymentProvider {
  const choice = (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase();
  const hasRazorpayKeys = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
  const provider = choice === 'razorpay' && hasRazorpayKeys ? razorpay : manual;
  new Logger('PaymentsModule').log(
    `Payment provider: ${provider.name}` +
      (choice === 'razorpay' && !hasRazorpayKeys
        ? ' (razorpay keys missing — using manual fallback)'
        : ''),
  );
  return provider;
}

@Module({
  imports: [AuditModule],
  controllers: [
    BillingController,
    PaymentsWebhookController,
    PackagesController,
    PackagesPublicController,
  ],
  providers: [
    RazorpayProvider,
    ManualProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: chooseProvider,
      inject: [RazorpayProvider, ManualProvider],
    },
    PaymentService,
    PackagesService,
  ],
  exports: [PaymentService, PackagesService],
})
export class PaymentsModule {}
