"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Text, toast } from "@repo/ui/components/ui";
import { downloadElementAsPDF } from "@repo/ui/lib/pdf";
import { useGetInvoiceByIdQuery } from "../../../../../../lib/queries/finance/useFinanceQueries";
import { InvoiceViewHeader } from "./components/InvoiceViewHeader";
import { InvoiceDocument } from "./components/InvoiceDocument";
import { RecordPaymentDialog } from "../../components/RecordPaymentDialog";

export default function InvoiceViewPage() {
  const params = useParams();
  const invoiceId = typeof params?.id === "string" ? params.id : "";

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: invoice,
    isLoading,
    isError,
  } = useGetInvoiceByIdQuery(invoiceId);

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      setIsDownloading(true);
      await downloadElementAsPDF("invoice-printable-area", {
        filename: invoice.invoiceNumber || `invoice-${invoice.id}`,
        scale: 2,
        marginMm: 10,
        backgroundColor: "#ffffff",
      });
      toast({
        title: "Download Complete",
        description: `Invoice ${invoice.invoiceNumber} has been downloaded as a PDF.`,
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to generate PDF.",
        variant: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendInvoice = () => {
    toast({
      title: "Invoice Sent",
      description: `Invoice ${invoice?.invoiceNumber || ""} has been sent to the billing contact.`,
      variant: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-slate-200 animate-pulse rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="min-h-96 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4 font-sans">
        <Text size="xl" weight="bold" className="text-slate-900">
          Invoice Not Found
        </Text>
        <Text size="sm" weight="regular" className="text-slate-500">
          The invoice you are trying to view does not exist or has been deleted.
        </Text>
        <Link href="/admin/finance/invoices">
          <Button variant="outline" className="rounded-xl mt-2 gap-2 cursor-pointer">
            <ArrowLeft className="size-4" /> Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const isPaid = invoice.status === "Paid";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none font-sans">
      {/* Top Header Actions */}
      <InvoiceViewHeader
        invoiceNumber={invoice.invoiceNumber}
        isPaid={isPaid}
        isDownloading={isDownloading}
        onDownload={handleDownload}
        onSendInvoice={handleSendInvoice}
        onRecordPayment={() => setIsPaymentOpen(true)}
      />

      {/* Printable / Downloadable Invoice Sheet */}
      <InvoiceDocument invoice={invoice} />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        invoice={invoice}
      />
    </div>
  );
}
