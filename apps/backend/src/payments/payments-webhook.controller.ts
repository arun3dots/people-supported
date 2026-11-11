import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  RawBodyRequest,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  verifyRazorpayPaymentSchema,
  type VerifyRazorpayPaymentDTO,
} from '@repo/schema';

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Provider webhook (e.g. Razorpay). Unauthenticated; verified by signature. */
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = (req.headers['x-razorpay-signature'] as string) ?? '';
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    await this.paymentService.handleWebhook(rawBody, signature);
    return { ok: true };
  }

  /**
   * Landing route after a hosted-checkout redirect. Verifies the provider's
   * signed callback (activating the tenant immediately if paid), then bounces
   * to the web app's billing page.
   */
  @Get('return')
  async return(@Query() query: Record<string, string>, @Res() res: Response) {
    let paid = false;
    try {
      paid = await this.paymentService.handleReturn(query.token, query);
    } catch {
      paid = false;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/billing?paid=${paid ? '1' : '0'}&token=${query.token ?? ''}`,
    );
  }

  /** Dev-only manual confirmation (manual provider). 404 otherwise. */
  @Post('manual-confirm')
  manualConfirm(@Body('token') token: string) {
    if (!this.paymentService.isManualProvider) {
      throw new NotFoundException();
    }
    return this.paymentService.confirmManual(token);
  }

  // ─── In-app Standard Checkout — unauthenticated (NEW) ───────────────────

  /**
   * Returns Razorpay Order details by our own Payment.token.
   * No auth required — used on the post-signup / post-onboarding success screen
   * before the user has a session cookie. Token is opaque (48 hex chars).
   * POST /api/payments/open-order
   */
  @Post('open-order')
  async openOrder(@Body('token') token: string) {
    return this.paymentService.getOrderByToken(token ?? '');
  }

  /**
   * Verifies the Razorpay HMAC from the browser handler after a successful
   * in-app payment, then activates the subscription.
   * No session required — HMAC from Razorpay is the auth mechanism.
   * POST /api/payments/verify-payment
   */
  @Post('verify-payment')
  async verifyPayment(
    @Body(new ZodValidationPipe(verifyRazorpayPaymentSchema))
    dto: VerifyRazorpayPaymentDTO,
  ) {
    return this.paymentService.verifyAndActivate(dto);
  }
}
