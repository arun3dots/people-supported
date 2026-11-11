import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  RecordPaymentDTO,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  InvoiceListQueryDTO,
  PaymentListQueryDTO,
  ExpenseListQueryDTO,
  PaginatedResponse,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';
import { resolvePagination, paginate } from '../common/utils/pagination.util';
import {
  RESIDENT_SELECT,
  buildInvoiceWhere,
  buildPaymentWhere,
  buildExpenseWhere,
  computeFinanceStats,
} from './finance-query.helper';

@Injectable()
export class FinanceService {
  constructor(private readonly auditService: AuditService) {}

  async getFinanceStats(tenantId: string, branchId?: string) {
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(branchId ? { branchId } : {}),
        },
        include: { paymentHistory: { where: { deletedAt: null } } },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(branchId ? { branchId } : {}),
        },
      }),
    ]);

    return computeFinanceStats(invoices, expenses);
  }

  async getInvoices(
    tenantId: string,
    query: Partial<InvoiceListQueryDTO> = {},
  ): Promise<PaginatedResponse<any>> {
    const slice = resolvePagination(query);
    const where = buildInvoiceWhere(tenantId, query);
    const orderBy = {
      [query.sortBy ?? 'issuedDate']: query.sortOrder ?? 'desc',
    };

    return paginate(
      slice,
      (args) =>
        prisma.invoice.findMany({
          where,
          include: {
            resident: { select: RESIDENT_SELECT },
            councilPo: {
              select: { id: true, poNumber: true, councilName: true },
            },
            paymentHistory: {
              where: { deletedAt: null },
              orderBy: { paymentDate: 'desc' },
            },
          },
          orderBy,
          ...args,
        }),
      () => prisma.invoice.count({ where }),
    );
  }

  async getInvoiceById(id: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        resident: { select: RESIDENT_SELECT },
        councilPo: true,
        paymentHistory: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(dto: CreateInvoiceDTO, tenantId: string, userId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    let invoiceNumber = dto.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.invoice.count({ where: { tenantId } });
      invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const created = await prisma.invoice.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId: dto.residentId,
        invoiceNumber,
        invoiceType: dto.invoiceType || 'Residential Fees',
        amount: dto.amount,
        status: dto.status || 'Unpaid',
        dueDate: new Date(dto.dueDate),
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : new Date(),
        councilPoId: dto.councilPoId || null,
        items: dto.items ? toJsonValue(dto.items) : undefined,
        notes: dto.notes || null,
        createdById: userId,
        updatedById: userId,
      },
      include: { resident: { select: RESIDENT_SELECT } },
    });

    void this.auditService.createLog({
      actionType: 'INVOICE_CREATED',
      tenantId,
      userId,
      entityType: 'Invoice',
      entityId: created.id,
      newValue: toJsonValue(created),
    });

    return created;
  }

  async updateInvoice(
    id: string,
    dto: UpdateInvoiceDTO,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.getInvoiceById(id, tenantId);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        residentId: dto.residentId ?? undefined,
        invoiceNumber: dto.invoiceNumber ?? undefined,
        invoiceType: dto.invoiceType ?? undefined,
        amount: dto.amount ?? undefined,
        status: dto.status ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
        paidDate:
          dto.paidDate !== undefined
            ? dto.paidDate
              ? new Date(dto.paidDate)
              : null
            : undefined,
        councilPoId:
          dto.councilPoId !== undefined ? dto.councilPoId : undefined,
        items: dto.items ? toJsonValue(dto.items) : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        updatedById: userId,
      },
      include: { resident: { select: RESIDENT_SELECT }, paymentHistory: true },
    });

    void this.auditService.createLog({
      actionType: 'INVOICE_UPDATED',
      tenantId,
      userId,
      entityType: 'Invoice',
      entityId: updated.id,
      oldValue: toJsonValue(existing),
      newValue: toJsonValue(updated),
    });

    return updated;
  }

  async deleteInvoice(id: string, tenantId: string, userId: string) {
    const existing = await this.getInvoiceById(id, tenantId);

    await prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId },
    });

    void this.auditService.createLog({
      actionType: 'INVOICE_DELETED',
      tenantId,
      userId,
      entityType: 'Invoice',
      entityId: id,
      oldValue: toJsonValue(existing),
    });

    return { success: true };
  }

  async getPayments(
    tenantId: string,
    query: Partial<PaymentListQueryDTO> = {},
  ): Promise<PaginatedResponse<any>> {
    const slice = resolvePagination(query);
    const where = buildPaymentWhere(tenantId, query);
    const orderBy = {
      [query.sortBy ?? 'paymentDate']: query.sortOrder ?? 'desc',
    };

    return paginate(
      slice,
      (args) =>
        prisma.paymentHistory.findMany({
          where,
          include: {
            invoice: { include: { resident: { select: RESIDENT_SELECT } } },
          },
          orderBy,
          ...args,
        }),
      () => prisma.paymentHistory.count({ where }),
    );
  }

  async recordPayment(dto: RecordPaymentDTO, tenantId: string, userId: string) {
    const invoice = await this.getInvoiceById(dto.invoiceId, tenantId);

    const payment = await prisma.paymentHistory.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        amountPaid: dto.amountPaid,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || null,
        notes: dto.notes || null,
        status: dto.status || 'Completed',
        createdById: userId,
        updatedById: userId,
      },
    });

    const allPayments = await prisma.paymentHistory.findMany({
      where: { invoiceId: invoice.id, deletedAt: null },
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amountPaid, 0);

    let newStatus = invoice.status;
    if (totalPaid >= invoice.amount) newStatus = 'Paid';
    else if (totalPaid > 0) newStatus = 'Partially Paid';

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        paidDate: totalPaid >= invoice.amount ? new Date() : undefined,
        updatedById: userId,
      },
    });

    void this.auditService.createLog({
      actionType: 'PAYMENT_RECORDED',
      tenantId,
      userId,
      entityType: 'PaymentHistory',
      entityId: payment.id,
      newValue: toJsonValue(payment),
    });

    return payment;
  }

  async getExpenses(
    tenantId: string,
    query: Partial<ExpenseListQueryDTO> = {},
  ): Promise<PaginatedResponse<any>> {
    const slice = resolvePagination(query);
    const where = buildExpenseWhere(tenantId, query);
    const orderBy = {
      [query.sortBy ?? 'date']: query.sortOrder ?? 'desc',
    };

    return paginate(
      slice,
      (args) => prisma.expense.findMany({ where, orderBy, ...args }),
      () => prisma.expense.count({ where }),
    );
  }

  async createExpense(
    dto: CreateExpenseDTO,
    tenantId: string,
    userId: string,
    branchId: string,
  ) {
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      select: { id: true },
    });
    if (!branch) {
      throw new ForbiddenException(
        'Selected branch does not belong to this tenant',
      );
    }

    let expenseNo = dto.expenseNo;
    if (!expenseNo) {
      const year = new Date().getFullYear();
      const count = await prisma.expense.count({ where: { tenantId } });
      expenseNo = `EXP-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const created = await prisma.expense.create({
      data: {
        tenantId,
        branchId,
        expenseNo,
        category: dto.category,
        vendor: dto.vendor,
        description: dto.description,
        amount: Math.round(dto.amount * 100) / 100,
        date: new Date(dto.date),
        status: dto.status || 'Paid',
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes || null,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.createLog({
      actionType: 'EXPENSE_RECORDED',
      tenantId,
      userId,
      entityType: 'Expense',
      entityId: created.id,
      newValue: toJsonValue(created),
    });

    return created;
  }

  async updateExpense(
    id: string,
    dto: UpdateExpenseDTO,
    tenantId: string,
    userId: string,
  ) {
    const existing = await prisma.expense.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Expense not found');

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        category: dto.category ?? undefined,
        vendor: dto.vendor ?? undefined,
        description: dto.description ?? undefined,
        amount: dto.amount ?? undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        status: dto.status ?? undefined,
        receiptUrl: dto.receiptUrl !== undefined ? dto.receiptUrl : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        updatedById: userId,
      },
    });

    return updated;
  }
}
