"use client";

import React from "react";
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import { Phone, Mail, Plus, AlertCircle } from "lucide-react";
import type {
  InvoiceResponse,
  InvoiceItemResponse,
  PaymentHistoryResponse,
} from "../../../../../../../lib/queries/finance/types";
import { InvoicePaymentFooter } from "./InvoicePaymentFooter";

interface InvoiceDocumentProps {
  invoice: InvoiceResponse;
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

export function InvoiceDocument({ invoice }: InvoiceDocumentProps) {
  const resident = invoice.resident;
  const items: InvoiceItemResponse[] =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
        {
          description: "Residential Care - Weekly Fee",
          category: invoice.invoiceType || "Residential Fees",
          quantity: 1,
          unitPrice: invoice.amount,
          vatRate: 0,
          total: invoice.amount,
        },
      ];

  const subtotal = items.reduce(
    (sum: number, it: InvoiceItemResponse) => sum + (it.total || 0),
    0
  );
  const discount = 0;
  const vatTotal = items.reduce(
    (sum: number, it: InvoiceItemResponse) =>
      sum + ((it.total || 0) * (it.vatRate || 0)) / 100,
    0
  );
  const totalAmount = invoice.amount || subtotal + vatTotal - discount;

  const totalPaid = invoice.paymentHistory
    ? invoice.paymentHistory.reduce(
      (sum: number, p: PaymentHistoryResponse) => sum + p.amountPaid,
      0
    )
    : invoice.status === "Paid"
      ? totalAmount
      : 0;

  const amountDue = Math.max(0, totalAmount - totalPaid);

  const residentAddress =
    resident?.profile?.addressLine1 ||
    (resident?.bed?.room?.roomNumber
      ? `Room ${resident.bed.room.roomNumber}, `
      : "") + "221b Baker Street, London, NW16XE, United Kingdom.";

  const payerName =
    resident?.nextOfKin?.name ||
    resident?.fullName ||
    "Mary Linton (Daughter)";
  const payerPhone = resident?.nextOfKin?.phoneNumber || "+44 54379 34546";
  const payerEmail = resident?.nextOfKin?.email || "mary.linton@gmail.com";

  return (
    <div
      id="invoice-printable-area"
      data-filename={invoice.invoiceNumber || `INV-${invoice.id}`}
      className="w-full font-sans"
    >
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-8 md:p-12 space-y-8 print:p-0">
          {/* Top Header: Brand & INVOICE Title */}
          <div className="flex items-start justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-xs">
                🌿
              </div>
              <div>
                <Text size="xl" weight="bold" className="text-emerald-800 tracking-tight block">
                  Cantra
                </Text>
                <Text size="md" weight="medium" className="text-slate-400 block leading-none">
                  Supported Living
                </Text>
              </div>
            </div>

            {/* INVOICE Wordmark */}
            <Text size="2xl" weight="bold" className="text-slate-900 tracking-wider">
              INVOICE
            </Text>
          </div>

          {/* Supported Living Service Details & Invoice Metadata */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-2">
            {/* Supported Living Service Sender Info */}
            <div className="space-y-1 text-md text-slate-600">
              <Text size="md" weight="bold" className="text-slate-900">
                Cantra Supported Living
              </Text>
              <Text size="md" weight="regular" className="text-slate-600 block">
                221b Baker Street, London, NW16XE, United Kingdom.
              </Text>
              <Text size="md" weight="regular" className="text-slate-600 block pt-1">
                Tel: +44 20794 67809
              </Text>
              <Text size="md" weight="regular" className="text-slate-600 block">
                Email: accounts@cantra.co.uk
              </Text>
              <Text size="md" weight="regular" className="text-slate-600 block">
                VAT No: GB123 4567 89
              </Text>
            </div>

            {/* Invoice Meta Grid */}
            <div className="space-y-1.5 text-md text-right md:min-w-60">
              <div className="flex justify-between md:justify-end gap-6">
                <Text size="md" weight="medium" className="text-slate-500">Invoice No.</Text>
                <Text size="md" weight="bold" className="text-slate-900">{invoice.invoiceNumber}</Text>
              </div>
              <div className="flex justify-between md:justify-end gap-6">
                <Text size="md" weight="medium" className="text-slate-500">Issue Date</Text>
                <Text size="md" weight="medium" className="text-slate-900">{formatDate(invoice.issuedDate)}</Text>
              </div>
              <div className="flex justify-between md:justify-end gap-6">
                <Text size="md" weight="medium" className="text-slate-500">Due Date</Text>
                <Text size="md" weight="medium" className="text-slate-900">{formatDate(invoice.dueDate)}</Text>
              </div>
              <div className="flex justify-between md:justify-end gap-6">
                <Text size="md" weight="medium" className="text-slate-500">Invoice Type</Text>
                <Text size="md" weight="medium" className="text-slate-900">{invoice.invoiceType || "Residential Fees"}</Text>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To */}
          <div className="pt-4 border-t border-slate-100">
            <Text size="md" weight="semibold" className="text-slate-500 tracking-wider mb-2 block">
              BILL TO
            </Text>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Resident Info */}
              <div className="space-y-1">
                <Text size="xl" weight="bold" className="text-slate-900 block">
                  {resident?.fullName || "Devon Lane"}
                </Text>
                <Text size="md" weight="medium" className="text-slate-500 block">
                  Resident ID: {resident?.id ? resident.id.slice(0, 8) : "0005"}
                </Text>
                <div className="pt-2 space-y-0.5">
                  <Text size="md" weight="semibold" className="text-slate-800 block">Address:</Text>
                  <Text size="md" weight="regular" className="text-slate-600 block">{residentAddress}</Text>
                </div>
              </div>

