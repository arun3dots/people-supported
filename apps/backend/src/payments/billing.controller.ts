import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { selectPackageSchema, type SelectPackageDTO } from '@repo/schema';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('status')
  async status(@Req() req: AuthenticatedRequest) {
    // Platform users (SuperAdmin) have no tenant — never gated.
    if (!req.user.tenantId) return { subscriptionStatus: 'active' };
    return this.paymentService.getBillingStatus(req.user.tenantId);
  }

  @Post('payment-link')
  async paymentLink(@Req() req: AuthenticatedRequest) {
    if (!req.user.tenantId) return {};
    return this.paymentService.getOrCreateActiveLink(req.user.tenantId);
  }

  /**
   * Tenant Admin chooses or switches their subscription package (only while the
   * subscription is not yet active). Returns a fresh payment link.
   */
  @Post('select-package')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async selectPackage(
    @Body(new ZodValidationPipe(selectPackageSchema)) dto: SelectPackageDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user.tenantId) throw new ForbiddenException();
    return this.paymentService.selectPackage(req.user.tenantId, dto.packageId);
  }

  /** Billing history + subscription summary for the current tenant. */
  @Get('payments')
  async payments(@Req() req: AuthenticatedRequest) {
    if (!req.user.tenantId) {
      return {
        tenantName: null,
        subscriptionStatus: 'active',
        nextRenewalAt: null,
        packageName: null,
        payments: [],
      };
    }
    return this.paymentService.getBillingHistory(req.user.tenantId);
  }

  /** Streams a PDF invoice for a PAID payment (tenant-scoped). */
  @Get('payments/:id/invoice')
  async invoice(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    if (!req.user.tenantId) throw new ForbiddenException();
    const { payment, invoiceNumber } =
      await this.paymentService.getInvoiceContext(id, req.user.tenantId);

    const tenant = payment.tenant;
    const addressParts = [
      tenant?.addressLine1,
      tenant?.addressLine2,
      tenant?.city,
      tenant?.postcode,
    ].filter(Boolean);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoiceNumber}.pdf"`,
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Cantra Care', { continued: false });
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Built to support care');
    doc.moveDown(1.5);

    doc
      .fillColor('#0f172a')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('INVOICE');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Invoice number: ${invoiceNumber}`);
    doc.text(
      `Invoice date: ${(payment.paidAt ?? payment.createdAt).toLocaleDateString()}`,
    );
    doc.text(`Status: PAID`);
    doc.moveDown(1);

    // Bill to
    doc.font('Helvetica-Bold').text('Billed to');
    doc.font('Helvetica').fillColor('#334155');
    doc.text(tenant?.name ?? '');
    if (addressParts.length) doc.text(addressParts.join(', '));
    if (tenant?.primaryContactEmail) doc.text(tenant.primaryContactEmail);
    doc.moveDown(1.5);

    // Line item
    const top = doc.y;
    doc.font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Description', 50, top);
    doc.text('Amount', 400, top, { width: 100, align: 'right' });
    doc
      .moveTo(50, top + 16)
      .lineTo(545, top + 16)
      .strokeColor('#e2e8f0')
      .stroke();

    const rowY = top + 26;
    const amountStr = `${payment.currency} ${payment.amount.toFixed(2)}`;
    doc.font('Helvetica').fillColor('#334155');
    doc.text(
      `Subscription — ${payment.package?.name ?? 'Plan'} (monthly)`,
      50,
      rowY,
    );
    doc.text(amountStr, 400, rowY, { width: 100, align: 'right' });

    doc
      .moveTo(50, rowY + 24)
      .lineTo(545, rowY + 24)
      .stroke();
    doc.font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Total', 50, rowY + 34);
    doc.text(amountStr, 400, rowY + 34, { width: 100, align: 'right' });

    doc.moveDown(4);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#94a3b8')
      .text(
        `Paid via ${payment.provider}${
          payment.providerPaymentId ? ` · ${payment.providerPaymentId}` : ''
        }`,
        50,
      );
    doc.text('Thank you for your business.');

    doc.end();
  }

  // ─── In-app Standard Checkout (NEW — additive) ───────────────────────────

  /**
   * Authenticated — returns Razorpay Order details for the current tenant's
   * pending payment. The frontend uses these to open the Razorpay.js modal.
   * POST /api/billing/create-order
   */
  @Post('create-order')
  async createOrder(@Req() req: AuthenticatedRequest) {
    if (!req.user.tenantId) throw new ForbiddenException();
    return this.paymentService.createOrderForTenant(req.user.tenantId);
  }
}
