"use client";

import React from "react";
import { format } from "date-fns";
import { Eye, Download, RefreshCcw, CreditCard, Calendar } from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../lib/components/shared";
import type { BillingPayment } from "../../../../lib/queries/billing/useBilling";
import {
  getBillingStatusBadgeState,
  getBillingStatusLabel,
  invoiceHref,
} from "./useBillingColumns";

function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatCurrency(amount?: number | null, currency?: string): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function displayInvoiceNumber(payment: BillingPayment): string {
  return (
    payment.invoiceNumber ||
    `INV-${payment.id.substring(0, 8).toUpperCase()}`
  );
}

export interface BillingPaymentCardProps {
  payment: BillingPayment;
  showRightDivider?: boolean;
  onViewDetail: (payment: BillingPayment) => void;
}

export function BillingPaymentCard({
  payment,
  showRightDivider = false,
  onViewDetail,
}: BillingPaymentCardProps) {
  const packageName = payment.packageName ?? "Care Home Subscription";
  const initial = packageName.charAt(0).toUpperCase();
  const state = getBillingStatusBadgeState(payment);
  const label = getBillingStatusLabel(payment);

  return (
    <EntityCard
      onClick={() => onViewDetail(payment)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar
          size="sm"
          className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light"
        >
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={packageName}
      subtitle={`${displayInvoiceNumber(payment)}${payment.isRenewal ? " · Renewal" : ""}`}
      headerBadge={
        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
          {payment.isRenewal ? "Renewal" : "Initial Licence"}
        </Badge>
      }
      meta={[
        {
          icon: <CreditCard className="size-4 text-emerald-800 shrink-0" />,
          label: "Amount",
          value: formatCurrency(payment.amount, payment.currency),
        },
        {
          icon: <Calendar className="size-4 text-emerald-800 shrink-0" />,
          label: "Payment Date",
          value: formatDateLabel(payment.paidAt ?? payment.createdAt),
        },
      ]}
      statusBadge={
        <Badge
          variant="secondary"
          state={state}
          className="px-2.5 py-0.5 shadow-none"
        >
          {label}
        </Badge>
      }
      actions={
        <div
          className="flex items-center gap-1.5"
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
      }
    >
      {(payment.status === "failed" || payment.status === "cancelled") &&
        payment.failureReason ? (
        <div className="text-md text-red-500 leading-relaxed">
          {payment.failureReason}
        </div>
      ) : null}
    </EntityCard>
  );
}

export interface BillingPaymentCardGridProps {
  payments?: BillingPayment[];
  paginatedPayments: BillingPayment[];
  isLoading: boolean;
  onViewDetail: (payment: BillingPayment) => void;
}

export function BillingPaymentCardGrid({
  paginatedPayments,
  onViewDetail,
}: BillingPaymentCardGridProps) {
  if (!paginatedPayments || paginatedPayments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedPayments.map((payment, idx) => (
        <BillingPaymentCard
          key={payment.id}
          payment={payment}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedPayments.length - 1
          }
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}
