"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { cn } from "../../lib/utils";

export interface DateRangePickerProps {
  value?: DateRange | null;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showPresets?: boolean;
  className?: string;
  triggerClassName?: string;
  errorMessage?: string;
  id?: string;
}

function parseLocalDate(val?: Date | string | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match && match[1] && match[2] && match[3]) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const localDate = new Date(year, month, day);
      return isValid(localDate) ? localDate : undefined;
    }
    const fallback = new Date(trimmed);
    return isValid(fallback) ? fallback : undefined;
  }
  return undefined;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range...",
  disabled = false,
  minDate,
  maxDate,
  showPresets = true,
  className,
  triggerClassName,
  errorMessage,
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedRange = React.useMemo<DateRange | undefined>(() => {
    if (!value) return undefined;
    const valueObj = value as { from?: Date | string | null; to?: Date | string | null };
    const from = parseLocalDate(valueObj.from);
    const to = parseLocalDate(valueObj.to);
    if (!from && !to) return undefined;
    return { from, to };
  }, [value]);

  const [range, setRange] = React.useState<DateRange | undefined>(parsedRange);

  React.useEffect(() => {
    setRange(parsedRange);
  }, [parsedRange]);

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onChange?.(newRange);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRange(undefined);
    onChange?.(undefined);
  };

  const applyPreset = (presetRange: DateRange) => {
    setRange(presetRange);
    onChange?.(presetRange);
    setOpen(false);
  };

  const presets = React.useMemo(() => {
    const today = new Date();
    return [
      { label: "Today", range: { from: today, to: today } },
      { label: "Yesterday", range: { from: subDays(today, 1), to: subDays(today, 1) } },
      { label: "Last 7 Days", range: { from: subDays(today, 6), to: today } },
      { label: "Last 30 Days", range: { from: subDays(today, 29), to: today } },
      { label: "This Month", range: { from: startOfMonth(today), to: endOfMonth(today) } },
      { label: "Last Month", range: { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) } },
      { label: "This Year", range: { from: startOfYear(today), to: endOfYear(today) } },
    ];
  }, []);

  const formatRangeDisplay = () => {
    if (!range?.from) return null;
    if (range.from && range.to && isValid(range.from) && isValid(range.to)) {
      return `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`;
    }
    if (range.from && isValid(range.from)) {
      return `${format(range.from, "dd MMM yyyy")} – ...`;
    }
    return null;
  };

  const formatted = formatRangeDisplay();

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-[44px] w-full items-center justify-between rounded-xl border border-border-secondary bg-surface-neutral px-3 py-2 text-md text-text-body transition-colors",
              "hover:border-surface-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary/20",
              disabled && "cursor-not-allowed opacity-50 bg-surface-card-grey",
              errorMessage && "border-border-error bg-surface-error",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <CalendarIcon className="size-4 shrink-0 text-surface-primary" />
              {formatted ? (
                <span className="font-medium text-text-heading">{formatted}</span>
              ) : (
                <span className="text-text-description">{placeholder}</span>
              )}
            </div>

            {formatted && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="rounded-full p-1 hover:bg-surface-card-grey text-text-description hover:text-text-body transition-colors"
              >
                <X className="size-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto p-0 bg-surface-neutral rounded-2xl border border-border-secondary shadow-xl z-50 overflow-hidden flex flex-col md:flex-row"
        >
          {/* Quick Presets Sidebar */}
          {showPresets && (
            <div className="w-full md:w-36 border-b md:border-b-0 md:border-r border-border-secondary p-2 bg-surface-card-grey flex flex-row md:flex-col gap-1 overflow-x-auto">
              <div className="hidden md:block text-md font-semibold text-text-description mb-1 px-2 uppercase tracking-wider">
                Presets
              </div>
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.range)}
                  className="px-2.5 py-1.5 rounded-lg text-md font-medium text-left text-text-body hover:bg-surface-primary-light hover:text-surface-primary transition-colors whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Range Calendar */}
          <div className="p-3">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              showOutsideDays={true}
              className="p-0 select-none"
              classNames={{
                months: "flex flex-col md:flex-row gap-4",
                month: "space-y-2",
                month_caption: "flex justify-center items-center h-8 font-semibold text-md text-text-heading",
                nav: "flex justify-between items-center absolute inset-x-3 top-3 pointer-events-none",
                button_previous: "pointer-events-auto p-1 rounded-lg hover:bg-surface-card-grey text-text-description cursor-pointer",
                button_next: "pointer-events-auto p-1 rounded-lg hover:bg-surface-card-grey text-text-description cursor-pointer",
                table: "w-full border-collapse",
                weekdays: "flex justify-between mb-1",
                weekday: "w-9 text-center text-md font-medium text-text-description",
                week: "flex justify-between w-full mt-1",
                day: "p-0 text-center text-md focus-within:relative focus-within:z-20",
                day_button: cn(
                  "size-9 p-0 flex items-center justify-center text-md transition-colors font-medium text-text-body",
                  "cursor-pointer select-none pointer-events-auto hover:bg-surface-primary-light hover:text-surface-primary focus:outline-none"
                ),
                range_start: "[&_button]:rounded-l-xl [&_button]:!bg-surface-primary [&_button]:!text-white [&_button]:!font-bold",
                range_end: "[&_button]:rounded-r-xl [&_button]:!bg-surface-primary [&_button]:!text-white [&_button]:!font-bold",
                range_middle: "[&_button]:rounded-none [&_button]:!bg-surface-primary-light [&_button]:!text-surface-primary [&_button]:!font-semibold",
                today: "[&_button]:border [&_button]:border-surface-primary [&_button]:font-bold [&_button]:text-surface-primary",
                disabled: "[&_button]:opacity-30 [&_button]:!cursor-not-allowed [&_button]:text-text-description [&_button]:hover:!bg-transparent [&_button]:pointer-events-auto",
                outside: "[&_button]:opacity-20",
              }}
            />

            {/* Footer */}
            {range?.from && (
              <div className="mt-3 pt-2 border-t border-border-secondary flex items-center justify-between text-md px-1">
                <span className="text-text-description font-medium">
                  Selected: <strong className="text-text-heading">{formatted}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(undefined)}
                  className="text-text-error hover:underline font-medium"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {errorMessage && (
        <span className="text-md text-text-error mt-0.5">{errorMessage}</span>
      )}
    </div>
  );
}
