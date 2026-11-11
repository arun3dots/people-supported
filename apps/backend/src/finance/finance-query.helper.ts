import { Prisma } from '@repo/db';
import type {
  InvoiceListQueryDTO,
  PaymentListQueryDTO,
  ExpenseListQueryDTO,
} from '@repo/schema';

export const RESIDENT_SELECT = {
  id: true,
  fullName: true,
  photoUrl: true,
  status: true,
  nextOfKin: true,
  profile: {
    select: {
      addressLine1: true,
      city: true,
      postcode: true,
      country: true,
    },
  },
  bed: {
    select: {
      room: {
        select: { roomNumber: true },
      },
    },
  },
};

export function buildInvoiceWhere(
  tenantId: string,
  query: Partial<InvoiceListQueryDTO> = {},
): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (query.status && query.status !== 'All Status' && query.status !== 'All') {
    where.status = query.status;
  }

  if (
    query.invoiceType &&
    query.invoiceType !== 'All Types' &&
    query.invoiceType !== 'All'
  ) {
    where.invoiceType = query.invoiceType;
  }

  if (query.residentId) {
    where.residentId = query.residentId;
  }

  if (query.branchId) {
    where.branchId = query.branchId;
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { invoiceNumber: { contains: s, mode: 'insensitive' } },
      { resident: { fullName: { contains: s, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export function buildPaymentWhere(
  tenantId: string,
  query: Partial<PaymentListQueryDTO> = {},
): Prisma.PaymentHistoryWhereInput {
  // PaymentHistory has its own (nullable) branchId, but Invoice's is
  // mandatory and always set — scope through the invoice relation so this
  // stays correct even for older payment rows written before branchId
  // existed on PaymentHistory itself.
  const where: Prisma.PaymentHistoryWhereInput = {
    invoice: {
      tenantId,
      ...(query.branchId ? { branchId: query.branchId } : {}),
    },
    deletedAt: null,
  };

  if (
    query.paymentMethod &&
    query.paymentMethod !== 'All Methods' &&
    query.paymentMethod !== 'All'
  ) {
    where.paymentMethod = query.paymentMethod;
  }

  if (query.invoiceId) {
    where.invoiceId = query.invoiceId;
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { reference: { contains: s, mode: 'insensitive' } },
      {
        invoice: {
          invoiceNumber: { contains: s, mode: 'insensitive' },
        },
      },
      {
        invoice: {
          resident: { fullName: { contains: s, mode: 'insensitive' } },
        },
      },
    ];
  }

  return where;
}

export function buildExpenseWhere(
  tenantId: string,
  query: Partial<ExpenseListQueryDTO> = {},
): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (
    query.category &&
    query.category !== 'All Categories' &&
    query.category !== 'All'
  ) {
    where.category = query.category;
  }

  if (query.status && query.status !== 'All Status' && query.status !== 'All') {
    where.status = query.status;
  }

  if (query.branchId) {
    where.branchId = query.branchId;
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { vendor: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { expenseNo: { contains: s, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function computeFinanceStats(
  invoices: Array<{
    amount: number;
    dueDate: Date | string;
    paymentHistory: Array<{ amountPaid: number }>;
  }>,
  expenses: Array<{ amount: number }>,
) {
  let totalInvoiced = 0;
  let totalCollected = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  const now = new Date();

  for (const inv of invoices) {
    totalInvoiced += inv.amount;
    const paid = inv.paymentHistory.reduce((s, p) => s + p.amountPaid, 0);
    totalCollected += paid;

    const remaining = inv.amount - paid;
    if (remaining > 0 && new Date(inv.dueDate) < now) {
      overdueCount += 1;
      overdueAmount += remaining;
    }
  }

  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return {
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    overdueCount,
    overdueAmount,
    totalExpenses,
    invoicesCount: invoices.length,
    expensesCount: expenses.length,
  };
}
