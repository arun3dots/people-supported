"use client";

import React from "react";
import { format, isValid, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Text,
  Button,
  DatePicker,
} from "@repo/ui/components/ui";
import { Clock } from "lucide-react";
import type { TaskFormData } from "./CarePlanTaskDialog";

const CATEGORIES = [
  "Personal Care",
  "Clinical",
  "Mobility",
  "Nutrition",
  "Hygiene",
  "Medication",
  "MentalHealth",
  "Social",
  "Other",
];

const FREQUENCIES = ["Daily", "Weekly", "Twice Daily", "Alternate Days", "Custom"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night", "AllDay"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const PRIORITIES: Array<"Low" | "Medium" | "High" | "Critical"> = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const HOURS_24 = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23",
];
const MINUTES_24 = ["00", "15", "30", "45"];

interface CarePlanTaskTimingAndCategoryProps {
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  timeError?: string | null;
  dateError?: string | null;
  onClearErrors?: () => void;
}

const toIsoDate = (date?: Date): string =>
  date && isValid(date) ? format(date, "yyyy-MM-dd") : "";

export function CarePlanTaskTimingAndCategory({
  formData,
  setFormData,
  timeError,
  dateError,
  onClearErrors,
}: CarePlanTaskTimingAndCategoryProps): React.JSX.Element {
  const [currentHour = "", currentMinute = ""] = (formData.targetTime || "").split(":");
  const maxPickerYear = new Date().getFullYear() + 5;
  const parsedStartDate =
    formData.startsOn && isValid(parseISO(formData.startsOn))
      ? parseISO(formData.startsOn)
      : undefined;

  const toggleTimeSlot = (slot: string) => {
    onClearErrors?.();
    const exists = formData.timeOfDay.includes(slot);
    if (exists) {
      setFormData({
        ...formData,
        timeOfDay: formData.timeOfDay.filter((s) => s !== slot),
      });
      return;
    }
    if (slot === "AllDay") {
      setFormData({ ...formData, timeOfDay: ["AllDay"] });
      return;
    }
    setFormData({
      ...formData,
      timeOfDay: [...formData.timeOfDay.filter((s) => s !== "AllDay"), slot],
    });
  };

  const toggleWeekday = (dayIdx: number) => {
    const days = formData.recurrenceDays ?? [];
    const next = days.includes(dayIdx)
      ? days.filter((d) => d !== dayIdx)
      : [...days, dayIdx].sort((a, b) => a - b);
    setFormData({ ...formData, recurrenceDays: next });
  };

  return (
    <>
      {/* Schedule Dates, Shift Slots & Optional 24-Hour Target Time */}
      <div className="p-3.5 bg-surface-card-grey border border-slate-200/60 rounded-xl space-y-3 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="space-y-1.5">
            <Label htmlFor="care-task-start-date">Start Date</Label>
            <DatePicker
              id="care-task-start-date"
              value={formData.startsOn || ""}
              maxYear={maxPickerYear}
              placeholder="Select start date"
              triggerClassName="bg-white"
              onChange={(date) => {
                onClearErrors?.();
                setFormData({ ...formData, startsOn: toIsoDate(date) });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="care-task-end-date">End Date</Label>
            <DatePicker
              id="care-task-end-date"
              value={formData.endsOn || ""}
              minDate={parsedStartDate}
              maxYear={maxPickerYear}
              placeholder="Select end date"
              triggerClassName="bg-white"
              errorMessage={dateError ?? undefined}
              onChange={(date) => {
                onClearErrors?.();
                setFormData({ ...formData, endsOn: toIsoDate(date) });
              }}
            />
          </div>
        </div>
        {dateError && (
          <p className="text-md text-red-500 font-medium" role="alert">
            {dateError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
          <Label>
            <Clock className="size-3.5 text-emerald-800" />
            Shift Timing &amp; Slots
          </Label>
          <div className="flex items-center gap-1.5 [&_[data-slot=input-error]]:hidden">
            <Text size="md" weight="medium" className="text-slate-700">
              Target Time (24h):
            </Text>
            <div className="flex items-center gap-1">
              <Select
                value={currentHour}
                onValueChange={(val) => {
                  onClearErrors?.();
                  const m = currentMinute || "00";
                  setFormData({ ...formData, targetTime: `${val}:${m}` });
                }}
              >
                <SelectTrigger
                  aria-label="Target hour"
                  className="h-8 w-20 text-md bg-white border-slate-200"
                >
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {HOURS_24.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-slate-400 font-bold">:</span>
              <Select
                value={currentMinute}
                onValueChange={(val) => {
                  onClearErrors?.();
                  const h = currentHour || "08";
                  setFormData({ ...formData, targetTime: `${h}:${val}` });
                }}
              >
                <SelectTrigger
                  aria-label="Target minute"
                  className="h-8 w-20 text-md bg-white border-slate-200"
                >
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES_24.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.targetTime ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, targetTime: "" })}
                  className="h-8 px-1.5 text-md text-slate-400 hover:text-slate-700 rounded-lg"
                  title="Clear target time"
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((slot) => {
            const isSelected = formData.timeOfDay.includes(slot);
            return (
              <Button
                key={slot}
                type="button"
                size="sm"
                aria-pressed={isSelected}
                variant={isSelected ? "primary" : "outline"}
                onClick={() => toggleTimeSlot(slot)}
                className="h-8 px-3 text-md font-semibold rounded-xl"
              >
                {slot}
              </Button>
            );
          })}
        </div>

        {timeError && (
          <p className="text-md text-red-500 font-medium" role="alert">
            {timeError}
          </p>
        )}
      </div>

      {/* Category, Frequency & Priority Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(val) => setFormData({ ...formData, category: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Frequency</Label>
          <Select
            value={formData.frequency}
            onValueChange={(val) => setFormData({ ...formData, frequency: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Priority Level</Label>
          <Select
            value={formData.priority}
            onValueChange={(val: "Low" | "Medium" | "High" | "Critical") =>
              setFormData({ ...formData, priority: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.frequency === "Weekly" && (
        <div className="space-y-1.5">
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, idx) => {
              const active = (formData.recurrenceDays ?? []).includes(idx);
              return (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  aria-pressed={active}
                  variant={active ? "primary" : "outline"}
                  onClick={() => toggleWeekday(idx)}
                  className="h-8 px-3 text-md font-semibold rounded-xl"
                >
                  {day}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
