"use client";

import React, { useState } from "react";
import { Badge, Button, Text } from "@repo/ui/components/ui";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export interface DailyTaskOccurrence {
  id: string;
  title: string;
  status: string;
  timeSlot?: string | null;
  targetTime?: string | null;
  category?: string | null;
  priority?: string | null;
  skipReason?: string;
  instructions?: string | null;
}

interface CarePlanDailyExecutionsTabProps {
  dailyTasks: DailyTaskOccurrence[];
  onComplete: (taskId: string) => void;
  onSkip: (taskId: string, title: string) => void;
}

const SHIFT_BLOCKS = [
  { id: "Morning", label: "Morning Routine", icon: Sunrise, time: "06:00 - 12:00" },
  { id: "Afternoon", label: "Afternoon Routine", icon: Sun, time: "12:00 - 17:00" },
  { id: "Evening", label: "Evening Routine", icon: Sunset, time: "17:00 - 22:00" },
  { id: "Night", label: "Night Routine", icon: Moon, time: "22:00 - 06:00" },
] as const;

export function CarePlanDailyExecutionsTab({
  dailyTasks = [],
  onComplete,
  onSkip,
}: CarePlanDailyExecutionsTabProps): React.JSX.Element {
  const [selectedShift, setSelectedShift] = useState<string>("ALL");

  // Helper to categorize tasks into shifts
  const getTaskShift = (t: DailyTaskOccurrence): string => {
    if (t.timeSlot) {
      const ts = t.timeSlot.toLowerCase();
      if (ts.includes("morning")) return "Morning";
      if (ts.includes("afternoon")) return "Afternoon";
      if (ts.includes("evening")) return "Evening";
      if (ts.includes("night")) return "Night";
    }
    // Infer from targetTime if formatted as HH:mm
    if (t.targetTime) {
      const parts = t.targetTime.split(":");
      const hour = parts[0] ? parseInt(parts[0], 10) : NaN;
      if (!isNaN(hour)) {
        if (hour >= 6 && hour < 12) return "Morning";
        if (hour >= 12 && hour < 17) return "Afternoon";
        if (hour >= 17 && hour < 22) return "Evening";
        return "Night";
      }
    }
    return "Morning"; // Default shift block
  };

  const tasksWithShift = dailyTasks.map((t) => ({
    ...t,
    inferredShift: getTaskShift(t),
  }));

  const total = dailyTasks.length;
  const completedCount = dailyTasks.filter(
    (t) => t.status === "Completed" || t.status === "completed"
  ).length;

  return (
    <div className="bg-surface-card-grey rounded-2xl p-5 lg:p-6 space-y-6 font-['Outfit',sans-serif] shadow-none border-none">
      {/* Header & Shift Filter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-emerald-800" />
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Shift Routine Executions
            </Text>
          </div>
          <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
            {completedCount} of {total} daily care routines completed today.
          </Text>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          <Button
            type="button"
            size="sm"
            variant={selectedShift === "ALL" ? "primary" : "ghost"}
            onClick={() => setSelectedShift("ALL")}
            className="h-7 px-2.5 rounded-lg text-md cursor-pointer"
          >
            All Shifts ({total})
          </Button>
          {SHIFT_BLOCKS.map((shift) => {
            const count = tasksWithShift.filter((t) => t.inferredShift === shift.id).length;
            const isSelected = selectedShift === shift.id;
            return (
              <Button
                key={shift.id}
                type="button"
                size="sm"
                variant={isSelected ? "primary" : "ghost"}
                onClick={() => setSelectedShift(shift.id)}
                className="h-7 px-2.5 rounded-lg text-md cursor-pointer flex items-center gap-1 shrink-0"
              >
                <shift.icon className="size-3" />
                <span>{shift.id}</span>
                <span className="opacity-75">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {dailyTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
          <Sparkles className="size-8 text-slate-300 mx-auto mb-2" />
          <Text size="md" weight="semibold" className="text-slate-700">
            No Routines Scheduled for Today
          </Text>
          <Text size="md" variant="muted" className="mt-1">
            Active care plans automatically generate daily care tasks according to defined frequencies.
          </Text>
        </div>
      ) : (
        <div className="space-y-6">
          {SHIFT_BLOCKS.map((shift) => {
            if (selectedShift !== "ALL" && selectedShift !== shift.id) return null;

            const shiftTasks = tasksWithShift.filter((t) => t.inferredShift === shift.id);
            if (shiftTasks.length === 0 && selectedShift !== shift.id) return null;

            const shiftDone = shiftTasks.filter((t) => t.status === "Completed").length;

            return (
              <div key={shift.id} className="space-y-3">
                {/* Shift Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <shift.icon className="size-4 text-emerald-800" />
                    <Text size="md" weight="bold" className="text-slate-900">
                      {shift.label}
                    </Text>
                    <span className="text-md text-slate-400 font-normal">
                      {shift.time}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    state={shiftDone === shiftTasks.length && shiftTasks.length > 0 ? "success" : "inactive"}
                    className="text-md px-2 py-0.5 shadow-none"
                  >
                    {shiftDone}/{shiftTasks.length} Done
                  </Badge>
                </div>

                {/* Shift Task Cards */}
                {shiftTasks.length === 0 ? (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    <Text size="md" className="text-slate-400">
                      No tasks assigned for this shift window.
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shiftTasks.map((t) => {
                      const isCompleted = t.status === "Completed" || t.status === "completed";
                      const isSkipped = t.status === "Skipped" || t.status === "skipped";

                      return (
                        <div
                          key={t.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCompleted
                            ? "bg-slate-50/70 border-slate-200/60 opacity-80"
                            : isSkipped
                              ? "bg-rose-50/40 border-rose-200/70"
                              : "bg-white border-slate-200/80 hover:border-emerald-800/30 shadow-none"
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text size="md" weight="semibold" className="text-slate-900">
                                {t.title}
                              </Text>

                              {t.targetTime && (
                                <span className="inline-flex items-center gap-1 text-md text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Clock className="size-2.5 text-slate-400" />
                                  {t.targetTime}
                                </span>
                              )}

                              {t.category && (
                                <span className="text-md text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                  {t.category}
                                </span>
                              )}

                              <Badge
                                variant="secondary"
                                state={isCompleted ? "success" : isSkipped ? "danger" : "inactive"}
                                className="text-md px-2 py-0.5 shadow-none"
                              >
                                {t.status}
                              </Badge>
                            </div>

                            {t.instructions && (
                              <Text size="md" className="text-md text-slate-500 line-clamp-1">
                                {t.instructions}
                              </Text>
                            )}

                            {t.skipReason && (
                              <Text size="md" variant="destructive" className="font-medium mt-0.5">
                                Reason skipped: {t.skipReason}
                              </Text>
                            )}
                          </div>

                          {/* Quick Actions */}
                          {!isCompleted && !isSkipped && (
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSkip(t.id, t.title)}
                                className="h-7 text-md font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-xl gap-1 cursor-pointer"
                              >
                                <XCircle className="size-3" /> Skip
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onComplete(t.id)}
                                className="h-7 text-md font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="size-3" /> Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
