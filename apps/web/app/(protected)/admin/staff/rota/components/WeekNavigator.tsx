"use client";

import React from "react";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, DatePicker } from "@repo/ui/components/ui";

interface WeekNavigatorProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek?: () => void;
  onSelectDate?: (date: Date) => void;
  showWeekRange?: boolean;
}

export function WeekNavigator({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onSelectDate,
  showWeekRange = false,
}: WeekNavigatorProps): React.JSX.Element {
  const weekRangeLabel = `${format(currentDate, "dd MMM")} – ${format(
    addDays(currentDate, 6),
    "dd MMM yyyy",
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
      {showWeekRange && (
        <span className="text-sm font-medium text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl">
          {weekRangeLabel}
        </span>
      )}

      <div className="flex items-center gap-0.5 bg-surface-card-grey p-1 rounded-xl border border-slate-200/80">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPreviousWeek}
          title="Previous Week"
          className="size-8 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {onCurrentWeek && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCurrentWeek}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-white cursor-pointer"
          >
            This Week
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNextWeek}
          title="Next Week"
          className="size-8 p-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {onSelectDate && (
        <div className="w-40 sm:w-44">
          <DatePicker
            value={currentDate}
            onChange={(d) => d && onSelectDate(d)}
            maxYear={new Date().getFullYear() + 5}
            formatString="dd MMM yyyy"
            placeholder="Pick date/week..."
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

