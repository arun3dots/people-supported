"use client";

import React from "react";
import { Clock, Play } from "lucide-react";
import { Button, Text, Card } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { Shift } from "../../../../../lib/types/shifts";
import { StaffMember } from "../../../../../lib/types/staff";
import { formatUkTime } from "../../../../../lib/utils/uk-date-time";
import { getShiftClockInEligibility } from "../../../../../lib/utils/shift-timing";

interface TaskShiftBannerProps {
  userName: string;
  activeShift?: Shift | null;
  staffList: StaffMember[];
  unitName?: string;
  onClockIn?: () => void;
  onClockOut?: () => void;
  onOpenShiftOperations?: () => void;
  isClockActionPending?: boolean;
}

export function TaskShiftBanner({
  userName,
  activeShift,
  staffList,
  unitName = "Oak",
  onClockIn,
  onClockOut,
  onOpenShiftOperations,
  isClockActionPending = false,
}: TaskShiftBannerProps) {
  const eligibility = getShiftClockInEligibility(activeShift);
  const isStarted = Boolean(activeShift?.isStarted);

  // Colleague summary
  const onDutyColleagues = staffList
    .slice(0, 3)
    .map((s) => `${s.fullName.split(" ")[0]} (${s.role?.name || "Carer"})`)
    .join(", ");

  const shiftTimeRange =
    activeShift?.startTime && activeShift?.endTime
      ? `${formatUkTime(activeShift.startTime)}–${formatUkTime(activeShift.endTime)}`
      : activeShift?.formattedStartTime && activeShift?.formattedEndTime
        ? `${activeShift.formattedStartTime}–${activeShift.formattedEndTime}`
        : null;

  const shiftTypeName = activeShift?.type?.name || activeShift?.name || null;
  const resolvedUnit = activeShift?.wing?.name || activeShift?.wardName || (activeShift ? unitName : null);

  const hasTodayShift = Boolean(activeShift && eligibility.isToday);

  const clockInDisplay =
    isStarted && (activeShift as { actualStartedTime?: string })?.actualStartedTime
      ? `Clocked in ${(activeShift as { actualStartedTime?: string }).actualStartedTime}`
      : isStarted && activeShift?.startTime
        ? `Clocked in ${formatUkTime(activeShift.startTime)}`
        : !hasTodayShift
          ? "No scheduled shift"
          : "Not clocked in";

  const bannerTitle = !hasTodayShift
    ? `${userName} · No Shift Scheduled Today`
    : `${userName} · ${shiftTypeName || "Shift"} ${shiftTimeRange || ""} ${resolvedUnit ? `· ${resolvedUnit}` : ""}`.trim();

  const bannerSubtitle = !hasTodayShift
    ? "No active or scheduled shift for today on your rota"
    : onDutyColleagues
      ? `On with you: ${onDutyColleagues}`
      : "On duty with your care team on this shift";

  const clockInButtonText = isClockActionPending
    ? "Starting..."
    : !hasTodayShift
      ? "Clock in"
      : !eligibility.isTimeReached && eligibility.formattedStartTime
        ? `Clock in at ${eligibility.formattedStartTime}`
        : "Clock in";

  return (
    <Card
      variant="primary"
      className="p-4 rounded-xl flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
    >
      <div
        className="space-y-1 cursor-pointer"
        onClick={onOpenShiftOperations}
        title="Click to view shift operations & continuity handover"
      >
        <Text as="h2" size="base" weight="bold" className="text-white hover:underline">
          {bannerTitle}
        </Text>
        <Text size="sm" className="text-white/80">
          {bannerSubtitle}
        </Text>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
        <div className="flex items-center gap-1.5 text-sm text-white/90">
          <Clock className="size-3.5" />
          <Text as="span" size="sm" weight="medium" className="text-white">
            {clockInDisplay}
          </Text>
        </div>

        {!isStarted ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!eligibility.canClockIn || isClockActionPending}
            onClick={onClockIn}
            title={eligibility.reason || "Clock in"}
            className={cn(
              "gap-1.5 h-8 text-sm font-semibold px-3.5 bg-white text-primary border-white transition-opacity",
              eligibility.canClockIn && !isClockActionPending
                ? "hover:bg-slate-50 cursor-pointer"
                : "opacity-60 cursor-not-allowed",
            )}
          >
            <Play className="size-3.5 fill-current" />
            {clockInButtonText}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isClockActionPending}
            onClick={onClockOut}
            className="gap-1.5 h-8 text-sm font-semibold px-3.5 bg-white text-primary hover:bg-slate-50 border-white cursor-pointer"
          >
            End Shift &amp; Handover
          </Button>
        )}
      </div>
    </Card>
  );
}
