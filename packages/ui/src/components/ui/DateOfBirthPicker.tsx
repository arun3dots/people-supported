"use client";

import { useState, useMemo, useEffect, type MouseEvent } from "react";
import { format, differenceInYears, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Cake, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Badge } from "./Badge";
import { cn } from "../../lib/utils";

export interface DateOfBirthPickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined, age: number | null) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  maxDate?: Date;
  disabled?: boolean;
  showAgeBadge?: boolean;
  showDecadeJumps?: boolean;
  className?: string;
  triggerClassName?: string;
  errorMessage?: string;
  id?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DateOfBirthPicker({
  value,
  onChange,
  placeholder = "Select date of birth...",
  minYear = 1910,
  maxYear = new Date().getFullYear(),
  maxDate,
  disabled = false,
  showAgeBadge = true,
  showDecadeJumps = true,
  className,
  triggerClassName,
  errorMessage,
  id,
}: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false);

  // Date of birth must always be strictly before today (yesterday or earlier)
  const effectiveMaxDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    if (maxDate) {
      return maxDate < yesterday ? maxDate : yesterday;
    }
    return yesterday;
  }, [maxDate]);

  const parsedDate = useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) {
      if (!isValid(value)) return undefined;
      return value <= effectiveMaxDate ? value : undefined;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match && match[1] && match[2] && match[3]) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const localDate = new Date(year, month, day);
        if (isValid(localDate)) {
          return localDate <= effectiveMaxDate ? localDate : undefined;
        }
        return undefined;
      }
      const parsed = parseISO(trimmed);
      if (isValid(parsed)) {
        return parsed <= effectiveMaxDate ? parsed : undefined;
      }
      const fallback = new Date(trimmed);
      if (isValid(fallback)) {
        return fallback <= effectiveMaxDate ? fallback : undefined;
      }
      return undefined;
    }
    return undefined;
  }, [value, effectiveMaxDate]);

  const defaultYear = useMemo(() => {
    return parsedDate ? parsedDate.getFullYear() : Math.max(minYear, new Date().getFullYear() - 65);
  }, [parsedDate, minYear]);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    parsedDate || new Date(defaultYear, 0, 1)
  );

  useEffect(() => {
    if (parsedDate) {
      setCurrentMonth(parsedDate);
    }
  }, [parsedDate]);

  const age = useMemo(() => {
    if (!parsedDate) return null;
    return differenceInYears(new Date(), parsedDate);
  }, [parsedDate]);

  const years = useMemo(() => {
    const list: number[] = [];
    const ceilingYear = Math.min(maxYear, effectiveMaxDate.getFullYear());
    for (let y = ceilingYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear, effectiveMaxDate]);

  const decades = useMemo(() => {
    const decList: number[] = [];
    const startDecade = Math.floor(minYear / 10) * 10;
    const ceilingYear = Math.min(maxYear, effectiveMaxDate.getFullYear());
    const endDecade = Math.floor(ceilingYear / 10) * 10;
    for (let d = startDecade; d <= endDecade; d += 10) {
      decList.push(d);
    }
    return decList;
  }, [minYear, maxYear, effectiveMaxDate]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date && effectiveMaxDate && date > effectiveMaxDate) return;
    if (date) {
      const calculatedAge = differenceInYears(new Date(), date);
      setCurrentMonth(date);
      onChange?.(date, calculatedAge);
    } else {
      onChange?.(undefined, null);
    }
    setOpen(false);
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined, null);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(monthIndex);
    setCurrentMonth(newDate);
  };

  const handleDecadeJump = (decade: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(decade);
    setCurrentMonth(newDate);
  };

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-[44px] w-full items-center justify-between rounded-xl border border-border-secondary bg-surface-neutral px-3 py-2 text-sm text-text-body transition-colors",
              "hover:border-surface-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary/20",
              disabled && "cursor-not-allowed opacity-50 bg-surface-card-grey",
              errorMessage && "border-border-error bg-surface-error",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <CalendarIcon className="size-4 shrink-0 text-text-primary" />
              {parsedDate ? (
                <span className="font-medium text-text-heading">
                  {format(parsedDate, "dd MMM yyyy")}
                </span>
              ) : (
                <span className="text-text-description">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {parsedDate && showAgeBadge && age !== null && (
                <Badge variant="secondary" className="font-semibold text-sm py-0.5 px-2">
                  <Cake className="size-3 mr-1 text-surface-primary" />
                  {age} yrs
                </Badge>
              )}
              {parsedDate && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="rounded-full p-1 hover:bg-surface-card-grey text-text-description hover:text-text-body transition-colors"
                >
                  <X className="size-3.5" />
                </span>
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          avoidCollisions={true}
          collisionPadding={{ top: 24, bottom: 24, left: 16, right: 16 }}
          className="w-auto p-3 bg-surface-neutral rounded-2xl border border-border-secondary shadow-xl z-50 max-w-[340px]"
        >
          {/* Quick Decade Jump Selector */}
          {showDecadeJumps && (
            <div className="mb-2 pb-2 border-b border-border-secondary">
              <div className="text-[11px] font-semibold text-text-description mb-1.5 px-1 uppercase tracking-wider">
                Quick Decade Jump:
              </div>
              <div className="flex flex-wrap gap-1">
                {decades.map((dec) => {
                  const isCurrentDecade = Math.floor(currentMonth.getFullYear() / 10) * 10 === dec;
                  return (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => handleDecadeJump(dec)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-sm font-medium transition-colors",
                        isCurrentDecade
                          ? "bg-surface-primary text-white"
                          : "bg-surface-card-grey text-text-body hover:bg-surface-primary-light hover:text-surface-primary"
                      )}
                    >
                      {dec}s
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month and Year Quick Selectors */}
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <select
              value={currentMonth.getMonth()}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              aria-label="Select month"
              className="flex-1 bg-surface-card-grey border border-border-secondary rounded-lg px-2 py-1 text-sm font-medium text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={currentMonth.getFullYear()}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              aria-label="Select year"
              className="w-24 bg-surface-card-grey border border-border-secondary rounded-lg px-2 py-1 text-sm font-semibold text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* DayPicker Calendar */}
          <DayPicker
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={parsedDate}
            onSelect={handleSelectDate}
            disabled={{ after: effectiveMaxDate }}
            showOutsideDays={true}
            className="p-0 select-none"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              month_caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse",
              weekdays: "flex justify-between mb-1",
              weekday: "w-9 text-center text-sm font-medium text-text-description",
              week: "flex justify-between w-full mt-1",
              day: "p-0 text-center text-sm focus-within:relative focus-within:z-20",
              day_button: cn(
                "size-9 p-0 flex items-center justify-center text-sm rounded-xl transition-colors font-medium text-text-body",
                "cursor-pointer select-none pointer-events-auto hover:bg-surface-primary-light hover:text-surface-primary focus:outline-none"
              ),
              today: "[&_button]:border [&_button]:border-surface-primary [&_button]:font-bold [&_button]:text-surface-primary",
              disabled: "[&_button]:opacity-30 [&_button]:!cursor-not-allowed [&_button]:text-text-description [&_button]:hover:!bg-transparent [&_button]:pointer-events-auto",
              outside: "[&_button]:opacity-20",
            }}
            modifiers={{
              selected: parsedDate ? [parsedDate] : [],
            }}
            modifiersClassNames={{
              selected: "[&_button]:!bg-surface-primary [&_button]:!text-white [&_button]:!font-bold [&_button]:hover:!bg-surface-primary",
            }}
          />

          {/* Popover Footer */}
          {parsedDate && age !== null && (
            <div className="mt-3 pt-2 border-t border-border-secondary flex items-center justify-between px-1">
              <span className="text-sm text-text-description font-medium">
                Age: <strong className="text-text-heading">{age} years old</strong>
              </span>
              <button
                type="button"
                onClick={() => handleSelectDate(undefined)}
                className="text-sm text-text-error hover:underline font-medium"
              >
                Clear Date
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {errorMessage && (
        <span className="text-sm text-text-error mt-0.5">{errorMessage}</span>
      )}
    </div>
  );
}
