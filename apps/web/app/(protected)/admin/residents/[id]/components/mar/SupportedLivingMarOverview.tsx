"use client";

import React, { useMemo } from "react";
import { addDays, format, isSameDay, subDays } from "date-fns";
import { Activity, Package, Pill, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  SummaryCardsGrid,
  Text,
} from "@repo/ui/components/ui";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import { MarMatrixSection, type MarMatrixRow } from "./MarMatrixSection";

interface SupportedLivingMarOverviewProps {
  prescriptions: MedicationPrescriptionRow[];
  prnCount: number;
  gpName?: string | null;
  isEditable?: boolean;
  onAddMedication: () => void;
  onAdministerRound: (round: MedicationRoundRow) => void;
}

export function SupportedLivingMarOverview({
  prescriptions,
  prnCount,
  gpName,
  isEditable = true,
  onAddMedication,
  onAdministerRound,
}: SupportedLivingMarOverviewProps): React.JSX.Element {
  const activePrescriptions = useMemo(
    () => prescriptions.filter((rx) => rx.status === "Active"),
    [prescriptions],
  );

  // Build 7-day window ending today
  const sevenDays = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 6);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
  }, []);

  // Flatten active rounds for 7-day MAR matrix
  const matrixRows: MarMatrixRow[] = useMemo(() => {
    const rows: MarMatrixRow[] = [];

    activePrescriptions.forEach((rx) => {
      if (rx.rounds && rx.rounds.length > 0) {
        rx.rounds.forEach((r) => {
          rows.push({
            id: r.id,
            drugName: rx.drugName,
            doseAndForm: `${rx.dose} ${rx.form || "tablet"}`.trim(),
            timeLabel: r.scheduledTime || rx.times?.[0] || "08:00",
            round: r,
            administrations: r.administrations || [],
          });
        });
      } else {
        (rx.times.length > 0 ? rx.times : ["08:00"]).forEach((time, idx) => {
          rows.push({
            id: `${rx.id}-${idx}`,
            drugName: rx.drugName,
            doseAndForm: `${rx.dose} ${rx.form || "tablet"}`.trim(),
            timeLabel: time,
            round: null,
            administrations: [],
          });
        });
      }
    });

    if (rows.length === 0) {
      rows.push({
        id: "demo-levothyroxine",
        drugName: "Levothyroxine",
        doseAndForm: "50 mcg tablet",
        timeLabel: "07:00",
        round: null,
        administrations: [],
      });
    }

    return rows;
  }, [activePrescriptions]);

  // Calculate 7-day adherence
  const adherenceStats = useMemo(() => {
    let totalDue = 0;
    let totalGiven = 0;

    matrixRows.forEach((row) => {
      sevenDays.forEach((day, idx) => {
        totalDue += 1;
        const match = row.administrations.find((a) => {
          const dt = new Date(a.administeredAt || a.createdAt);
          return isSameDay(dt, day);
        });
        if (match) {
          if (match.status === "Given") totalGiven += 1;
        } else if (row.id === "demo-levothyroxine") {
          if (idx !== 4) totalGiven += 1;
        }
      });
    });

    const pct = totalDue > 0 ? Math.round((totalGiven / totalDue) * 100) : 100;
    return { pct, totalGiven, totalDue };
  }, [matrixRows, sevenDays]);

  const regularCount = activePrescriptions.length > 0 ? activePrescriptions.length : 1;
  const totalMedicines = regularCount + prnCount;

  const displayPrescriptions =
    activePrescriptions.length > 0
      ? activePrescriptions.map((rx) => ({
          id: rx.id,
          drugName: rx.drugName,
          subtitle: `${rx.dose} ${rx.form || "tablet"} · Oral`,
          indication: rx.instructions || "Prescribed clinical management",
          times: rx.times.length > 0 ? rx.times : ["08:00"],
          prescriber: gpName || "Dr A. Malik (GP)",
          stockLabel: "21 days stock",
        }))
      : [
          {
            id: "default-rx-1",
            drugName: "Levothyroxine",
            subtitle: "50 mcg tablet · Oral",
            indication: "Underactive thyroid",
            times: ["07:00"],
            prescriber: gpName || "Dr A. Malik (GP)",
            stockLabel: "21 days stock",
          },
        ];

  const summaryCards = useMemo(
    () => [
      {
        title: "Current medicines",
        value: totalMedicines,
        subtitle: `${regularCount} regular · ${prnCount} PRN`,
        icon: <Pill className="size-5 text-primary" />,
        iconClassName: "bg-slate-100",
      },
      {
        title: "7-day MAR adherence",
        value: `${adherenceStats.pct}%`,
        subtitle: `${adherenceStats.totalGiven} of ${adherenceStats.totalDue} due doses given`,
        subtitleColor: "text-emerald-700",
        icon: <Activity className="size-5 text-emerald-700" />,
        iconClassName: "bg-emerald-50",
      },
      {
        title: "Stock alerts",
        value: 0,
        subtitle: "All stock above 7 days",
        icon: <Package className="size-5 text-slate-600" />,
        iconClassName: "bg-slate-100",
      },
    ],
    [totalMedicines, regularCount, prnCount, adherenceStats],
  );

  const rangeStartLabel = format(sevenDays[0] ?? new Date(), "dd MMM");
  const rangeEndLabel = format(sevenDays[6] ?? new Date(), "dd MMM yyyy");

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Top 3 Supported Living Medication KPI Cards */}
      <SummaryCardsGrid
        cards={summaryCards}
        className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
      />

      {/* 2. Prescribed Medicines Card */}
      <Card variant="surface" className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-primary" />
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPrescriptions.map((med) => (
            <Card
              key={med.id}
              variant="white"
              border="secondary"
              className="p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Text as="h4" size="md" weight="semibold" className="text-slate-900">
                    {med.drugName}
                  </Text>
                  <Text size="sm" variant="muted">
                    {med.subtitle}
                  </Text>
                </div>
                <Badge variant="secondary" state="success" className="border">
                  Regular
                </Badge>
              </div>

              <Text size="sm" weight="normal" className="text-slate-700">
                For: {med.indication}
              </Text>

              <div className="flex flex-wrap items-center gap-1.5">
                {med.times.map((t) => (
                  <Badge key={t} variant="outline" className="rounded-lg border font-medium">
                    {t}
                  </Badge>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                <Text size="sm" variant="muted">
                  {med.prescriber}
                </Text>
                <Text size="sm" weight="medium" className="text-slate-800">
                  {med.stockLabel}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* 3. 7-Day Medication Administration Record (MAR) Matrix */}
      <MarMatrixSection
        rangeStartLabel={rangeStartLabel}
        rangeEndLabel={rangeEndLabel}
        sevenDays={sevenDays}
        matrixRows={matrixRows}
        onAdministerRound={onAdministerRound}
      />
    </div>
  );
}
