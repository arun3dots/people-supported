"use client";

import * as React from "react";
import { format, isValid, parseISO, addDays, subDays } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { cn } from "../../lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface SingleDatePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  variant?: "date";
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  minYear?: number;
  maxYear?: number;
  formatString?: string;
  showPresets?: boolean;
  showDecadeJumps?: boolean;
  className?: string;
  triggerClassName?: string;
  errorMessage?: string;
  id?: string;
  showCalendarIcon?: boolean;
  showChevron?: boolean;
}

export function StandardDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  disabled = false,
  minDate,
  maxDate,
  minYear = 1930,
  maxYear = new Date().getFullYear(),
  formatString = "dd MMM yyyy",
  showPresets = false,
  showDecadeJumps = false,
  className,
  triggerClassName,
  errorMessage,
  id,
  showCalendarIcon = true,
  showChevron = false,
}: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match && match[1] && match[2] && match[3]) {
        const localDate = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
        return isValid(localDate) ? localDate : undefined;
      }
      const parsed = parseISO(trimmed);
      if (isValid(parsed)) return parsed;
      const fallback = new Date(trimmed);
      return isValid(fallback) ? fallback : undefined;
    }
    return undefined;
  }, [value]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(parsedDate ?? new Date());

  React.useEffect(() => {
    if (parsedDate) setCurrentMonth(parsedDate);
  }, [parsedDate]);

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const decades = React.useMemo(() => {
    const decList: number[] = [];
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    for (let d = startDecade; d <= endDecade; d += 10) decList.push(d);
    return decList;
  }, [minYear, maxYear]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(currentMonth);
    newDate.setMonth(Number(e.target.value));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(currentMonth);
    newDate.setFullYear(Number(e.target.value));
    setCurrentMonth(newDate);
  };

  const handleDecadeJump = (decade: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(decade);
    setCurrentMonth(newDate);
  };

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined);
    } else {
      onChange?.(
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0),
      );
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(undefined);
  };

  const presets = React.useMemo(() => {
    const today = new Date();
    return [
      { label: "Today", date: today },
      { label: "Tomorrow", date: addDays(today, 1) },
      { label: "Yesterday", date: subDays(today, 1) },
      { label: "In 1 Week", date: addDays(today, 7) },
    ];
  }, []);

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-[44px] w-full items-center justify-between gap-2 rounded-md border border-border-secondary bg-surface-neutral px-3 py-2 text-md text-text-body whitespace-nowrap outline-none focus:outline-none focus:border-border-primary focus:ring-1 focus:ring-surface-primary/20 font-sans transition-colors",
              disabled && "cursor-not-allowed opacity-50 bg-surface-card-grey",
              errorMessage && "border-border-error bg-surface-error",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              {showCalendarIcon && (
                <CalendarIcon className="size-4 shrink-0 text-surface-primary" />
              )}
              {parsedDate ? (
                <span className="font-normal text-text-body">{format(parsedDate, formatString)}</span>
              ) : (
                <span className="text-slate-400 font-normal">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
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
              {showChevron && (
                <ChevronDown className="size-4 text-icon-description" />
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={{ top: 16, bottom: 16, left: 16, right: 16 }}
          className="w-[316px] p-2.5 bg-surface-neutral rounded-2xl border border-border-secondary shadow-xl z-50"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => e.preventDefault()}
        >
          {showPresets && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border-secondary">
              {presets.map((p) => (
                <div
                  key={p.label}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(p.date);
                  }}
                  className="px-2 py-0.5 rounded-lg text-md font-semibold bg-surface-card-grey text-text-body hover:bg-surface-primary-light hover:text-surface-primary transition-colors cursor-pointer"
                >
                  {p.label}
                </div>
              ))}
            </div>
          )}

          {/* Quick Decade Jump Selector: exactly 2 rows of 5 pills */}
          {showDecadeJumps && (
            <div className="mb-2 pb-2 border-b border-border-secondary">
              <div className="text-md font-semibold text-text-description mb-1 px-0.5 uppercase tracking-wider">
                Quick Decade Jump:
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {decades.map((dec) => {
                  const isCurrentDecade = Math.floor(currentMonth.getFullYear() / 10) * 10 === dec;
                  return (
                    <button
                      key={dec}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDecadeJump(dec);
                      }}
                      className={cn(
                        "py-0.5 px-1 rounded-full text-md font-semibold transition-colors text-center cursor-pointer",
                        isCurrentDecade
                          ? "bg-surface-primary text-white shadow-xs"
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
          <div
            className="flex items-center justify-between gap-1.5 mb-2 px-0.5"
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          >
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              aria-label="Select month"
              className="flex-1 bg-surface-neutral border border-border-secondary rounded-full px-3 py-1 text-md font-semibold text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20 cursor-pointer appearance-auto h-8"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              aria-label="Select year"
              className="w-20 bg-surface-neutral border border-border-secondary rounded-full px-2.5 py-1 text-md font-bold text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20 cursor-pointer appearance-auto h-8"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <DayPicker
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            showOutsideDays={true}
            className="p-0 select-none"
            components={{
              DayButton: (props) => (
                <button
                  {...props}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onClick?.(e);
                  }}
                />
              ),
            }}
            classNames={{
              months: "flex flex-col",
              month: "space-y-1",
              month_caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse",
              weekdays: "flex justify-between mb-1",
              weekday: "w-9 text-center text-md font-semibold text-text-description",
              week: "flex justify-between w-full mt-0.5",
              day: "p-0 text-center text-md focus-within:relative focus-within:z-20",
              day_button: cn(
                "size-9 p-0 flex items-center justify-center text-md rounded-xl transition-colors font-medium text-text-body cursor-pointer",
                "hover:bg-surface-primary-light hover:text-surface-primary focus:outline-none"
              ),
              today: "[&_button]:border [&_button]:border-surface-primary [&_button]:bg-surface-primary-light/50 [&_button]:font-bold [&_button]:text-surface-primary",
              selected: "[&_button]:!bg-surface-primary [&_button]:!text-white [&_button]:!font-bold [&_button]:hover:!bg-surface-primary",
              disabled: "[&_button]:opacity-30 [&_button]:!cursor-not-allowed [&_button]:text-text-description [&_button]:hover:!bg-transparent",
              outside: "[&_button]:opacity-20",
            }}
          />
        </PopoverContent>
      </Popover>

      {errorMessage && <span className="text-md text-text-error mt-0.5">{errorMessage}</span>}
    </div>
  );
}
