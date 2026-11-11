"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  Button,
  Text,
  Tabs,
  TabsList,
  TabsTrigger,
  DatePicker,
} from "@repo/ui/components/ui";
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import {
  getUkCalendarDate,
  normalizeLocalCalendarDate,
} from "../../../../../../lib/utils/uk-date-time";

export type PeriodViewMode = "day" | "week" | "month";

interface RotaGridToolbarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  periodView: PeriodViewMode;
  onPeriodViewChange: (view: PeriodViewMode) => void;
  viewMode: "staff" | "facility";
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (start?: Date, end?: Date) => void;
}

export function RotaGridToolbar({
  currentDate,
  onDateChange,
  periodView,
  onPeriodViewChange,
  startDate,
  endDate,
  onRangeChange,
}: RotaGridToolbarProps) {
  const handlePrev = () => {
    if (periodView === "day") onDateChange(subDays(currentDate, 1));
    else if (periodView === "week") onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (periodView === "day") onDateChange(addDays(currentDate, 1));
    else if (periodView === "week") onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(getUkCalendarDate(new Date()));
  };

  const getDateLabel = () => {
    if (periodView === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    }
    if (periodView === "week") {
      return `Week of ${format(currentDate, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card-grey p-3.5 sm:p-4 rounded-2xl border-none mb-4 shadow-none font-sans">
      {/* Date Navigation */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            className="size-8 p-0 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-8 px-3 rounded-lg font-bold text-slate-800 hover:bg-slate-50"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="size-8 p-0 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <Text size="sm" weight="semibold" className="text-slate-900">
            {getDateLabel()}
          </Text>
        </div>
      </div>

      {/* Date Range Picker Inputs & Period View Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        {/* From & To Date Range Inputs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Text size="sm" weight="medium" className="text-sm text-slate-500">
              From:
            </Text>
            <div className="w-44 min-w-[172px]">
              <DatePicker
                value={startDate}
                onChange={(newStart) => {
                  if (newStart) {
                    const normalizedStart = normalizeLocalCalendarDate(newStart);
                    const effectiveEnd =
                      endDate && endDate < normalizedStart ? normalizedStart : endDate;
                    onRangeChange(normalizedStart, effectiveEnd);
                    onDateChange(normalizedStart);
                  } else {
                    onRangeChange(undefined, endDate);
                  }
                }}
                placeholder="From date"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Text size="sm" weight="medium" className="text-sm text-slate-500">
              To:
            </Text>
            <div className="w-44 min-w-[172px]">
              <DatePicker
                value={endDate}
                onChange={(newEnd) => {
                  if (newEnd) {
                    const normalizedEnd = normalizeLocalCalendarDate(newEnd);
                    const effectiveStart =
                      startDate && startDate > normalizedEnd ? normalizedEnd : startDate;
                    onRangeChange(effectiveStart, normalizedEnd);
                  } else {
                    onRangeChange(startDate, undefined);
                  }
                }}
                placeholder="To date"
              />
            </div>
          </div>
        </div>

        {/* Period View Tabs Switcher [ Day | Week | Month ] */}
        <Tabs
          value={periodView}
          onValueChange={(val) => onPeriodViewChange(val as PeriodViewMode)}
        >
          <TabsList className="bg-white p-1 rounded-xl border border-slate-200 h-auto inline-flex items-center gap-1 shadow-xs">
            {(["day", "week", "month"] as PeriodViewMode[]).map((mode) => (
              <TabsTrigger
                key={mode}
                value={mode}
                className="px-3 py-1.5 rounded-lg text-md font-semibold capitalize transition-all cursor-pointer border-0 data-[state=active]:border-0 data-[state=active]:border-b-0 text-slate-500 hover:text-slate-900 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs data-[state=active]:font-bold"
              >
                {mode}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
