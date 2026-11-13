"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Download, Send, CreditCard } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface InvoiceViewHeaderProps {
  invoiceNumber: string;
  isPaid: boolean;
  isDownloading?: boolean;
  onDownload: () => void;
  onSendInvoice: () => void;
  onRecordPayment: () => void;
}

export function InvoiceViewHeader({
  invoiceNumber,
  isPaid,
  isDownloading = false,
  onDownload,
  onSendInvoice,
  onRecordPayment,
}: InvoiceViewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/finance/invoices"
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Text size="xl" weight="bold" className="text-slate-900">
            Invoice {invoiceNumber}
          </Text>
        </div>
        <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
          Manage invoices, payments, and expenses for the supported living service
        </Text>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onDownload}
          disabled={isDownloading}
          className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
        >
          <Download className={`size-4 text-slate-600 ${isDownloading ? "animate-bounce" : ""}`} />
          {isDownloading ? "Generating PDF..." : "Download"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onSendInvoice}
          className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
        >
          <Send className="size-4 text-slate-600" />
          Send Invoice
        </Button>

        {!isPaid && (
          <Button
            type="button"
            onClick={onRecordPayment}
            variant="primary"
            className="rounded-xl gap-2 text-md font-semibold cursor-pointer"
          >
            <CreditCard className="size-4" />
            Record Payment
          </Button>
        )}
      </div>
    </div>
  );
}
