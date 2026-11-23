import { format } from "date-fns";
import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";

export function formatPoundAmount(amount: unknown): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  return `£${num.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFinanceAuditValue(val: unknown): string[] {
  if (!val || typeof val !== "object") return [];
  const obj = val as Record<string, unknown>;
  const lines: string[] = [];

  // Expense
  if (obj.expenseNo || obj.vendor || (obj.amount !== undefined && obj.category)) {
    if (obj.expenseNo) lines.push(`Reference: ${obj.expenseNo}`);
    const amt = formatPoundAmount(obj.amount);
    if (amt) lines.push(`Amount: ${amt}`);
    if (obj.vendor) lines.push(`Supplier: ${obj.vendor}`);
    if (obj.category) lines.push(`Category: ${obj.category}`);
    if (obj.status) lines.push(`Status: ${obj.status}`);
    return lines.length > 0 ? lines : [];
  }

  // Invoice
  if (
    obj.invoiceNumber ||
    obj.invoiceType ||
    (obj.amount !== undefined && (obj.dueDate || obj.issuedDate))
  ) {
    if (obj.invoiceNumber) lines.push(`Invoice: ${obj.invoiceNumber}`);
    const amt = formatPoundAmount(obj.amount);
    if (amt) lines.push(`Amount: ${amt}`);
    if (obj.invoiceType) lines.push(`Type: ${obj.invoiceType}`);
    if (obj.status) lines.push(`Status: ${obj.status}`);
    return lines.length > 0 ? lines : [];
  }

  // Payment
  if (obj.amountPaid !== undefined || obj.paymentMethod) {
    if (obj.reference) lines.push(`Reference: ${obj.reference}`);
    const amt = formatPoundAmount(obj.amountPaid);
    if (amt) lines.push(`Amount Paid: ${amt}`);
    if (obj.paymentMethod) lines.push(`Method: ${obj.paymentMethod}`);
    if (obj.status) lines.push(`Status: ${obj.status}`);
    return lines.length > 0 ? lines : [];
  }

  return [];
}

export interface FinanceDetails {
  isFinance: boolean;
  referenceId?: string;
  amount?: string;
  supplier?: string;
  category?: string;
  status?: string;
  paymentMethod?: string;
  txDate?: string;
  description?: string;
  notes?: string;
}

export function extractFinanceDetails(log: AuditLogItem): FinanceDetails {
  const isFinance =
    log.entityType === "Expense" ||
    log.entityType === "Invoice" ||
    log.entityType === "PaymentHistory" ||
    (log.actionType || "").includes("EXPENSE") ||
    (log.actionType || "").includes("INVOICE") ||
    (log.actionType || "").includes("PAYMENT");

  const rawTx = (log.newValue || log.oldValue || {}) as Record<string, unknown>;

  const referenceId =
    (rawTx.expenseNo as string) ||
    (rawTx.invoiceNumber as string) ||
    (rawTx.reference as string) ||
    (log.entityType === "Expense" || log.entityType === "Invoice"
      ? (log.entityLabel as string)
      : undefined);

  const amountVal =
    rawTx.amount !== undefined ? rawTx.amount : rawTx.amountPaid;
  const amount = formatPoundAmount(amountVal) || undefined;

  const supplier =
    (rawTx.vendor as string) ||
    (rawTx.supplier as string) ||
    (rawTx.supplierName as string) ||
    undefined;

  const category =
    (rawTx.category as string) ||
    (rawTx.invoiceType as string) ||
    undefined;

  const status = (rawTx.status as string) || undefined;
  const paymentMethod = (rawTx.paymentMethod as string) || undefined;
  const description = (rawTx.description as string) || undefined;
  const notes = (rawTx.notes as string) || undefined;

  const rawDate =
    (rawTx.date as string) ||
    (rawTx.issuedDate as string) ||
    (rawTx.paymentDate as string);

  let txDate: string | undefined;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        txDate = format(d, "dd MMM yyyy");
      }
    } catch {
      // ignore invalid dates
    }
  }

  return {
    isFinance: isFinance || Boolean(referenceId && (amount || supplier)),
    referenceId,
    amount,
    supplier,
    category,
    status,
    paymentMethod,
    txDate,
    description,
    notes,
  };
}
