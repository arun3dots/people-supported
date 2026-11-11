"use client";

import React from "react";
import { Controller, useWatch } from "react-hook-form";
import {
  Card,
  Text,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import {
  addUkCalendarDays,
  createUkDateTime,
  formatUkTime,
  getUkDateString,
} from "../../../../../../lib/utils/uk-date-time";

function resolveValidDate(val: unknown): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return new Date(val);
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function safeFormatTime(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return isNaN(val.getTime()) ? "" : formatUkTime(val);
  if (typeof val === "string") {
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return formatUkTime(d);
  }
  return "";
}

function safeSetTime(currentVal: unknown, timeStr: string): Date {
  const baseDate = resolveValidDate(currentVal);
  return createUkDateTime(getUkDateString(baseDate), timeStr);
}

function buildEndDateTime(startVal: unknown, endTimeStr: string): Date {
  const startDate = resolveValidDate(startVal);
  const candidateEnd = createUkDateTime(getUkDateString(startDate), endTimeStr);
  if (candidateEnd.getTime() <= startDate.getTime()) {
    return addUkCalendarDays(candidateEnd, 1);
  }
  return candidateEnd;
}

interface ShiftTimingDetailsProps {
  control: any;
  setValue: any;
  shiftTypes: any[];
  isPastShift?: boolean;
  initialStatus?: string;
  isEditMode?: boolean;
}

export function ShiftTimingDetails({
  control,
  setValue,
  shiftTypes,
  isPastShift = false,
  initialStatus,
  isEditMode = false,
}: ShiftTimingDetailsProps) {
  const currentStartTime = useWatch({ control, name: "startTime" });
  const currentEndTime = useWatch({ control, name: "endTime" });

  return (
    <Card variant="surface" className="p-4 sm:p-5 shadow-none space-y-4">
      <Text variant="base-medium" className="text-slate-900 font-bold">
        Shift Schedule &amp; Timing
      </Text>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Shift Template Select */}
        <div className="sm:col-span-6 flex flex-col gap-1.5">
          <Label required>Shift Pattern Template</Label>
          <Controller
            name="typeId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  const selectedType = shiftTypes.find((t: any) => t.id === val);
                  if (selectedType) {
                    const nextStart = selectedType.startTime
                      ? safeSetTime(currentStartTime, selectedType.startTime)
                      : resolveValidDate(currentStartTime);
                    if (selectedType.startTime) {
                      setValue("startTime", nextStart);
                    }
                    if (selectedType.endTime) {
                      setValue("endTime", buildEndDateTime(nextStart, selectedType.endTime));
                    }
                  }
                }}
                value={field.value || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Shift</SelectItem>
                  {shiftTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.startTime} - {t.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Shift Status */}
        <div className="sm:col-span-6 flex flex-col gap-1.5">
          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              const isAlreadyPublished = isEditMode && initialStatus === "Published";
              const isCancelled = field.value === "Cancelled" || (isEditMode && initialStatus === "Cancelled");
              // Only an already saved Published shift cannot be reverted directly to Draft
              const isLocked = isPastShift || isCancelled || isAlreadyPublished;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label required>Shift Status</Label>
                    {isPastShift ? (
                      <span className="text-sm text-amber-700 font-medium">
                        Completed shift — status locked
                      </span>
                    ) : isCancelled ? (
                      <span className="text-sm text-rose-600 font-medium">
                        Cancelled shift — status locked
                      </span>
                    ) : isAlreadyPublished ? (
                      <span className="text-sm text-primary font-medium">
                        Published shift — cannot revert to Draft
                      </span>
                    ) : null}
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="w-full" disabled={isLocked}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isAlreadyPublished && <SelectItem value="Draft">Draft</SelectItem>}
                      <SelectItem value="Published">Published</SelectItem>
                      {isCancelled && (
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              );
            }}
          />
        </div>

        {/* Start Time */}
        <div className="sm:col-span-6 flex flex-col gap-1.5">
          <Label required>Start Time</Label>
          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="time"
                  value={safeFormatTime(field.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      field.onChange(null);
                      return;
                    }
                    const nextStart = safeSetTime(field.value, val);
                    field.onChange(nextStart);
                    const endTimeStr = safeFormatTime(currentEndTime);
                    if (endTimeStr) {
                      setValue("endTime", buildEndDateTime(nextStart, endTimeStr));
                    }
                  }}
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

        {/* End Time */}
        <div className="sm:col-span-6 flex flex-col gap-1.5">
          <Label required>End Time</Label>
          <Controller
            name="endTime"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="time"
                  value={safeFormatTime(field.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      field.onChange(null);
                      return;
                    }
                    field.onChange(buildEndDateTime(currentStartTime || new Date(), val));
                  }}
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

        {/* Notes */}
        <div className="sm:col-span-12 flex flex-col gap-1.5">
          <Label htmlFor="shiftNotes">Notes &amp; Handover Instructions</Label>
          <Textarea
            id="shiftNotes"
            {...control.register("notes")}
            placeholder="Shift instructions, handover notes, and requirements..."
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
}
