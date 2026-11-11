"use client";

import { Controller } from "react-hook-form";
import { Card, Text, Button, Label, StandardDatePicker } from "@repo/ui/components/ui";
import {
  createUkDateTime,
  formatUkTime,
  getLocalCalendarDateString,
  getUkDateString,
  addUkCalendarDays,
} from "../../../../../../lib/utils/uk-date-time";

function parseLocalDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

const REPEAT_DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

interface ShiftRecurringEngineProps {
  control: any;
  watch: any;
  setValue: any;
  getValues?: any;
}

export function ShiftRecurringEngine({
  control,
  watch,
  setValue,
  getValues,
}: ShiftRecurringEngineProps) {
  const repeatDays: number[] = watch("repeatDays") || [];
  const now = new Date();
  const today = getUkDateString(now);
  const selectedStartTime = watch("startTime");
  const selectedStart = selectedStartTime ? new Date(selectedStartTime) : null;
  const earliestStartDate = today;

  return (
    <Card variant="surface" className="p-4 sm:p-5 shadow-none space-y-4">
      <div className="flex items-center justify-between">
        <Text variant="base-medium" className="text-slate-900 font-bold">
          Bulk Schedule Engine (Recurring)
        </Text>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setValue(
              "repeatDays",
              repeatDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]
            )
          }
          className="h-7 text-md font-semibold text-primary hover:bg-primary/10"
        >
          {repeatDays.length === 7 ? "Clear All" : "Select All"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-4 flex flex-col gap-1.5">
          <Label required>From</Label>
          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <StandardDatePicker
                  showDecadeJumps={false}
                  minDate={earliestStartDate ? parseLocalDate(earliestStartDate) : undefined}
                  value={
                    field.value && !Number.isNaN(new Date(field.value).getTime())
                      ? getUkDateString(field.value)
                      : undefined
                  }
                  onChange={(date) => {
                    if (!date) {
                      field.onChange(new Date());
                      return;
                    }
                    const dateStr = getLocalCalendarDateString(date);
                    const selectedTime =
                      field.value instanceof Date && !Number.isNaN(field.value.getTime())
                        ? formatUkTime(field.value)
                        : "09:00";
                    const newStart = createUkDateTime(dateStr, selectedTime);
                    field.onChange(newStart);
                    const currentEnd = getValues ? getValues("endTime") : null;
                    const endTimeOfDay =
                      currentEnd instanceof Date && !Number.isNaN(currentEnd.getTime())
                        ? formatUkTime(currentEnd)
                        : selectedTime;
                    let newEnd = createUkDateTime(dateStr, endTimeOfDay);
                    if (newEnd.getTime() <= newStart.getTime()) {
                      newEnd = addUkCalendarDays(newEnd, 1);
                    }
                    setValue("endTime", newEnd);
                    setValue("repeatDays", [newStart.getDay()]);

                    const currentRepeatUntil = getValues ? getValues("repeatUntil") : null;
                    if (currentRepeatUntil) {
                      const untilDate = new Date(currentRepeatUntil);
                      if (!Number.isNaN(untilDate.getTime())) {
                        const untilStr = getUkDateString(untilDate);
                        if (untilStr < dateStr) {
                          setValue("repeatUntil", null);
                        }
                      }
                    }
                  }}
                  placeholder="Select start date"
                />
                {fieldState.error && (
                  <Text size="sm" className="text-rose-600 font-medium">
                    {fieldState.error.message}
                  </Text>
                )}
              </>
            )}
          />
        </div>

        <div className="sm:col-span-4 flex flex-col gap-1.5">
          <Label>To</Label>
          <Controller
            name="repeatUntil"
            control={control}
            render={({ field, fieldState }) => {
              const currentStartDateStr =
                selectedStart && !Number.isNaN(selectedStart.getTime())
                  ? getUkDateString(selectedStart)
                  : today;

              return (
                <>
                  <StandardDatePicker
                    showDecadeJumps={false}
                    minDate={
                      currentStartDateStr
                        ? parseLocalDate(currentStartDateStr)
                        : undefined
                    }
                    value={field.value}
                    onChange={(d) => {
                      if (!d) {
                        field.onChange(null);
                        return;
                      }
                      const dateStr = getLocalCalendarDateString(d);
                      if (currentStartDateStr && dateStr < currentStartDateStr) {
                        return;
                      }
                      field.onChange(d);
                    }}
                    placeholder="Select repeat until date"
                  />
                  {fieldState.error && (
                    <Text size="sm" className="text-rose-600 font-medium">
                      {fieldState.error.message}
                    </Text>
                  )}
                </>
              );
            }}
          />
        </div>

        <div className="sm:col-span-4 flex flex-col gap-1.5">
          <Label>Target Days</Label>
          <div className="flex gap-1">
            {REPEAT_DAYS.map((d) => {
              const isActive = repeatDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setValue(
                      "repeatDays",
                      isActive
                        ? repeatDays.filter((v: number) => v !== d.value)
                        : [...repeatDays, d.value]
                    );
                  }}
                  className={`flex-1 h-10 rounded-lg text-md font-bold transition-all border cursor-pointer ${isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
