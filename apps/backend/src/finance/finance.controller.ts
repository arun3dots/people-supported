import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  createExpenseSchema,
  updateExpenseSchema,
  invoiceListQuerySchema,
  paymentListQuerySchema,
  expenseListQuerySchema,
  type CreateInvoiceDTO,
  type UpdateInvoiceDTO,
  type RecordPaymentDTO,
  type CreateExpenseDTO,
  type UpdateExpenseDTO,
  type InvoiceListQueryDTO,
  type PaymentListQueryDTO,
  type ExpenseListQueryDTO,
} from '@repo/schema';
import { FinanceService } from './finance.service';
import { requireBranchId, resolveBranchId } from '../common/utils/scope.util';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'SuperAdmin', 'Manager')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID is missing from user context');
    }
    return tenantId;
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.financeService.getFinanceStats(
      this.getTenantId(req),
      resolveBranchId(req),
    );
  }

  @Get('invoices')
  async getInvoices(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(invoiceListQuerySchema))
    query?: InvoiceListQueryDTO,
  ) {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.financeService.getInvoices(this.getTenantId(req), {
      ...query,
      branchId,
    });
  }

  @Get('invoices/:id')
  async getInvoiceById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.getInvoiceById(id, this.getTenantId(req));
  }

  @Post('invoices')
  async createInvoice(
    @Body(new ZodValidationPipe(createInvoiceSchema)) dto: CreateInvoiceDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.createInvoice(
      dto,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Patch('invoices/:id')
  async updateInvoice(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) dto: UpdateInvoiceDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.updateInvoice(
      id,
      dto,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Delete('invoices/:id')
  async deleteInvoice(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.deleteInvoice(
      id,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Get('payments')
  async getPayments(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(paymentListQuerySchema))
    query?: PaymentListQueryDTO,
  ) {
    const branchId = resolveBranchId(req, query?.branchId);
    return this.financeService.getPayments(this.getTenantId(req), {
      ...query,
      branchId,
    });
  }

  @Post('payments')
  async recordPayment(
    @Body(new ZodValidationPipe(recordPaymentSchema)) dto: RecordPaymentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.recordPayment(
      dto,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Get('expenses')
  async getExpenses(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(expenseListQuerySchema))
    query?: ExpenseListQueryDTO,
  ) {
    const branchId = resolveBranchId(req, query?.branchId);
    return this.financeService.getExpenses(this.getTenantId(req), {
      ...query,
      branchId,
    });
  }

  @Post('expenses')
  async createExpense(
    @Body(new ZodValidationPipe(createExpenseSchema)) dto: CreateExpenseDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.createExpense(
      dto,
      this.getTenantId(req),
      req.user.userId,
      requireBranchId(req, dto.branchId),
    );
  }

  @Patch('expenses/:id')
  async updateExpense(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) dto: UpdateExpenseDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.updateExpense(
      id,
      dto,
      this.getTenantId(req),
      req.user.userId,
    );
  }
}
