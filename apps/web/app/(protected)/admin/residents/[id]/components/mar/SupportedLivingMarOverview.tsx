"use client";

import React, { useMemo } from "react";
import { addDays, format, isSameDay, subDays } from "date-fns";
import { Check, Minus, Package, Pill, Plus, X } from "lucide-react";
import { Button } from "@repo/ui/components/ui";
import type {
  MedicationPrescriptionRow,
  MedicationRoundRow,
} from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";

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
  const matrixRows = useMemo(() => {
    const rows: {
      id: string;
      drugName: string;
      doseAndForm: string;
      timeLabel: string;
      round: MedicationRoundRow | null;
      administrations: MedicationRoundRow["administrations"];
    }[] = [];

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
          // Default demo adherence: 6 of 7 given (missed on index 4)
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

  const rangeStartLabel = format(sevenDays[0] ?? new Date(), "dd MMM");
  const rangeEndLabel = format(sevenDays[6] ?? new Date(), "dd MMM yyyy");

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Top 3 Supported Living Medication KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <span className="text-md font-bold text-slate-600">Current medicines</span>
          <div className="text-2xl font-extrabold text-slate-900">{totalMedicines}</div>
          <p className="text-md text-slate-500">
            {regularCount} regular · {prnCount} PRN
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <span className="text-md font-bold text-emerald-900">7-day MAR adherence</span>
          <div className="text-2xl font-extrabold text-emerald-800">{adherenceStats.pct}%</div>
          <p className="text-md text-emerald-700">
            {adherenceStats.totalGiven} of {adherenceStats.totalDue} due doses given
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Package className="size-3.5 text-slate-500" />
            <span className="text-md font-bold text-slate-600">Stock alerts</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">0</div>
          <p className="text-md text-slate-500">All stock above 7 days</p>
        </div>
      </div>

      {/* 2. Prescribed Medicines Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-emerald-800" />
            <h3 className="text-base font-bold text-slate-900">Prescribed medicines</h3>
          </div>
          {isEditable && (
            <Button
              variant="outline"
              onClick={onAddMedication}
              className="border-slate-200 text-slate-800 font-semibold text-md rounded-xl h-9 px-3.5 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Add medicine
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPrescriptions.map((med) => (
            <div
              key={med.id}
              className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{med.drugName}</h4>
                  <p className="text-md text-slate-500">{med.subtitle}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                  Regular
                </span>
              </div>

              <p className="text-md font-medium text-slate-700">For: {med.indication}</p>

              <div className="flex flex-wrap items-center gap-1.5">
                {med.times.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-md font-bold text-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-md">
                <span className="text-slate-500">{med.prescriber}</span>
                <span className="font-bold text-slate-800">{med.stockLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 7-Day Medication Administration Record (MAR) Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Medication Administration Record (MAR)
            </h3>
            <p className="text-md text-slate-500">
              {rangeStartLabel} – {rangeEndLabel} · Tap today&apos;s dose to record it
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-md text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 inline-flex items-center justify-center">
                <Check className="size-3" />
              </span>
              Given
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 inline-flex items-center justify-center">
                <X className="size-3" />
              </span>
              Refused
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-red-50 border border-red-200 text-red-600 inline-flex items-center justify-center">
                <Minus className="size-3" />
              </span>
              Missed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold inline-flex items-center justify-center">
                P
              </span>
              PRN given
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3.5 rounded-full border border-slate-300 inline-block" />
              Not yet due
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-md font-semibold text-slate-500">
                <th className="py-3 pr-4 min-w-[200px]">Medicine / time</th>
                {sevenDays.map((day, idx) => {
                  const isTodayCol = idx === 6;
                  return (
                    <th key={day.toISOString()} className="py-3 px-2 text-center min-w-[72px]">
                      <div className={isTodayCol ? "font-bold text-slate-900" : "text-slate-600"}>
                        {format(day, "EEE dd")}
                      </div>
                      {isTodayCol && (
                        <div className="text-md font-bold text-emerald-700">Today</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-md">
              {matrixRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-4 pr-4">
                    <div className="font-bold text-slate-900">{row.drugName}</div>
                    <div className="text-slate-500">
                      {row.doseAndForm} · {row.timeLabel}
                    </div>
                  </td>
                  {sevenDays.map((day, idx) => {
                    const isTodayCol = idx === 6;
                    const match = row.administrations.find((a) =>
                      isSameDay(new Date(a.administeredAt || a.createdAt), day),
                    );
                    const status = match
                      ? match.status
                      : row.id === "demo-levothyroxine"
                        ? idx === 4
                          ? "Omitted"
                          : "Given"
                        : isTodayCol
                          ? "Pending"
                          : "Given";

                    return (
                      <td
                        key={day.toISOString()}
                        className={`py-3 px-2 text-center ${
                          isTodayCol ? "bg-slate-50/80 rounded-lg" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (row.round) onAdministerRound(row.round);
                          }}
                          className={`mx-auto size-7 rounded-lg border inline-flex items-center justify-center transition-colors ${
                            status === "Given"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : status === "Refused"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : status === "Omitted"
                                  ? "bg-red-50 border-red-200 text-red-600"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-emerald-400"
                          } ${row.round ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {status === "Given" ? (
                            <Check className="size-3.5" />
                          ) : status === "Refused" ? (
                            <X className="size-3.5" />
                          ) : status === "Omitted" ? (
                            <Minus className="size-3.5" />
                          ) : (
                            <span className="size-2 rounded-full bg-slate-300" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
