"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, Package, Pill, Plus } from "lucide-react";
import { Button, Card, SummaryCardsGrid, Text } from "@repo/ui/components/ui";
import type {
  CreateMedicationStockTransactionDTO,
  PreAdmissionPartCDTO,
} from "@repo/schema";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import {
  addUkCalendarDays,
  formatUkDate,
  getUkDateString,
  getUkDayStart,
} from "../../../../../../../lib/utils/uk-date-time";
import { SavedMarMedicineCard } from "./SavedMarMedicineCard";
import { OnboardingMedicinesSection } from "./OnboardingMedicinesSection";
import { MarMatrixSection } from "./MarMatrixSection";
import {
  buildMarMatrixRows,
  currentRegularMedicines,
  marAdherence,
  prescriptionStockBalances,
} from "./supportedLivingMarData";

interface SupportedLivingMarOverviewProps {
  prescriptions: MedicationPrescriptionRow[];
  onboardingMedicines?: PreAdmissionPartCDTO["medicines"];
  onboardingLoading?: boolean;
  onboardingError?: boolean;
  onRetryOnboarding?: () => void;
  rounds?: MedicationRoundRow[];
  prnCount: number;
  stockLedger?: CreateMedicationStockTransactionDTO[];
  stockLoading?: boolean;
  stockError?: boolean;
  canReadStock?: boolean;
  onRetryStock?: () => void;
  isEditable?: boolean;
  canAdminister?: boolean;
  onAddMedication: () => void;
  onAdministerRound: (round: MedicationRoundRow) => void;
}

export function SupportedLivingMarOverview({
  prescriptions,
  onboardingMedicines = [],
  onboardingLoading = false,
  onboardingError = false,
  onRetryOnboarding = () => {},
  rounds = [],
  prnCount,
  stockLedger = [],
  stockLoading = false,
  stockError = false,
  canReadStock = true,
  onRetryStock,
  isEditable = true,
  canAdminister = true,
  onAddMedication,
  onAdministerRound,
}: SupportedLivingMarOverviewProps): React.JSX.Element {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const today = getUkDateString(now);
  const medicines = currentRegularMedicines(prescriptions, rounds, today);
  const savedMedicines = currentRegularMedicines(
    prescriptions,
    rounds,
    today,
    true,
  );
  const sevenDays = useMemo(() => {
    const end = getUkDayStart(now);
    return Array.from({ length: 7 }, (_, index) =>
      addUkCalendarDays(end, index - 6),
    );
  }, [now]);
  const matrixRows = useMemo(
    () =>
      buildMarMatrixRows(prescriptions, rounds, sevenDays.map(getUkDateString)),
    [prescriptions, rounds, sevenDays],
  );
  const adherenceStats = marAdherence(matrixRows, now);
  const balances = prescriptionStockBalances(stockLedger);
  const knownBalances = medicines.flatMap((rx) =>
    rx.stockId && balances.has(rx.stockId) ? [balances.get(rx.stockId)!] : [],
  );
  const stockAvailable = canReadStock && !stockLoading && !stockError;
  const outOfStock = knownBalances.filter((balance) => balance === 0).length;
  const unknownStock = medicines.length - knownBalances.length;
  const summaryCards = [
    {
      title: "Current medicines",
      value: medicines.length + prnCount,
      subtitle: `${medicines.length} regular · ${prnCount} PRN`,
      icon: <Pill className="size-5 text-primary" />,
      iconClassName: "bg-slate-100",
    },
    {
      title: "7-day MAR adherence",
      value:
        adherenceStats.pct === null ? "No doses due" : `${adherenceStats.pct}%`,
      subtitle: `${adherenceStats.totalGiven} of ${adherenceStats.totalDue} due scheduled doses given`,
      icon: <Activity className="size-5 text-emerald-700" />,
      iconClassName: "bg-emerald-50",
    },
    {
      title: "Stock alerts",
      value: stockLoading
        ? "Loading..."
        : !canReadStock || stockError
          ? "Unavailable"
          : knownBalances.length
            ? outOfStock
            : "Not recorded",
      subtitle: !canReadStock
        ? "Stock access requires a clinical management role"
        : stockError
          ? "Could not load stock balances"
          : knownBalances.length
            ? `Out of stock · ${unknownStock} medicines without a balance`
            : "No linked prescription balances recorded",
      icon: <Package className="size-5 text-slate-600" />,
      iconClassName: "bg-slate-100",
    },
  ];
  const rangeStartLabel = formatUkDate(sevenDays[0]!, {
    day: "2-digit",
    month: "short",
  });
  const rangeEndLabel = formatUkDate(sevenDays[6]!, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6 font-sans">
      <SummaryCardsGrid
        cards={summaryCards}
        className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
      />
      {stockError && (
        <Button variant="outline" onClick={onRetryStock}>
          Retry stock balances
        </Button>
      )}
      <Card variant="surface" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-primary" />
            <Text
              as="h3"
              size="md"
              weight="semibold"
              className="text-slate-900"
            >
              Prescribed medicines
            </Text>
          </div>
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMedication}
              className="bg-white gap-1.5"
            >
              <Plus className="size-3.5" />
              Add medicine
            </Button>
          )}
        </div>
        {savedMedicines.length === 0 ? (
          <Text size="md" variant="muted">
            No MAR prescriptions or scheduled doses recorded.
          </Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedMedicines.map((med) => (
              <SavedMarMedicineCard
                key={med.id}
                medicine={med}
                stockBalance={
                  stockAvailable && med.stockId
                    ? balances.get(med.stockId)
                    : undefined
                }
              />
            ))}
          </div>
        )}
        <OnboardingMedicinesSection
          medicines={onboardingMedicines}
          loading={onboardingLoading}
          error={onboardingError}
          onRetry={onRetryOnboarding}
        />
      </Card>
      <MarMatrixSection
        rangeStartLabel={rangeStartLabel}
        rangeEndLabel={rangeEndLabel}
        sevenDays={sevenDays}
        matrixRows={matrixRows}
        now={now}
        canAdminister={canAdminister}
        onAdministerRound={onAdministerRound}
      />
    </div>
  );
}
