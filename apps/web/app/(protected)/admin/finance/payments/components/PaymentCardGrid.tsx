"use client";

import React from "react";
import { format } from "date-fns";
import { CreditCard, Calendar, FileText } from "lucide-react";
import {
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../../lib/components/shared";
import type { PaymentItem } from "./types";
import {
  getPaymentStatusBadgeState,
  getPaymentStatusLabel,
} from "./usePaymentColumns";

function formatDateLabel(dateStr?: string | Date): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
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

export interface PaymentCardProps {
  payment: PaymentItem;
  showRightDivider?: boolean;
}

export function PaymentCard({
  payment,
  showRightDivider = false,
}: PaymentCardProps) {
  const residentName = payment.invoice?.resident?.fullName || "Unassigned Resident";
  const initial = residentName.charAt(0).toUpperCase();
  const room = payment.invoice?.resident?.bed?.room?.roomNumber;
  const state = getPaymentStatusBadgeState(payment.invoice?.status, payment.status);
  const label = getPaymentStatusLabel(payment.invoice?.status, payment.status);

  return (
    <EntityCard
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {payment.invoice?.resident?.photoUrl && (
            <AvatarImage
              src={payment.invoice.resident.photoUrl}
              alt={residentName}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={payment.invoice?.invoiceNumber || "Payment Record"}
      subtitle={`${residentName}${room ? ` • Room ${room}` : ""}`}
      headerBadge={
        <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">
          {payment.paymentMethod}
        </Badge>
      }
      meta={[
        {
          icon: <CreditCard className="size-4 text-emerald-800 shrink-0" />,
          label: "Amount Paid",
          value: formatCurrency(payment.amountPaid),
        },
        {
          icon: <Calendar className="size-4 text-emerald-800 shrink-0" />,
          label: "Payment Date",
          value: formatDateLabel(payment.paymentDate),
        },
        {
          icon: <FileText className="size-4 text-emerald-800 shrink-0" />,
          label: "Reference",
          value: payment.reference || "—",
        },
      ]}
      statusBadge={
        <Badge variant="secondary" state={state} className="px-2.5 py-0.5 shadow-none">
          {label}
        </Badge>
      }
    />
  );
}

export interface PaymentCardGridProps {
  payments?: PaymentItem[];
  paginatedPayments: PaymentItem[];
  isLoading: boolean;
}

export function PaymentCardGrid({
  paginatedPayments,
}: PaymentCardGridProps) {
  if (!paginatedPayments || paginatedPayments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedPayments.map((payment, idx) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          showRightDivider={
            idx % 3 !== 2 && idx !== paginatedPayments.length - 1
          }
        />
      ))}
    </div>
  );
}
