"use client";

import React, { useMemo } from "react";
import { Download, Eye, RefreshCcw } from "lucide-react";
import { Badge, Button, Text } from "@repo/ui/components/ui";
import type { BillingPayment } from "../../../../lib/queries/billing/useBilling";
import type {
  TableColumn,
  BadgeState,
} from "../../../../lib/components/shared/tableColumns";

export type BillingStatusState = BadgeState;

export function getBillingStatusBadgeState(
  payment: BillingPayment,
): BillingStatusState {
  switch (payment.status) {
    case "paid":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
      return "inactive";
    default:
      return "warning";
  }
}

export function getBillingStatusLabel(payment: BillingPayment): string {
  switch (payment.status) {
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return payment.isRenewal ? "Renewal Due" : "Pending";
  }
}

function displayInvoiceNumber(payment: BillingPayment): string {
  return (
    payment.invoiceNumber ||
    `INV-${payment.id.substring(0, 8).toUpperCase()}`
  );
}

export function invoiceHref(paymentId: string): string {
  return `/api/billing/payments/${paymentId}/invoice`;
}

interface UseBillingColumnsProps {
  onViewDetail: (payment: BillingPayment) => void;
}

export function useBillingColumns({
  onViewDetail,
}: UseBillingColumnsProps): TableColumn<BillingPayment>[] {
  return useMemo<TableColumn<BillingPayment>[]>(
    () => [
      {
        kind: "index",
        id: "index",
        header: "#",
      },
      {
        kind: "reference",
        id: "invoiceNo",
        header: "Invoice No.",
        getValue: (p) => displayInvoiceNumber(p),
        getLabel: (p) => displayInvoiceNumber(p),
      },
      {
        id: "plan",
        header: "Plan Description",
        enableSorting: false,
        cell: ({ row }) => {
          const payment = row.original;
          const failed =
            payment.status === "failed" || payment.status === "cancelled";
          return (
            <div className="flex flex-col min-w-0 gap-0.5 max-w-56">
              <Text size="md" weight="regular" className="text-slate-900 truncate">
                {payment.packageName ?? "Supported Living Subscription"}
                {payment.isRenewal ? " · Renewal" : ""}
              </Text>
              {failed && payment.failureReason && (
                <Text size="md" weight="regular" className="text-red-500 truncate">
                  {payment.failureReason}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        kind: "date",
        id: "paymentDate",
        header: "Payment Date",
        emphasized: true,
        getValue: (p) => p.paidAt ?? p.createdAt,
        fallback: "—",
      },
      {
        kind: "currency",
        id: "amount",
        header: "Amount",
        getValue: (p) => p.amount,
        getCurrencyCode: (p) => (p.currency === "USD" ? "USD" : "GBP"),
        fallback: "—",
      },
      {
        kind: "badge",
        id: "status",
        header: "Status",
        getValue: (p) => getBillingStatusLabel(p),
        getState: (p) => getBillingStatusBadgeState(p),
        getLabel: (p) => getBillingStatusLabel(p),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(payment)}
                className="h-8 px-2.5 rounded-xl gap-1.5 font-medium shadow-none border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                title="View Details"
              >
                <Eye className="size-3.5 text-emerald-800" />
                <span>View</span>
              </Button>

              {payment.status === "paid" && (
                <a href={invoiceHref(payment.id)} target="_blank" rel="noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-xl gap-1.5 font-medium shadow-none border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                    title="Download Invoice"
                  >
                    <Download className="size-3.5" />
                    <span>Invoice</span>
                  </Button>
                </a>
              )}

              {payment.status === "created" && payment.shortUrl && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    window.open(payment.shortUrl!, "_blank", "noopener,noreferrer")
                  }
                  className="h-8 px-3 rounded-xl gap-1.5 cursor-pointer"
                  title="Renew or Pay Now"
                >
                  <RefreshCcw className="size-3.5" />
                  <span>{payment.isRenewal ? "Renew" : "Pay"}</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onViewDetail],
  );
}
