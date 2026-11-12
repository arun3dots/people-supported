"use client";

import React from "react";
import { AlertCircle, Phone, RotateCcw, UserPlus } from "lucide-react";
import { Badge, Button, Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { AttendanceRecord } from "./AttendanceTable";

interface AttendanceSidebarProps {
  records: AttendanceRecord[];
  onRecordReason: (record: AttendanceRecord) => void;
  onArrangeCover?: (record: AttendanceRecord) => void;
}

interface DayAttendanceSummary {
  dayName: string;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
}

export function AttendanceSidebar({
  records,
  onRecordReason,
  onArrangeCover,
}: AttendanceSidebarProps): React.JSX.Element {
  const followUpItems = records.filter(
    (r) => r.status === "Late" || r.status === "Absent" || r.status === "Left early",
  );

  const past7DaysData: DayAttendanceSummary[] = [
    { dayName: "Wed", onTimeCount: 8, lateCount: 1, absentCount: 1 },
    { dayName: "Thu", onTimeCount: 9, lateCount: 2, absentCount: 0 },
    { dayName: "Fri", onTimeCount: 10, lateCount: 1, absentCount: 1 },
    { dayName: "Sat", onTimeCount: 8, lateCount: 0, absentCount: 0 },
    { dayName: "Sun", onTimeCount: 9, lateCount: 1, absentCount: 1 },
    { dayName: "Mon", onTimeCount: 10, lateCount: 2, absentCount: 0 },
    { dayName: "Tue", onTimeCount: 7, lateCount: 2, absentCount: 1 },
  ];

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

      {/* 2. Last 7 Days Stacked Bar Chart */}
      <Card variant="surface" border="default" className="p-5 font-sans gap-3 border-none shadow-none">
        <div className="pb-3 border-b border-border-secondary/50">
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            Last 7 days
          </Text>
          <Text size="md" variant="muted">
            Shifts started on time, late or missed
          </Text>
        </div>

        <div className="pt-2">
          <div className="flex items-end justify-between gap-2 h-44 px-2">
            {past7DaysData.map((d) => {
              const total = d.onTimeCount + d.lateCount + d.absentCount;
              const maxScale = 12;
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
                  <span className="text-xs font-medium text-slate-500">{d.dayName}</span>
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

