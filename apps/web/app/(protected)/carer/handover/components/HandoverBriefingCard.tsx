"use client";

import React from "react";
import { ClipboardList, AlertCircle, Clock } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";
import { formatUkDate, formatUkTime } from "../../../../../lib/utils/uk-date-time";

interface HandoverBriefingCardProps {
  previousShiftHandover?: {
    shiftName?: string | null;
    staffName?: string | null;
    endTime?: string | Date | null;
    handoverNotes?: string | null;
  } | null;
}

export function HandoverBriefingCard({
  previousShiftHandover,
}: HandoverBriefingCardProps) {
  if (!previousShiftHandover) return null;

  const handoverTime = previousShiftHandover.endTime
    ? `${formatUkDate(new Date(previousShiftHandover.endTime), {
        day: "numeric",
        month: "short",
      })}, ${formatUkTime(new Date(previousShiftHandover.endTime))}`
    : null;

  return (
    <Card variant="white" className="rounded-2xl border-emerald-200/80 bg-emerald-50/20 p-5 shadow-xs gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-900">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 shrink-0 text-emerald-800" />
          <Text size="md" weight="bold" className="text-emerald-950">
            Incoming Shift Briefing · from {previousShiftHandover.shiftName || "Previous Shift"}
          </Text>
        </div>
        {handoverTime && (
          <span className="flex items-center gap-1.5 text-md text-emerald-700 font-medium">
            <Clock className="size-3.5" />
            Handed over {handoverTime}
          </span>
        )}
      </div>

      <div className="bg-white/90 p-4 rounded-xl border border-emerald-100 text-md text-slate-700 leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-900 font-semibold mb-1">
          <AlertCircle className="size-3.5 text-emerald-700" />
          <span>Clinical & Operational Notes</span>
        </div>
        <p className="whitespace-pre-line text-slate-800">
          {previousShiftHandover.handoverNotes || "No clinical flags or special instructions recorded by previous shift."}
        </p>
      </div>
    </Card>
  );
}
