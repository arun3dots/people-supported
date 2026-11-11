"use client";

import React from "react";
import { Shield, CreditCard, Home, Package, PenSquare } from "lucide-react";
import { Card, Button, Text, InfoField, Badge } from "@repo/ui/components/ui";

interface OverviewFinancialCardProps {
  resident: any;
  data: any;
  isAdmin: boolean;
  onEdit: () => void;
}

export function OverviewFinancialCard({
  resident,
  data,
  isAdmin,
  onEdit,
}: OverviewFinancialCardProps) {
  const admission = resident.admission || {};
  const billingParty = admission.billingResponsibleParty || {};
  const belongings = Array.isArray(resident.belongings) ? resident.belongings : [];

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return "N/A";
    return `£${val.toLocaleString("en-GB")}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="bg-surface-card-grey border-none rounded-2xl p-6 lg:p-8 space-y-5 shadow-none font-sans">
      <div className="flex items-center justify-between border-b border-border-secondary/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-surface-primary-light border border-emerald-100 flex items-center justify-center text-icon-primary shrink-0">
            <Shield className="size-4" />
          </div>
          <Text as="h3" size="base" weight="semibold" className="text-slate-900">
            Financial, Billing &amp; Room Agreements
          </Text>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl bg-white border border-slate-200 text-icon-primary hover:bg-slate-50 cursor-pointer shrink-0"
            title="Edit Funding Details"
            onClick={onEdit}
          >
            <PenSquare className="size-4" />
          </Button>
        )}
      </div>

      {/* Funding & Payer Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoField
          label="Primary Payment Method"
          value={data.fundingType || admission.primaryPaymentMethod || resident.fundingType || "Local Authority"}
        />
        <InfoField
          label="Local Authority"
          value={data.localAuthority || admission.localAuthority || "Not specified"}
        />
        <InfoField
          label="Payer / Commissioning Body"
          value={data.payer || admission.payer || "Council / Self"}
        />
        {admission.insurancePolicyNumber && (
          <InfoField
            label="Insurance Policy Number"
            value={admission.insurancePolicyNumber}
          />
        )}
        {admission.benefitId && (
          <InfoField
            label="Benefit ID"
            value={admission.benefitId}
          />
        )}
        {admission.secondaryCoverage && (
          <InfoField
            label="Secondary Coverage"
            value={admission.secondaryCoverage}
          />
        )}
      </div>

      {/* Rates & Financial Schedule */}
      {(admission.agreedRoomRate !== undefined || admission.depositAmount !== undefined) && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-emerald-800" />
            <Text size="md" weight="bold" className="text-slate-900 tracking-wider">
              Agreed Room Rate &amp; Deposit Schedule
            </Text>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-md">
            {admission.agreedRoomRate !== undefined && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Agreed Rate</Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {formatCurrency(admission.agreedRoomRate)} / {admission.agreedRoomRatePeriod || "Month"}
                </Text>
              </div>
            )}
            {admission.depositAmount !== undefined && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Deposit Amount</Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {formatCurrency(admission.depositAmount)}
                </Text>
              </div>
            )}
            {admission.depositDate && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Deposit Date</Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {formatDate(admission.depositDate)}
                </Text>
              </div>
            )}
            {admission.paymentSchedule && (
              <div>
                <Text size="md" weight="medium" className="text-slate-500">Payment Schedule</Text>
                <Text size="md" weight="bold" className="text-slate-900">
                  {admission.paymentSchedule}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Responsible Party & Room Agreements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        {billingParty.name && (
          <div className="space-y-1">
            <Text size="md" weight="medium" className="text-slate-600 font-bold">
              Billing Responsible Party
            </Text>
            <Text size="md" weight="bold" className="text-slate-900">
              {billingParty.name} {billingParty.relationship ? `(${billingParty.relationship})` : ""}
            </Text>
            {billingParty.phone && (
              <Text size="md" weight="regular" className="text-slate-600">
                Phone: {billingParty.phone}
              </Text>
            )}
            {billingParty.address && (
              <Text size="md" weight="regular" className="text-slate-600">
                Address: {billingParty.address}
              </Text>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Text size="md" weight="medium" className="text-slate-600 font-bold">
            Room Type &amp; Move-in
          </Text>
          <Text size="md" weight="bold" className="text-slate-900">
            Type: {admission.roomTypePreference || "Standard Single"}
          </Text>
          {admission.moveInDateTime && (
            <Text size="md" weight="regular" className="text-slate-500">
              Move-in: {formatDate(admission.moveInDateTime)}
            </Text>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="secondary"
              state={admission.valuablesInSafe ? "warning" : "inactive"}
              className="px-2.5 py-0.5 shadow-none"
            >
              {admission.valuablesInSafe ? "Valuables in Safe" : "No Safe Storage"}
            </Badge>
            <Badge
              variant="secondary"
              state="inactive"
              className="px-2.5 py-0.5 shadow-none"
            >
              Belongings Logged: {belongings.length}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
