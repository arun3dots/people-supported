"use client";

import React from "react";
import {
  RefreshCcw,
  CreditCard,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { Badge, Button, Card, Skeleton } from "@repo/ui/components/ui";
import type {
  BillingHistory,
  BillingPayment,
} from "../../../../lib/queries/billing/useBilling";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface BillingOverviewCardProps {
  data?: BillingHistory;
  isLoading: boolean;
}

export function BillingOverviewCard({
  data,
  isLoading,
}: BillingOverviewCardProps) {
  const pendingRenewal: BillingPayment | null =
    (data?.payments ?? []).find(
      (p) => p.status === "created" && p.isRenewal
    ) ?? null;
  const isActive = data?.subscriptionStatus === "active";

  return (
    <Card
      variant="surface"
      className="p-6 lg:p-7 shadow-none bg-surface-card-grey border-none rounded-2xl flex flex-col gap-5"
    >
      {isLoading && !data ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-13 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-13 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                <CreditCard className="size-6 text-emerald-800" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-lg text-slate-900">
                    {data?.packageName
                      ? `${data.packageName} Plan`
                      : "No active plan"}
                  </h3>
                  <Badge
                    state={isActive ? "success" : "warning"}
                    className="px-2.5 py-0.5 text-md shadow-none"
                  >
                    {isActive ? "Active Plan" : "Payment Required"}
                  </Badge>
                </div>
                <p className="text-md text-slate-500 mt-1 flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-slate-400" />
                  {isActive && data?.nextRenewalAt
                    ? `Renews automatically on ${fmtDate(data.nextRenewalAt)}`
                    : isActive
                      ? "Active subscription"
                      : "Subscription requires attention"}
                </p>
              </div>
            </div>

            {pendingRenewal?.shortUrl && (
              <Button
                variant="primary"
                className="rounded-xl gap-2 text-md font-semibold self-start md:self-auto cursor-pointer"
                onClick={() =>
                  window.open(
                    pendingRenewal.shortUrl!,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                <RefreshCcw className="size-3.5" />
                Renew Now
              </Button>
            )}
          </div>

          {pendingRenewal && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-md text-amber-800 font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                <span>
                  Your subscription is due for renewal. Complete renewal to avoid
                  service interruption.
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
