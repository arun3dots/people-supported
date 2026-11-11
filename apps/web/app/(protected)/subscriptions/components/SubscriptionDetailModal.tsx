"use client";

import React from "react";
import { Download } from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui";
import type { BillingPayment } from "../../../../lib/queries/billing/useBilling";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api";

function invoiceUrl(id: string) {
  return `${API_BASE}/billing/payments/${id}/invoice`;
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ p }: { p: BillingPayment }) {
  if (p.status === "paid") {
    return <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">Paid</Badge>;
  }
  if (p.status === "failed") {
    return <Badge variant="secondary" state="danger" className="px-2.5 py-0.5 shadow-none">Failed</Badge>;
  }
  if (p.status === "cancelled") {
    return <Badge variant="secondary" state="inactive" className="px-2.5 py-0.5 shadow-none">Cancelled</Badge>;
  }
  return (
    <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none">
      {p.isRenewal ? "Renewal due" : "Pending"}
    </Badge>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100/60 last:border-none">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}

interface SubscriptionDetailModalProps {
  detail: BillingPayment | null;
  onClose: () => void;
}

export function SubscriptionDetailModal({
  detail,
  onClose,
}: SubscriptionDetailModalProps) {
  return (
    <Dialog open={!!detail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {detail?.status === "paid" ? "Invoice Summary" : "Payment Details"}
          </DialogTitle>
        </DialogHeader>

        {detail && (
          <div className="space-y-3 pt-2 text-md">
            <DetailRow label="Invoice number" value={detail.invoiceNumber || "—"} />
            <DetailRow label="Plan tier" value={detail.packageName ?? "Subscription"} />
            <DetailRow label="Billing type" value={detail.isRenewal ? "Renewal" : "Initial Licence"} />
            <DetailRow label="Amount" value={`${detail.currency} ${detail.amount.toFixed(2)}`} />
            <DetailRow label="Payment status" value={<StatusBadge p={detail} />} />
            <DetailRow label="Created on" value={fmtDate(detail.createdAt)} />
            {detail.paidAt && (
              <DetailRow label="Settled on" value={fmtDate(detail.paidAt)} />
            )}
            {detail.failureReason && (
              <DetailRow label="Failure remark" value={detail.failureReason} />
            )}

            {detail.status === "paid" && (
              <div className="pt-3 border-t border-slate-100">
                <a
                  href={invoiceUrl(detail.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button variant="primary" size="sm" className="w-full gap-2 rounded-xl cursor-pointer">
                    <Download className="size-4" /> Download Official PDF Invoice
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
