"use client";

import React from "react";
import { Clock, Play } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import { ShiftFilter } from "./types";
import { Shift } from "../../../../../lib/types/shifts";
import { formatUkTime } from "../../../../../lib/utils/uk-date-time";

interface TaskAllocationHeaderProps {
  taskCount: number;
  selectedShift: ShiftFilter;
  onShiftChange: (shift: ShiftFilter) => void;
  canAllocate?: boolean;
  onAutoAllocate: () => void;
  onHandoverToNight: () => void;
  activeShift?: Shift | null;
  onClockIn?: () => void;
  onClockOut?: () => void;
  isClockActionPending?: boolean;
}

export function TaskAllocationHeader({
  taskCount,
  selectedShift,
  onShiftChange,
  canAllocate = false,
  onAutoAllocate,
  onHandoverToNight,
  activeShift,
  onClockIn,
  onClockOut,
  isClockActionPending = false,
}: TaskAllocationHeaderProps) {
  const isStarted = Boolean(activeShift?.isStarted);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <Text as="h1" size="2xl" weight="bold" className="text-text-heading">
          {canAllocate ? "Task allocation" : "Today's shift"}
        </Text>
        <Text size="md" variant="muted" className="mt-1">
          {taskCount} tasks on the {selectedShift} shift ·{" "}
          {canAllocate
            ? "Staff come from the published rota; only staff on duty can be allocated."
            : "Tasks allocated from your published rota and unit assignment."}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Shift Segmented Toggle */}
        <div className="flex items-center gap-1 bg-surface-primary-light/60 p-1 rounded-xl border border-border-secondary/40">
          <Button
            type="button"
            variant={selectedShift === "Day" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onShiftChange("Day")}
            className="h-8 px-3 rounded-lg text-md font-semibold cursor-pointer"
          >
            Day 07:45–20:15
          </Button>
          <Button
            type="button"
            variant={selectedShift === "Night" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onShiftChange("Night")}
            className="h-8 px-3 rounded-lg text-md font-semibold cursor-pointer"
          >
            Night 19:45–08:15
          </Button>
        </div>

        {/* Carer Shift Clock Actions */}
        {!canAllocate && activeShift && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-md text-text-description mr-1">
              <Clock className="size-3.5" />
              <Text as="span" size="md" weight="medium">
                {isStarted && activeShift.startTime
                  ? `Clocked in ${formatUkTime(activeShift.startTime)}`
                  : "Not clocked in"}
              </Text>
            </div>

            {!isStarted && onClockIn && (
              <Button
                variant="primary"
                size="sm"
                disabled={isClockActionPending}
                onClick={onClockIn}
                className="gap-1.5 h-8 text-md font-semibold px-3.5"
              >
                <Play className="size-3.5" />
                Clock in
              </Button>
            )}

            {isStarted && onClockOut && (
              <Button
                variant="outline"
                size="sm"
                disabled={isClockActionPending}
                onClick={onClockOut}
                className="gap-1.5 h-8 text-md font-semibold px-3.5"
              >
                Clock out
              </Button>
            )}
          </div>
        )}

        {/* Higher Role Actions */}
        {canAllocate && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoAllocate}
              title="Key worker first, then the least-loaded eligible colleague on this shift"
              className="text-md font-semibold"
            >
              Auto-allocate unassigned
            </Button>

            {selectedShift === "Day" && (
              <Button
                variant="primary"
                size="sm"
                onClick={onHandoverToNight}
                className="text-md font-semibold"
              >
                Hand over incomplete tasks to Night
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
