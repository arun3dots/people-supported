"use client";

import React, { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Calendar, Users } from "lucide-react";
import { Card, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { LeaveRequestItem } from "../../../../../../lib/queries/shifts";

interface WhosOffThisWeekCardProps {
  requests: LeaveRequestItem[];
  selectedDate?: Date;
}

export function WhosOffThisWeekCard({
  requests,
  selectedDate = new Date(),
}: WhosOffThisWeekCardProps): React.JSX.Element {
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate],
  );

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: format(date, "EEE"),
        dayNum: format(date, "dd MMM"),
      };
    });
  }, [weekStart]);

  const approvedLeaves = useMemo(() => {
    return requests.filter((r) => r.status === "Approved");
  }, [requests]);

  const leavesByDay = useMemo(() => {
    return days.map((d) => {
      const dayLeaves = approvedLeaves.filter((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        const check = d.date;
        return check >= start && check <= end;
      });
      return {
        ...d,
        leaves: dayLeaves,
      };
    });
  }, [days, approvedLeaves]);

  return (
    <Card variant="surface" border="default" className="p-5 font-sans gap-3 border-none shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-border-secondary/50">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <Text as="h2" size="md" weight="semibold" className="text-slate-900">
            Who&apos;s off this week
          </Text>
        </div>
        <Text size="md" variant="muted">
          {format(weekStart, "dd MMM")} &ndash; {format(weekEnd, "dd MMM yyyy")} &bull; approved leave only
        </Text>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {leavesByDay.map((item) => {
          const isToday = isSameDay(item.date, new Date());
          const hasLeaves = item.leaves.length > 0;

          return (
            <div
              key={item.dayNum}
              className={cn(
                "rounded-xl p-2.5 flex flex-col min-h-24 justify-between transition-colors",
                isToday ? "bg-white border border-primary/30" : "bg-white/70 border border-slate-100",
              )}
            >
              <div>
                <Text size="md" weight="medium" className="text-slate-700">
                  {item.dayName}
                </Text>
                <Text size="md" variant="muted">
                  {item.dayNum}
                </Text>
              </div>

              <div className="mt-2 space-y-1">
                {hasLeaves ? (
                  item.leaves.map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        "px-2 py-1 rounded-lg text-md leading-tight",
                        l.type === "Sick Leave"
                          ? "bg-rose-50 text-rose-800 border border-rose-200/50"
                          : "bg-amber-50 text-amber-800 border border-amber-200/50",
                      )}
                    >
                      <p className="font-medium truncate">{l.staff?.fullName || "Staff"}</p>
                      <p className="text-slate-600 truncate">{l.type}</p>
                    </div>
                  ))
                ) : (
                  <Text size="md" variant="muted" className="italic">
                    Full team
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

