"use client";

import React, { useMemo } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { AlertCircle, Phone, UserPlus } from "lucide-react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { AttendanceRecord } from "./AttendanceTable";
import { getShiftDateStr, getShiftStaffIds } from "./rotaDataUtils";

interface AttendanceSidebarProps {
  records: AttendanceRecord[];
  shifts?: Shift[];
  weekStart?: Date;
  onRecordReason: (record: AttendanceRecord) => void;
  onArrangeCover?: (record: AttendanceRecord) => void;
}

interface DayAttendanceSummary {
  dayName: string;
  dateLabel: string;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
}

export function AttendanceSidebar({
  records,
  shifts = [],
  weekStart,
  onRecordReason,
  onArrangeCover,
}: AttendanceSidebarProps): React.JSX.Element {
  const followUpItems = records.filter(
    (r) => r.status === "Late" || r.status === "Absent" || r.status === "Left early",
  );

  const resolvedWeekStart = useMemo(
    () => weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 }),
    [weekStart],
  );

  const past7DaysData: DayAttendanceSummary[] = useMemo(() => {
    const nowMs = Date.now();
    const GRACE_MS = 10 * 60 * 1000;

    return Array.from({ length: 7 }, (_, idx) => {
      const day = addDays(resolvedWeekStart, idx);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayName = format(day, "EEE");
      const dateLabel = format(day, "dd MMM");
      let onTimeCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      shifts.forEach((shift) => {
        if (shift.status === "Cancelled" || shift.careType?.includes("Off")) return;
        if (getShiftDateStr(shift) !== dateStr) return;

        const staffIds = getShiftStaffIds(shift);
        const shiftStartMs = new Date(shift.startTime).getTime();
        const shiftEndMs = new Date(shift.endTime).getTime();

        staffIds.forEach((uid) => {
          const log = shift.staffLogs?.find((l) => l.userId === uid);
          if (log?.actualStartTime) {
            const actualStartMs = new Date(log.actualStartTime).getTime();
            if (actualStartMs > shiftStartMs + GRACE_MS) {
              lateCount += 1;
            } else {
              onTimeCount += 1;
            }
          } else if (shiftEndMs < nowMs) {
            absentCount += 1;
          }
        });
      });

      return { dayName, dateLabel, onTimeCount, lateCount, absentCount };
    });
  }, [shifts, resolvedWeekStart]);

  const maxScale = Math.max(
    1,
    ...past7DaysData.map((d) => d.onTimeCount + d.lateCount + d.absentCount),
  );

  return (
    <div className="space-y-5 font-sans">
      {/* 1. Needs Follow-up Card */}
      <Card variant="surface" border="default" className="p-5 font-sans gap-3 border-none shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-border-secondary/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600" />
            <Text as="h2" size="md" weight="semibold" className="text-slate-900">
              Needs follow-up
            </Text>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-semibold px-2">
            {followUpItems.length}
          </Badge>
        </div>

        <div className="space-y-3 pt-1">
          {followUpItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              All shifts on track. No lateness or absence reported.
            </div>
          ) : (
            followUpItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-2 transition-all hover:border-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.staffName}</p>
                    <p className="text-xs text-slate-500">{item.property} &bull; {item.scheduledTime}</p>
                  </div>
                  <Badge
                    variant={item.status === "Absent" ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs font-semibold px-2",
                      item.status === "Late" && "bg-amber-100 text-amber-800",
                      item.status === "Left early" && "bg-orange-100 text-orange-800",
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>

                {item.notes ? (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No follow-up reason logged yet.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onRecordReason(item)}
                    className="h-7 text-xs px-2.5 rounded-lg bg-surface-card-grey hover:bg-slate-200/70 text-slate-700 font-medium cursor-pointer"
                  >
                    Record reason
                  </Button>
                  {item.status === "Absent" && onArrangeCover && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onArrangeCover(item)}
                      className="h-7 text-xs px-2.5 rounded-lg font-medium gap-1 cursor-pointer"
                    >
                      <UserPlus className="size-3" />
                      Arrange cover
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Phone className="size-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 2. Weekly Attendance Stacked Bar Chart */}
      <Card variant="surface" border="default" className="p-5 font-sans gap-3 border-none shadow-none">
        <div className="pb-3 border-b border-border-secondary/50">
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            Weekly breakdown
          </Text>
          <Text size="md" variant="muted">
            {format(resolvedWeekStart, "dd MMM")} &ndash; {format(addDays(resolvedWeekStart, 6), "dd MMM yyyy")} &bull; On time, late or missed
          </Text>
        </div>

        <div className="pt-2">
          <div className="flex items-end justify-between gap-2 h-44 px-2">
            {past7DaysData.map((d) => {
              const onTimeHeight = (d.onTimeCount / maxScale) * 100;
              const lateHeight = (d.lateCount / maxScale) * 100;
              const absentHeight = (d.absentCount / maxScale) * 100;

              return (
                <div key={d.dayName} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-5 bg-slate-100 rounded-t-sm flex flex-col justify-end overflow-hidden h-36">
                    {absentHeight > 0 && (
                      <div
                        style={{ height: `${absentHeight}%` }}
                        className="w-full bg-rose-500"
                        title={`Absent: ${d.absentCount}`}
                      />
                    )}
                    {lateHeight > 0 && (
                      <div
                        style={{ height: `${lateHeight}%` }}
                        className="w-full bg-amber-400"
                        title={`Late: ${d.lateCount}`}
                      />
                    )}
                    {onTimeHeight > 0 && (
                      <div
                        style={{ height: `${onTimeHeight}%` }}
                        className="w-full bg-primary"
                        title={`On time: ${d.onTimeCount}`}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-500" title={d.dateLabel}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 border-t border-border-secondary/40 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-slate-600 font-medium">On time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="text-slate-600 font-medium">Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">Absent</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

