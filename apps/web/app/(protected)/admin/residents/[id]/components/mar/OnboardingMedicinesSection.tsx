"use client";

import React from "react";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";

export function OnboardingMedicinesSection({
  medicines,
  loading,
  error,
  onRetry,
}: {
  medicines: PreAdmissionPartCDTO["medicines"];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}): React.JSX.Element | null {
  if (loading)
    return (
      <Text size="md" variant="muted">
        Loading medicines saved during onboarding...
      </Text>
    );
  if (error)
    return (
      <div className="space-y-2" role="alert">
        <Text size="md" variant="muted">
          Unable to load medicines saved during onboarding.
        </Text>
        <Button variant="outline" onClick={onRetry}>
          Retry onboarding medicines
        </Button>
      </div>
    );
  if (medicines.length === 0) return null;
  return (
    <div className="space-y-3">
      <Text as="h4" size="md" weight="semibold">
        Medicines saved during onboarding ({medicines.length})
      </Text>
      <Text size="md" variant="muted">
        These are the saved onboarding records. Dose administration is recorded
        against a MAR prescription or scheduled dose.
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicines.map((medicine, index) => (
          <Card
            key={index}
            variant="white"
            border="secondary"
            className="p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Text
                  as="h4"
                  size="md"
                  weight="semibold"
                  className="text-slate-900"
                >
                  {medicine.name}
                </Text>
                <Text size="md" variant="muted">
                  {[medicine.dose, medicine.form, medicine.route]
                    .filter(Boolean)
                    .join(" · ") || "Dose, form and route not recorded"}
                </Text>
              </div>
              <Badge variant="outline">
                Onboarding{medicine.prn ? " · PRN" : ""}
              </Badge>
            </div>
            {medicine.frequency && (
              <Text size="md" variant="muted">
                Frequency: {medicine.frequency}
              </Text>
            )}
            {(medicine.times?.length ||
              medicine.timing ||
              medicine.scheduledTime) && (
              <Text size="md" variant="muted">
                Timing:{" "}
                {medicine.times?.length
                  ? medicine.times.join(", ")
                  : medicine.timing || medicine.scheduledTime}
              </Text>
            )}
            {(medicine.startDate || medicine.endDate) && (
              <Text size="md" variant="muted">
                {medicine.startDate
                  ? `Starts: ${medicine.startDate}`
                  : "Start date not recorded"}
                {medicine.endDate ? ` · Ends: ${medicine.endDate}` : ""}
              </Text>
            )}
            {medicine.instructions && (
              <Text size="md">Instructions: {medicine.instructions}</Text>
            )}
            <Text size="md" variant="muted">
              {medicine.prescriber
                ? `Prescriber: ${medicine.prescriber}`
                : "Prescriber not recorded"}
            </Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
