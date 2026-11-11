export interface InvoiceItemResponse {
  id?: string;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  total: number;
}

export interface InvoiceResponse {
  id: string;
  tenantId: string;
  residentId: string;
  invoiceNumber: string;
  invoiceType: string;
  amount: number;
  status: "Unpaid" | "Paid" | "Partially Paid" | "Overdue" | "Draft" | "Cancelled" | string;
  dueDate: string;
  issuedDate: string;
  paidDate?: string | null;
  councilPoId?: string | null;
  notes?: string | null;
  items?: InvoiceItemResponse[] | null;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    status?: string;
    nextOfKin?: {
      name?: string;
      relationship?: string;
      phoneNumber?: string;
      email?: string;
      address?: string;
    } | null;
    profile?: {
      addressLine1?: string | null;
      city?: string | null;
      postcode?: string | null;
      country?: string | null;
    } | null;
    bed?: {
      room?: {
        roomNumber: string;
      } | null;
    } | null;
  };
  councilPo?: {
    id: string;
    poNumber: string;
    councilName: string;
  } | null;
  paymentHistory?: PaymentHistoryResponse[];
}

export interface PaymentHistoryResponse {
  id: string;
  invoiceId: string;
  tenantId?: string | null;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  status: string;
  invoice?: InvoiceResponse;
}

export interface ExpenseResponse {
  id: string;
  tenantId: string;
  expenseNo: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  receiptUrl?: string | null;
  notes?: string | null;
}

export interface FinanceStatsResponse {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
  overdueAmount: number;
  totalExpenses: number;
  invoicesCount: number;
  expensesCount: number;
}
