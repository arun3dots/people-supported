"use client";

import React from "react";
import { AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";

interface ExpiredRenewalBannerProps {
  status: string;
  validTo?: string | Date | null;
  onRenew: () => void;
  isRenewing?: boolean;
}

export function ExpiredRenewalBanner({
  status,
  validTo,
  onRenew,
  isRenewing = false,
}: ExpiredRenewalBannerProps) {
  const isExpired = status === "Expired" || status === "expired";
  const now = new Date();
  const expiryDate = validTo ? new Date(validTo) : null;
  const isExpiringSoon =
    !isExpired &&
    expiryDate &&
    expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 &&
    (status === "Active" || status === "active");

  if (!isExpired && !isExpiringSoon) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all font-sans ${isExpired
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200"
        }`}
    >
      <div className="flex items-start gap-3">
        {isExpired ? (
          <AlertCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
        ) : (
          <Clock className="size-5 text-amber-600 mt-0.5 shrink-0" />
        )}
        <div className="space-y-0.5">
          <Text as="h4" size="sm" weight="semibold" className={isExpired ? "text-red-950" : "text-amber-950"}>
            {isExpired
              ? "Care Plan Expired — Renewal Required"
              : "Care Plan Expiring Soon"}
          </Text>
          <Text size="sm" variant="muted" className="leading-relaxed">
            {isExpired
              ? "This care plan is no longer valid. In accordance with clinical governance, create a renewal version to carry over unchanged goals and submit for sign-off."
              : `This plan is scheduled to expire on ${expiryDate?.toLocaleDateString()}. Prepare a renewal to prevent gaps in active care.`}
          </Text>
        </div>
      </div>
      <Button
        onClick={onRenew}
        disabled={isRenewing}
        variant={isExpired ? "destructive" : "primary"}
        size="sm"
        className="shrink-0 gap-2 text-md font-semibold rounded-xl shadow-none"
      >
        <RefreshCw className={`size-3.5 ${isRenewing ? "animate-spin" : ""}`} />
        Renew Care Plan
      </Button>
    </div>
  );
}
