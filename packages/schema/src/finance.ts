import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  category: z.string().default("Care Fees"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  vatRate: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0, "Total must be non-negative"),
});

export const createInvoiceSchema = z.object({
  residentId: z.string().min(1, "Resident ID is required"),
  billToType: z.enum(["Resident", "Organisation / Payer"]).default("Resident"),
  payerName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("United Kingdom"),
  invoiceNumber: z.string().optional(),
  invoiceType: z.string().default("Residential Fees"),
  paymentTerms: z.string().default("30 Days"),
  reference: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.string().or(z.date()),
  issuedDate: z.string().or(z.date()).optional(),
  councilPoId: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  status: z
    .enum(["Unpaid", "Paid", "Partially Paid", "Overdue", "Draft", "Cancelled"])
    .default("Unpaid"),
});

export const updateInvoiceSchema = z.object({
  residentId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceType: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  dueDate: z.string().or(z.date()).optional(),
  issuedDate: z.string().or(z.date()).optional(),
  paidDate: z.string().or(z.date()).optional().nullable(),
  councilPoId: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  status: z
    .enum(["Unpaid", "Paid", "Partially Paid", "Overdue", "Draft", "Cancelled"])
    .optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amountPaid: z.coerce.number().positive("Amount paid must be greater than 0"),
  paymentDate: z.string().or(z.date()).default(() => new Date().toISOString()),
  paymentMethod: z
    .enum(["Bank Transfer", "Direct Debit", "Credit/Debit Card", "Cheque", "Cash", "Other"])
    .default("Bank Transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["Completed", "Pending", "Failed"]).default("Completed"),
});

export const createExpenseSchema = z.object({
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().uuid("Invalid branch selected").optional(),
  expenseNo: z.string().optional(),
  category: z
    .enum([
      "Medical Supplies",
      "Food & Catering",
      "Utilities",
      "Maintenance",
      "Staffing & Agency",
      "Equipment",
      "Administration",
      "Other",
    ])
    .default("Medical Supplies"),
  vendor: z.string().min(2, "Vendor name is required"),
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
  status: z.enum(["Paid", "Pending", "Approved", "Draft"]).default("Paid"),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type InvoiceItemDTO = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDTO = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentDTO = z.infer<typeof recordPaymentSchema>;
export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;

// --- Finance List Query Schemas ---
/**
 * Restrict to one branch. Honoured only for tenant-wide callers; a
 * branch-assigned user is pinned to their JWT branch by the controller.
 */
const branchScopeField = { branchId: z.string().optional() };

export const invoiceListQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  invoiceType: z.string().optional(),
  residentId: z.string().optional(),
  ...branchScopeField,
  sortBy: z
    .enum(["issuedDate", "dueDate", "amount", "status", "createdAt"])
    .default("issuedDate"),
});
export type InvoiceListQueryDTO = z.infer<typeof invoiceListQuerySchema>;
export type InvoiceListQueryInput = z.input<typeof invoiceListQuerySchema>;

export const paymentListQuerySchema = paginationQuerySchema.extend({
  paymentMethod: z.string().optional(),
  invoiceId: z.string().optional(),
  ...branchScopeField,
  sortBy: z
    .enum(["paymentDate", "amountPaid", "status", "createdAt"])
    .default("paymentDate"),
});
export type PaymentListQueryDTO = z.infer<typeof paymentListQuerySchema>;
export type PaymentListQueryInput = z.input<typeof paymentListQuerySchema>;

export const expenseListQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  status: z.string().optional(),
  ...branchScopeField,
  sortBy: z
    .enum(["date", "amount", "category", "status", "createdAt"])
    .default("date"),
});
export type ExpenseListQueryDTO = z.infer<typeof expenseListQuerySchema>;
export type ExpenseListQueryInput = z.input<typeof expenseListQuerySchema>;

