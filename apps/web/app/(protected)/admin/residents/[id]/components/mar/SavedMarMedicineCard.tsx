"use client";
import React from "react";
import { Badge, Card, Text } from "@repo/ui/components/ui";
import { formatUkDate } from "../../../../../../../lib/utils/uk-date-time";
import type { currentRegularMedicines } from "./supportedLivingMarData";

export function SavedMarMedicineCard({
  medicine: med,
  stockBalance,
}: {
  medicine: ReturnType<typeof currentRegularMedicines>[number];
  stockBalance?: number;
}): React.JSX.Element {
  const dateLabel = (value: string) =>
    formatUkDate(value, { day: "numeric", month: "short", year: "numeric" });
  return (
    <Card variant="white" border="secondary" className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Text as="h4" size="md" weight="semibold" className="text-slate-900">
            {med.drugName}
          </Text>
          <Text size="md" variant="muted">
            {[med.dose, med.form].filter(Boolean).join(" ") ||
              "Dose/form not recorded"}
          </Text>
        </div>
        <Badge
          variant="secondary"
          state={
            med.label === "Active" || med.label === "Regular"
              ? "success"
              : undefined
          }
          className="border"
        >
          {med.label}
        </Badge>
      </div>
      {(med.startDate || med.endDate) && (
        <Text size="md" variant="muted">
          {med.startDate
            ? `Starts: ${dateLabel(med.startDate)}`
            : "Start date not recorded"}
          {med.endDate ? ` · Ends: ${dateLabel(med.endDate)}` : ""}
        </Text>
      )}
      {med.instructions && (
        <Text size="md" className="text-slate-700">
          Instructions: {med.instructions}
        </Text>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {med.times.length ? (
          med.times.map((time) => (
            <Badge
              key={time}
              variant="outline"
              className="rounded-lg border font-medium"
            >
              {time}
            </Badge>
          ))
        ) : (
          <Text size="md" variant="muted">
            Schedule not recorded
          </Text>
        )}
      </div>
      <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
        <Text size="md" variant="muted">
          Prescriber not recorded
        </Text>
        <Text size="md" weight="medium" className="text-slate-800">
          {stockBalance !== undefined
            ? `Recorded stock balance: ${stockBalance}`
            : "Stock balance not available"}
        </Text>
      </div>
    </Card>
  );
}
