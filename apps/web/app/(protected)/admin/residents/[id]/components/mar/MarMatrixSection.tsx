"use client";

import React from "react";
import { format, isSameDay } from "date-fns";
import { Check, Minus, X } from "lucide-react";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import type { MedicationRoundRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";

export interface MarMatrixRow {
  id: string;
  drugName: string;
  doseAndForm: string;
  timeLabel: string;
  round: MedicationRoundRow | null;
  administrations: MedicationRoundRow["administrations"];
}

interface MarMatrixSectionProps {
  rangeStartLabel: string;
  rangeEndLabel: string;
  sevenDays: Date[];
  matrixRows: MarMatrixRow[];
  onAdministerRound: (round: MedicationRoundRow) => void;
}

export function MarMatrixSection({
  rangeStartLabel,
  rangeEndLabel,
  sevenDays,
  matrixRows,
  onAdministerRound,
}: MarMatrixSectionProps) {
  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Medication Administration Record (MAR)
          </Text>
          <Text size="md" variant="muted">
            {rangeStartLabel} – {rangeEndLabel} · Tap today&apos;s dose to record it
          </Text>
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
            <span className="size-5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium inline-flex items-center justify-center">
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

      <Card variant="white" border="secondary" className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 min-w-[200px]">Medicine / time</TableHead>
              {sevenDays.map((day, idx) => {
                const isTodayCol = idx === 6;
                return (
                  <TableHead key={day.toISOString()} className="text-center min-w-[72px]">
                    <Text
                      size="md"
                      weight={isTodayCol ? "semibold" : "medium"}
                      className={isTodayCol ? "text-slate-900" : "text-slate-600"}
                    >
                      {format(day, "EEE dd")}
                    </Text>
                    {isTodayCol && (
                      <Text size="md" weight="medium" className="text-emerald-700">
                        Today
                      </Text>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrixRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4">
                  <Text size="md" weight="medium" className="text-slate-900">
                    {row.drugName}
                  </Text>
                  <Text size="md" variant="muted">
                    {row.doseAndForm} · {row.timeLabel}
                  </Text>
                </TableCell>
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
                    <TableCell
                      key={day.toISOString()}
                      className={`text-center ${isTodayCol ? "bg-slate-50/80" : ""}`}
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
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Card>
  );
}