              {/* Payer / Billing Contact */}
              <div className="space-y-1.5 md:text-right">
                <Text size="md" weight="bold" className="text-slate-500 tracking-wider block">
                  PAYER / BILLING CONTACT
                </Text>
                <Text size="md" weight="bold" className="text-slate-900 block">{payerName}</Text>
                <div className="space-y-1 flex flex-col md:items-end">
                  <div className="flex items-center gap-1.5 text-md text-slate-600">
                    <Phone className="size-3.5 text-slate-400" />
                    <Text size="md" weight="regular">{payerPhone}</Text>
                  </div>
                  <div className="flex items-center gap-1.5 text-md text-slate-600">
                    <Mail className="size-3.5 text-slate-400" />
                    <Text size="md" weight="regular">{payerEmail}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="pt-2 w-full">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="pb-3 text-left font-semibold">Description</TableHead>
                  <TableHead className="pb-3 text-left font-semibold">Category</TableHead>
                  <TableHead className="pb-3 text-center font-semibold">Qty</TableHead>
                  <TableHead className="pb-3 text-right font-semibold">Unit Price</TableHead>
                  <TableHead className="pb-3 text-right font-semibold">VAT(%)</TableHead>
                  <TableHead className="pb-3 text-right font-semibold">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: InvoiceItemResponse, idx: number) => (
                  <TableRow key={item.id || idx}>
                    <TableCell className="py-3.5 pr-3 text-left">
                      <Text size="md" weight="semibold" className="text-slate-900 block">
                        {item.description}
                      </Text>
                      <Text size="md" weight="regular" className="text-slate-400 block mt-0.5">
                        ({formatDate(invoice.issuedDate)} - {formatDate(invoice.dueDate)})
                      </Text>
                    </TableCell>
                    <TableCell className="py-3.5 pr-3 text-left">
                      <Text size="md" weight="medium" className="text-slate-600">
                        {item.category || "Residential Fees"}
                      </Text>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-center">
                      <Text size="md" weight="medium" className="text-slate-700">
                        {item.quantity}
                      </Text>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-right">
                      <Text size="md" weight="medium" className="text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </Text>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-right">
                      <Text size="md" weight="medium" className="text-slate-700">
                        {item.vatRate || 0}%
                      </Text>
                    </TableCell>
                    <TableCell className="py-3.5 pl-3 text-right">
                      <Text size="md" weight="semibold" className="text-slate-900">
                        {formatCurrency(item.total)}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add Discount Link */}
            <Button
              type="button"
              variant="link"
              className="mt-3 p-0 h-auto gap-1 font-semibold text-emerald-800 hover:text-emerald-900 print:hidden cursor-pointer"
            >
              <Plus className="size-3.5" /> Add Discount
            </Button>
          </div>

          {/* Section 4: Totals & Amount Due */}
          <div className="pt-4 space-y-4">
            <div className="flex flex-col items-end space-y-2 text-md">
              <div className="w-72 flex justify-between text-slate-600">
                <Text size="md" weight="medium">Subtotal</Text>
                <Text size="md" weight="semibold" className="text-slate-900">{formatCurrency(subtotal)}</Text>
              </div>
              <div className="w-72 flex justify-between text-slate-600">
                <Text size="md" weight="medium">Discount</Text>
                <Text size="md" weight="semibold" className="text-slate-900">{formatCurrency(discount)}</Text>
              </div>
              <div className="w-72 flex justify-between text-slate-600">
                <Text size="md" weight="medium">VAT (0%)</Text>
                <Text size="md" weight="semibold" className="text-slate-900">{formatCurrency(vatTotal)}</Text>
              </div>
              <div className="w-72 pt-2 border-t border-slate-200 flex justify-between">
                <Text size="md" weight="bold" className="text-emerald-800">TOTAL AMOUNT</Text>
                <Text size="md" weight="bold" className="text-emerald-800">{formatCurrency(totalAmount)}</Text>
              </div>

              {/* Recorded Payments List */}
              {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
                <div className="w-72 pt-2 space-y-2 border-t border-slate-100">
                  {invoice.paymentHistory.map((pmt: PaymentHistoryResponse) => (
                    <div
                      key={pmt.id}
                      className="flex items-center justify-between text-md"
                    >
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <AlertCircle className="size-3.5 text-slate-400 shrink-0" />
                        <Text size="md" weight="medium">Paid on {formatDate(pmt.paymentDate)}</Text>
                      </div>
                      <Text size="md" weight="bold" className="text-slate-900">
                        {formatCurrency(pmt.amountPaid)}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlight Banner: Amount Due */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
              <Text size="md" weight="bold" className="tracking-wider text-emerald-950">
                {amountDue <= 0 ? "STATUS: PAID" : "AMOUNT DUE"}
              </Text>
              <Text size="lg" weight="bold" className="text-emerald-950">
                {formatCurrency(amountDue)}
              </Text>
            </div>
          </div>

          {/* Section 5: Footer Payment Terms & Bank Details */}
          <InvoicePaymentFooter />
        </CardContent>
      </Card>
    </div>
  );
}
