"use client";

import React from "react";
import { Check, Minus, X } from "lucide-react";
import {
  Button,
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
import {
  formatUkDate,
  getUkDateString,
} from "../../../../../../../lib/utils/uk-date-time";
import {
  canRecordMarRound,
  marRoundState,
  recordedDay,
  type MarMatrixRow,
} from "./supportedLivingMarData";
export type { MarMatrixRow } from "./supportedLivingMarData";

interface MarMatrixSectionProps {
  rangeStartLabel: string;
  rangeEndLabel: string;
  sevenDays: Date[];
  matrixRows: MarMatrixRow[];
  now: Date;
  canAdminister: boolean;
  onAdministerRound: (round: MedicationRoundRow) => void;
}

function statusClass(status: string) {
  if (status === "Given")
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (status === "Refused")
    return "bg-amber-50 border-amber-200 text-amber-700";
  if (status === "Omitted" || status === "Missed")
    return "bg-red-50 border-red-200 text-red-600";
  return "bg-white border-slate-200 text-slate-600";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Given") return <Check className="size-4" />;
  if (status === "Refused") return <X className="size-4" />;
  if (status === "Omitted" || status === "Missed")
    return <Minus className="size-4" />;
  if (status === "NPO") return <span className="text-md">N</span>;
  if (status === "Not yet due")
    return <span className="size-2 rounded-full border border-slate-400" />;
  return <span className="text-md">?</span>;
}

export function MarMatrixSection({
  rangeStartLabel,
  rangeEndLabel,
  sevenDays,
  matrixRows,
  now,
  canAdminister,
  onAdministerRound,
}: MarMatrixSectionProps): React.JSX.Element {
  const today = getUkDateString(now);
  return (
    <Card variant="surface" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <Text as="h3" size="md" weight="semibold" className="text-slate-900">
            Medication Administration Record (MAR)
          </Text>
          <Text size="md" variant="muted">
            {rangeStartLabel} – {rangeEndLabel} ·{" "}
            {canAdminister
              ? "Select a due dose today to record it"
              : "Recorded medication history"}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-md text-slate-600">
          {[
            "Given",
            "Refused",
            "Omitted",
            "NPO",
            "Not recorded",
            "Not yet due",
          ].map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className={`size-6 rounded-md border inline-flex items-center justify-center ${statusClass(status)}`}
              >
                <StatusIcon status={status} />
              </span>
              {status}
            </span>
          ))}
          <span>— Not scheduled</span>
        </div>
      </div>
      <Card variant="white" border="secondary" className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Medicine / time</TableHead>
              {sevenDays.map((day) => {
                const isToday = getUkDateString(day) === today;
                return (
                  <TableHead key={day.toISOString()} className="text-center">
                    <Text size="md" weight={isToday ? "semibold" : "medium"}>
                      {formatUkDate(day, { weekday: "short", day: "2-digit" })}
                    </Text>
                    {isToday && (
                      <Text
                        size="md"
                        weight="medium"
                        className="text-emerald-700"
                      >
                        Today
                      </Text>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrixRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-6 text-center">
                  <Text size="md" variant="muted">
                    No scheduled medication doses recorded for this period.
                  </Text>
                </TableCell>
              </TableRow>
            )}
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
                {sevenDays.map((day) => {
                  const dayKey = getUkDateString(day);
                  const doses = row.rounds.filter(
                    (round) => recordedDay(round.scheduledTime) === dayKey,
                  );
                  return (
                    <TableCell
                      key={dayKey}
                      className={`text-center ${dayKey === today ? "bg-slate-50/80" : ""}`}
                    >
                      {doses.length === 0 ? (
                        <span title="Not scheduled" className="text-slate-400">
                          —
                        </span>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-1">
                          {doses.map((round) => {
                            const status = marRoundState(round, now);
                            const label = `${row.drugName}, ${row.timeLabel}, ${formatUkDate(day, { day: "numeric", month: "short" })}: ${status}`;
                            return (
                              <Button
                                key={round.id}
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={label}
                                title={label}
                                disabled={
                                  !canAdminister ||
                                  !canRecordMarRound(round, now)
                                }
                                onClick={() => onAdministerRound(round)}
                                className={`mx-auto size-8 rounded-lg border ${statusClass(status)}`}
                              >
                                <StatusIcon status={status} />
                              </Button>
                            );
                          })}
                        </div>
                      )}
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
