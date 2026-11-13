"use client";

import * as React from "react";
import { format, isValid, parseISO, setHours, setMinutes } from "date-fns";
import { Clock, X, Check } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export interface DateTimePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  use12Hours?: boolean;
  className?: string;
  triggerClassName?: string;
  errorMessage?: string;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time...",
  disabled = false,
  minDate,
  maxDate,
  use12Hours = true,
  className,
  triggerClassName,
  errorMessage,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === "string") {
      const parsed = parseISO(value);
      if (isValid(parsed)) return parsed;
      const fallback = new Date(value);
      return isValid(fallback) ? fallback : undefined;
    }
    return undefined;
  }, [value]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(parsedDate);
  const [hour, setHour] = React.useState<number>(parsedDate ? parsedDate.getHours() : 12);
  const [minute, setMinute] = React.useState<number>(parsedDate ? parsedDate.getMinutes() : 0);

  React.useEffect(() => {
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setHour(parsedDate.getHours());
      setMinute(parsedDate.getMinutes());
    }
  }, [parsedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      return;
    }
    const updated = setMinutes(setHours(date, hour), minute);
    setSelectedDate(updated);
  };

  const handleHourChange = (newHour: number) => {
    setHour(newHour);
    if (selectedDate) {
      const updated = setHours(selectedDate, newHour);
      setSelectedDate(updated);
    }
  };

  const handleMinuteChange = (newMinute: number) => {
    setMinute(newMinute);
    if (selectedDate) {
      const updated = setMinutes(selectedDate, newMinute);
      setSelectedDate(updated);
    }
  };

  const handleApply = () => {
    if (selectedDate) {
      const finalDate = setMinutes(setHours(selectedDate, hour), minute);
      onChange?.(finalDate);
    } else {
      onChange?.(undefined);
    }
    setOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setHour(now.getHours());
    setMinute(now.getMinutes());
    onChange?.(now);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    onChange?.(undefined);
  };

  // 12-hour vs 24-hour helpers
  const isPM = hour >= 12;
  const displayHour12 = hour % 12 === 0 ? 12 : hour % 12;

  const toggleAMPM = () => {
    if (isPM) {
      handleHourChange(hour - 12);
    } else {
      handleHourChange(hour + 12);
    }
  };

  const formatDisplay = (d: Date): string => {
    return use12Hours
      ? format(d, "dd MMM yyyy, hh:mm a")
      : format(d, "dd MMM yyyy, HH:mm");
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
              "flex h-[44px] w-full items-center justify-between rounded-xl border border-border-secondary bg-surface-neutral px-3 py-2 text-md text-text-body transition-colors",
              "hover:border-surface-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-primary/20",
              disabled && "cursor-not-allowed opacity-50 bg-surface-card-grey",
              errorMessage && "border-border-error bg-surface-error",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <Clock className="size-4 shrink-0 text-text-primary" />
              {parsedDate ? (
                <span className="font-medium text-text-heading">
                  {formatDisplay(parsedDate)}
                </span>
              ) : (
                <span className="text-text-description">{placeholder}</span>
              )}
            </div>

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
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto p-3 bg-surface-neutral rounded-2xl border border-border-secondary shadow-xl z-50"
        >
          {/* Calendar component */}
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            showOutsideDays={true}
            className="p-0 select-none mb-3"
            classNames={{
              months: "flex flex-col",
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
                "size-9 p-0 flex items-center justify-center text-md rounded-xl transition-colors font-medium text-text-body",
                "cursor-pointer select-none pointer-events-auto hover:bg-surface-primary-light hover:text-surface-primary focus:outline-none"
              ),
              today: "[&_button]:border [&_button]:border-surface-primary [&_button]:font-bold [&_button]:text-surface-primary",
              disabled: "[&_button]:opacity-30 [&_button]:!cursor-not-allowed [&_button]:text-text-description [&_button]:hover:!bg-transparent [&_button]:pointer-events-auto",
              outside: "[&_button]:opacity-20",
            }}
            modifiers={{
              selected: selectedDate ? [selectedDate] : [],
            }}
            modifiersClassNames={{
              selected: "[&_button]:!bg-surface-primary [&_button]:!text-white [&_button]:!font-bold [&_button]:hover:!bg-surface-primary",
            }}
          />

          {/* Time Picker Controls */}
          <div className="pt-2.5 border-t border-border-secondary flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-md text-text-body font-medium">
              <Clock className="size-3.5 text-surface-primary" />
              <span>Time:</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Hours dropdown */}
              <select
                value={use12Hours ? displayHour12 : hour}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (use12Hours) {
                    const converted = isPM ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
                    handleHourChange(converted);
                  } else {
                    handleHourChange(val);
                  }
                }}
                className="bg-surface-card-grey border border-border-secondary rounded-lg px-1.5 py-1 text-md font-semibold text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20"
              >
                {Array.from({ length: use12Hours ? 12 : 24 }, (_, i) => (use12Hours ? i + 1 : i)).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <span className="font-bold text-text-description">:</span>

              {/* Minutes dropdown */}
              <select
                value={minute}
                onChange={(e) => handleMinuteChange(Number(e.target.value))}
                className="bg-surface-card-grey border border-border-secondary rounded-lg px-1.5 py-1 text-md font-semibold text-text-heading outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary/20"
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>

              {/* AM/PM toggle if 12h */}
              {use12Hours && (
                <button
                  type="button"
                  onClick={toggleAMPM}
                  className="px-2 py-1 rounded-lg text-md font-bold bg-surface-primary-light text-surface-primary border border-border-secondary hover:bg-surface-brand-1"
                >
                  {isPM ? "PM" : "AM"}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 pt-2 border-t border-border-secondary flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleNow}
              className="text-md font-medium text-surface-primary hover:underline"
            >
              Set to Now
            </button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleApply}
              className="h-7 text-md px-3 rounded-lg"
            >
              <Check className="size-3 mr-1" />
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {errorMessage && (
        <span className="text-md text-text-error mt-0.5">{errorMessage}</span>
      )}
    </div>
  );
}
