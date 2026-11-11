"use client";

import React from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { Printer, CreditCard } from "lucide-react";
import type { InvoiceResponse, PaymentHistoryResponse } from "../../../../../lib/queries/finance/types";

interface InvoiceDetailModalProps {
  invoice: InvoiceResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment?: (invoice: InvoiceResponse) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Paid":
      return <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">Paid</Badge>;
    case "Partially Paid":
      return <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">Partially Paid</Badge>;
    case "Overdue":
      return <Badge variant="secondary" state="danger" className="px-2.5 py-0.5 shadow-none">Overdue</Badge>;
    case "Draft":
      return <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">Draft</Badge>;
    default:
      return <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none">Unpaid</Badge>;
  }
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onOpenChange,
  onRecordPayment,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const totalPaid = (invoice.paymentHistory ?? []).reduce(
    (acc: number, curr: PaymentHistoryResponse) => acc + curr.amountPaid,
    0
  );
  const balanceDue = Math.max(0, invoice.amount - totalPaid);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle asChild>
                  <Text size="lg" weight="bold" className="text-slate-900">
                    Invoice {invoice.invoiceNumber}
                  </Text>
                </DialogTitle>
                {getStatusBadge(invoice.status)}
              </div>
              <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
                Type: {invoice.invoiceType}
              </Text>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Top Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-md">
            <div>
              <Text size="sm" weight="medium" className="text-slate-500">Resident</Text>
              <Text size="sm" weight="semibold" className="text-slate-900 mt-0.5">
                {invoice.resident?.fullName || "—"}
              </Text>
            </div>
            <div>
              <Text size="sm" weight="medium" className="text-slate-500">Issue Date</Text>
              <Text size="sm" weight="semibold" className="text-slate-900 mt-0.5">
                {formatDate(invoice.issuedDate)}
              </Text>
            </div>
            <div>
              <Text size="sm" weight="medium" className="text-slate-500">Due Date</Text>
              <Text size="sm" weight="semibold" className="text-slate-900 mt-0.5">
                {formatDate(invoice.dueDate)}
              </Text>
            </div>
            <div>
              <Text size="sm" weight="medium" className="text-slate-500">Council PO</Text>
              <Text size="sm" weight="semibold" className="text-slate-900 mt-0.5">
                {invoice.councilPo?.poNumber || "Private"}
              </Text>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <Text size="sm" weight="semibold" className="text-slate-900 mb-2">
              Invoice Line Items
            </Text>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="py-2.5 px-3">Description</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Qty / Wks</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Rate</TableHead>
                    <TableHead className="py-2.5 px-3 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: { description: string; quantity: number; unitPrice: number; total: number }, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2.5 px-3 font-medium text-slate-900">
                          {item.description}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right text-slate-600">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="py-2.5 px-3 font-medium text-slate-900">
                        {invoice.invoiceType} Fees
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-600">1</TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-600">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-1">
                <div className="flex justify-between items-center text-md">
                  <Text size="sm" weight="medium" className="text-slate-600">Total Invoiced Amount:</Text>
                  <Text size="sm" weight="semibold" className="text-emerald-700">{formatCurrency(invoice.amount)}</Text>
                </div>
                <div className="flex justify-between items-center text-md">
                  <Text size="sm" weight="regular" className="text-slate-500">Amount Paid:</Text>
                  <Text size="sm" weight="medium" className="text-slate-700">{formatCurrency(totalPaid)}</Text>
                </div>
                <div className="flex justify-between items-center text-md pt-1 border-t border-slate-200/80">
                  <Text size="sm" weight="bold" className="text-slate-900">Balance Due:</Text>
                  <Text size="sm" weight="bold" className="text-slate-900">{formatCurrency(balanceDue)}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-md">
              <Text size="sm" weight="semibold" className="text-slate-900 inline">Notes: </Text>
              <Text size="sm" weight="regular" className="text-slate-600 inline">{invoice.notes}</Text>
            </div>
          )}

          {/* Payment History */}
          {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
            <div>
              <Text size="sm" weight="semibold" className="text-slate-900 mb-2">
                Payment History
              </Text>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-md">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="py-2 px-3">Date</TableHead>
                      <TableHead className="py-2 px-3">Method</TableHead>
                      <TableHead className="py-2 px-3">Ref</TableHead>
                      <TableHead className="py-2 px-3 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.paymentHistory.map((p: PaymentHistoryResponse) => (
                      <TableRow key={p.id}>
                        <TableCell className="py-2 px-3">{formatDate(p.paymentDate)}</TableCell>
                        <TableCell className="py-2 px-3">{p.paymentMethod}</TableCell>
                        <TableCell className="py-2 px-3 text-slate-500">{p.reference || "—"}</TableCell>
                        <TableCell className="py-2 px-3 text-right font-medium text-emerald-700">
                          {formatCurrency(p.amountPaid)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5 rounded-xl cursor-pointer"
          >
            <Printer className="size-3.5" /> Print Invoice
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Close
            </Button>
            {invoice.status !== "Paid" && onRecordPayment && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onOpenChange(false);
                  onRecordPayment(invoice);
                }}
                className="gap-1.5 rounded-xl cursor-pointer"
              >
                <CreditCard className="size-3.5" /> Record Payment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
