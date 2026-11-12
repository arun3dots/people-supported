"use client";

import React from "react";
import { Moon } from "lucide-react";
import { Input, Label } from "@repo/ui/components/ui";

export const NIGHT_SHIFT_WINDOWS = {
  sleepIn: "22:00 - 07:00",
  wakingNight: "21:00 - 07:00",
} as const;

interface ShiftTimingDurationInputsProps {
  isSleepIn: boolean;
  isNightShift?: boolean;
  duration: string;
  setDuration: (val: string) => void;
  shiftWindow: string;
  setShiftWindow: (val: string) => void;
  onFormErrorClear?: () => void;
}

/** Recompute hours (HH:mm start → HH:mm end, rolling overnight) so duration stays in sync. */
function windowHours(start: string, end: string): number {
  const [sh = "0", sm = "0"] = start.split(":");
  const [eh = "0", em = "0"] = end.split(":");
  const startMins = Number(sh) * 60 + Number(sm);
  let endMins = Number(eh) * 60 + Number(em);
  if (endMins <= startMins) endMins += 24 * 60;
  return Math.round(((endMins - startMins) / 60) * 10) / 10;
}

export function ShiftTimingDurationInputs({
  isSleepIn,
  isNightShift = false,
  duration,
  setDuration,
  shiftWindow,
  setShiftWindow,
  onFormErrorClear,
}: ShiftTimingDurationInputsProps): React.JSX.Element {
  const handleWindowChange = (val: string) => {
    onFormErrorClear?.();
    setShiftWindow(val);
    const match = val.match(
      /^\s*(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s*$/,
    );
    if (match) {
      const hrs = windowHours(
        `${match[1]!.padStart(2, "0")}:${match[2]}`,
        `${match[3]!.padStart(2, "0")}:${match[4]}`,
      );
      if (hrs > 0 && hrs <= 24) setDuration(String(hrs));
    }
  };


  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Duration (Hours)
        </Label>
        <Input
          type="number"
          min={0.5}
          max={24}
          step={0.5}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="h-10 bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-md font-medium text-slate-700">
          Shift Window (24h)
        </Label>
        <Input
          value={shiftWindow}
          onChange={(e) => handleWindowChange(e.target.value)}
          placeholder="07:00 - 15:00"
          className="h-10 bg-white"
        />
      </div>
    </div>
  );
}
