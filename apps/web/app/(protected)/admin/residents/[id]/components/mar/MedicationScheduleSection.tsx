"use client";

import React, { useState } from "react";
import { Clock, Plus, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Checkbox,
  Text,
  DatePicker,
  DateTimePicker,
} from "@repo/ui/components/ui";

const DEFAULT_SCHEDULE_TIMES = [
  { label: "Morning (08:00)", time: "08:00" },
  { label: "Noon (12:00)", time: "12:00" },
  { label: "Evening (18:00)", time: "18:00" },
  { label: "Night (22:00)", time: "22:00" },
];

const OBSERVATION_OPTIONS = [
  { id: "bp", label: "Blood Pressure (BP)" },
  { id: "pulse", label: "Pulse Rate" },
  { id: "bloodSugar", label: "Blood Glucose" },
  { id: "temp", label: "Body Temperature" },
  { id: "spo2", label: "Oxygen Saturation (SpO2)" },
];

interface MedicationScheduleSectionProps {
  isBulk: boolean;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  selectedTimes: string[];
  toggleTime: (time: string) => void;
  customTime: string;
  setCustomTime: (val: string) => void;
  handleAddCustomTime: () => void;
  scheduledDateTime: string;
  setScheduledDateTime: (val: string) => void;
  mandatoryObservations: string[];
  toggleObservation: (id: string) => void;
}

export function MedicationScheduleSection({
  isBulk,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedTimes,
  toggleTime,
  customTime,
  setCustomTime,
  handleAddCustomTime,
  scheduledDateTime,
  setScheduledDateTime,
  mandatoryObservations,
  toggleObservation,
}: MedicationScheduleSectionProps): React.JSX.Element {
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Custom times that are not part of default presets
  const customSelectedTimes = selectedTimes.filter(
    (t) => !DEFAULT_SCHEDULE_TIMES.some((d) => d.time === t)
  );

  const onConfirmCustomTime = () => {
    if (!customTime) return;
    handleAddCustomTime();
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-4">
      {isBulk ? (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={(d) => setStartDate(d ? d.toISOString().split("T")[0] ?? "" : "")}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-1">
              <Label required>End Date</Label>
              <DatePicker
                value={endDate}
                onChange={(d) => setEndDate(d ? d.toISOString().split("T")[0] ?? "" : "")}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>Daily Administration Times</Label>
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              {/* Default Presets */}
              {DEFAULT_SCHEDULE_TIMES.map((item) => {
                const isSelected = selectedTimes.includes(item.time);
                return (
                  <Button
                    key={item.time}
                    type="button"
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => toggleTime(item.time)}
                  >
                    <Clock className="size-3" />
                    {item.label}
                  </Button>
                );
              })}

              {/* Recorded Custom Times */}
              {customSelectedTimes.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => toggleTime(time)}
                  className="gap-1.5"
                  title="Click to remove custom time"
                >
                  <Clock className="size-3" />
                  <span>{time}</span>
                  <X className="size-3 ml-0.5 hover:opacity-80" />
                </Button>
              ))}

              {/* Toggle Custom Timing Input Button */}
              {!showCustomInput && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(true)}
                  className="gap-1 border-dashed"
                >
                  <Plus className="size-3" /> Custom Timing
                </Button>
              )}
            </div>

            {/* Custom Time Input Picker (Only visible when selected) */}
            {showCustomInput && (
              <div className="flex items-center gap-2 pt-2 p-2.5 bg-white border border-slate-200 rounded-xl">
                <Input
                  type="time"
                  placeholder="HH:mm"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-36"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onConfirmCustomTime}
                  disabled={!customTime}
                >
                  <Plus className="size-3" /> Add Time
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomTime("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
          <Label required>Scheduled Date & Time</Label>
          <DateTimePicker
            value={scheduledDateTime}
            onChange={(d) => setScheduledDateTime(d ? d.toISOString() : "")}
            placeholder="Select scheduled date & time"
          />
        </div>
      )}

      {/* Mandatory Pre-Admin Observations */}
      <div className="space-y-1.5 pt-1">
        <Label>Mandatory Pre-Administration Observations (Optional)</Label>
        <Text size="sm" variant="muted">
          Select vitals that staff must record before administering this medication.
        </Text>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {OBSERVATION_OPTIONS.map((obs) => {
            const checked = mandatoryObservations.includes(obs.id);
            return (
              <Label
                key={obs.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-md cursor-pointer transition-colors ${checked
                  ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleObservation(obs.id)}
                />
                <span>{obs.label}</span>
              </Label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
