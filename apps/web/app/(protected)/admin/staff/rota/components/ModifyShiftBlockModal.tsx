"use client";

import React, { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import {
  Alert, AlertDescription, AlertTitle, Button, DatePicker, Dialog, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea,
  Badge, Text, Input
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { AlertCircle, Moon } from "lucide-react";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { Resident } from "../../../../../../lib/types/resident";
import type { StaffMember } from "../../../../../../lib/types/staff";
import {
  ShiftCareTypePresetCards,
  type CareTypePreset,
} from "./ShiftCareTypePresetCards";
import { ShiftStaffResidentSelectors } from "./ShiftStaffResidentSelectors";
import { ShiftTimingDurationInputs, NIGHT_SHIFT_WINDOWS } from "./ShiftTimingDurationInputs";
import { getShiftDateStr } from "./rotaDataUtils";
import { extractErrorMessage } from "./rotaCoverageUtils";

export interface ShiftBlockFormData {
  careType: string;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  shiftWindow: string;
  handoverNotes?: string;
  userIds: string[];
  residentIds: string[];
}

interface ModifyShiftBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShift?: Shift | null;
  initialStaffId?: string;
  initialDateStr?: string;
  staffName?: string;
  staffRole?: string;
  dayLabel?: string;
  staffList?: StaffMember[];
  residents?: Resident[];
  onSave: (data: ShiftBlockFormData) => Promise<void>;
  isSaving?: boolean;
}

export function ModifyShiftBlockModal({
  open,
  onOpenChange,
  initialShift,
  initialStaffId,
  initialDateStr,
  staffName: _staffName,
  dayLabel: _dayLabel,
  staffList = [],
  residents = [],
  onSave,
  isSaving = false,
}: ModifyShiftBlockModalProps): React.JSX.Element {
  const { toast } = useToast();

  const [formError, setFormError] = useState<string | null>(null);
  const [careType, setCareType] = useState<string>("Shared Care (Core Support)");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [duration, setDuration] = useState<string>("8");
  const [shiftWindow, setShiftWindow] = useState<string>("07:00 - 15:00");
  const [notes, setNotes] = useState<string>("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);

  const isSharedCare = careType === "Shared Care (Core Support)";
  const isOneToOne = careType === "1:1 Dedicated Support";
  const isSleepIn = careType === "Sleep-in (Overnight)";
  const isWakingNight = careType === "Waking Night";
  const isOffDay = careType === "Off / Rest Day";
  const isNightShift = isSleepIn || isWakingNight;

  // Single-day overnight shifts: 24h start/end clocks anchored to the chosen date.
  const windowParts = shiftWindow.match(/(\d{1,2}):(\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}):(\d{2})/);
  const nightStartClock = windowParts
    ? `${windowParts[1]!.padStart(2, "0")}:${windowParts[2]!}`
    : isSleepIn
      ? "22:00"
      : "21:00";
  const nightEndClock = windowParts
    ? `${windowParts[3]!.padStart(2, "0")}:${windowParts[4]!}`
    : "07:00";
  const nightShiftDay = startDate ? parse(startDate, "yyyy-MM-dd", new Date()) : undefined;
  const withClock = (clock: string): Date | undefined =>
    nightShiftDay && clock ? parse(clock, "HH:mm", nightShiftDay) : undefined;
  const isOvernightNight = nightEndClock <= nightStartClock;

  const updateNightWindow = (startClock: string, endClock: string) => {
    setFormError(null);
    setShiftWindow(`${startClock} - ${endClock}`);
    const [sh = "0", sm = "0"] = startClock.split(":");
    const [eh = "0", em = "0"] = endClock.split(":");
    let startMins = Number(sh) * 60 + Number(sm);
    let endMins = Number(eh) * 60 + Number(em);
    if (endMins <= startMins) endMins += 24 * 60;
    const hrs = Math.round(((endMins - startMins) / 60) * 10) / 10;
    if (!isSleepIn && hrs > 0 && hrs <= 24) setDuration(String(hrs));
  };

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    const initialCareType = initialShift?.careType || "Shared Care (Core Support)";
    setCareType(initialCareType);
    const targetDate =
      (initialShift ? getShiftDateStr(initialShift) : initialDateStr) ||
      new Date().toISOString().split("T")[0] ||
      "";
    setStartDate(targetDate);
    setEndDate("");
    setDuration(initialShift?.durationHours ? String(initialShift.durationHours) : "8");
    setShiftWindow(initialShift?.shiftWindow || "07:00 - 15:00");
    setNotes(initialShift?.notes || "");

    const assignedStaff =
      initialShift?.userIds && initialShift.userIds.length > 0
        ? initialShift.userIds
        : initialStaffId ? [initialStaffId] : staffList[0] ? [staffList[0].id] : [];
    setSelectedStaffIds(assignedStaff);

    const initialRes =
      initialShift?.residentIds && initialShift.residentIds.length > 0
        ? initialShift.residentIds
        : initialCareType === "Shared Care (Core Support)"
          ? residents.map((r) => r.id)
          : residents[0] ? [residents[0].id] : [];
    setSelectedResidentIds(initialRes);
  }, [open, initialShift, initialStaffId, initialDateStr, staffList, residents]);

  const handleSelectCarePreset = (preset: CareTypePreset) => {
    setFormError(null);
    setCareType(preset.id);
    setDuration(String(preset.duration));
    setShiftWindow(preset.window);
    const isHouseCoverage =
      preset.id === "Shared Care (Core Support)" ||
      preset.id === "Sleep-in (Overnight)" ||
      preset.id === "Waking Night";
    if (preset.id !== "Shared Care (Core Support)" && preset.id !== "2:1 Dedicated Support" && selectedStaffIds.length > 1) {
      setSelectedStaffIds(selectedStaffIds.slice(0, 1));
    }
    if (isHouseCoverage) {
      setSelectedResidentIds(residents.map((r) => r.id));
    } else if (preset.id === "Off / Rest Day") {
      setSelectedResidentIds([]);
    } else {
      if (preset.id === "2:1 Dedicated Support" && selectedStaffIds.length < 2 && staffList.length >= 2) {
        setSelectedStaffIds(staffList.slice(0, 2).map((s) => s.id));
      }
      if (selectedResidentIds.length > 1) {
        setSelectedResidentIds(selectedResidentIds.slice(0, 1));
      }
    }
  };

  const toggleStaffSelection = (id: string) => {
    setFormError(null);
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((i) => i !== id) : prev) : [...prev, id],
    );
  };

  const toggleResidentSelection = (id: string) => {
    setFormError(null);
    setSelectedResidentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleFormSubmit = async () => {
    setFormError(null);
    if (!startDate) {
      toast({
        title: "Validation error",
        description: isNightShift ? "Shift date is required." : "From Date is required.",
        variant: "destructive",
      });
      return;
    }
    if (selectedStaffIds.length === 0) {
      toast({ title: "Validation error", description: "At least one staff member must be assigned.", variant: "destructive" });
      return;
    }
    if (careType === "2:1 Dedicated Support" && selectedStaffIds.length < 2) {
      toast({
        title: "Staff allocation requirement",
        description: "2:1 Dedicated Support requires at least 2 staff members assigned.",
        variant: "destructive",
      });
      return;
    }
    if (!isOffDay && selectedResidentIds.length === 0) {
      toast({ title: "Validation error", description: "At least one person supported must be selected.", variant: "destructive" });
      return;
    }

    const parsedDuration = isSleepIn || isOffDay ? 0 : Number.parseFloat(duration) || 8;
    // Night/sleep-in runs are one-off unless the optional repeat date is set.
    // Fixed 22:00-07:00 is only the sleep-in fallback; the manager's chosen times win otherwise.
    const resolvedWindowMatches = shiftWindow.match(/(\d{1,2}:\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}:\d{2})/);
    const resolvedShiftWindow = isSleepIn
      ? (resolvedWindowMatches ? shiftWindow : NIGHT_SHIFT_WINDOWS.sleepIn)
      : shiftWindow;
    try {
      await onSave({
        careType,
        startDate,
        endDate: endDate || undefined,
        durationHours: parsedDuration,
        shiftWindow: resolvedShiftWindow,
        handoverNotes: notes,
        userIds: selectedStaffIds,
        residentIds: isOffDay ? [] : selectedResidentIds,
      });
      toast({
        title: initialShift ? "Shift updated" : "Shift scheduled",
        description: `Successfully ${initialShift ? "updated" : "created"} ${careType} shift.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(
        err,
        "Failed to save shift block. Please check for scheduling conflicts or leave overlap.",
      );
      setFormError(errorMessage);
      toast({
        title: "Cannot save shift",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="6xl" className="max-h-[90vh] overflow-y-auto p-6 sm:p-8 font-sans">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {initialShift ? "Modify Shift Schedule" : "Create New Shift Schedule"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Configure shift window, care model, multi-staff allocation, and people supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Care Type Preset Cards */}
          <ShiftCareTypePresetCards
            careType={careType}
            onSelectCareType={handleSelectCarePreset}
          />

          {/* Date Range: captured inline for single-day night/sleep-in shifts */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="space-y-1">
              <Label required className="text-md font-semibold text-slate-800">
                {isNightShift ? "Shift Date" : "From Date"}
              </Label>
              <DatePicker
                value={startDate}
                onChange={(d) => {
                  setFormError(null);
                  setStartDate(d ? format(d, "yyyy-MM-dd") : "");
                }}
                maxYear={new Date().getFullYear() + 5}
                placeholder={isNightShift ? "Select night shift date" : "Select shift date"}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-md font-semibold text-slate-800">
                To Date (Optional repeat)
              </Label>
              <DatePicker
                value={endDate}
                onChange={(d) => {
                  setFormError(null);
                  setEndDate(d ? format(d, "yyyy-MM-dd") : "");
                }}
                minDate={startDate ? new Date(startDate) : undefined}
                maxYear={new Date().getFullYear() + 5}
                placeholder={isNightShift ? "One-off if empty" : "Select repeat end date"}
                className="w-full"
              />
            </div>
          </div>

          {/* Night/sleep-in: 24h start/end times anchored to the shift date */}
          {isNightShift && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Moon className="size-4 text-amber-700" />
                  <Text as="span" size="md" weight="medium">
                    {isSleepIn
                      ? "Overnight Sleep-in (Flat Rate \u2022 Non-hourly)"
                      : "Waking Night (Single Night Shift)"}
                  </Text>
                </div>
                <Badge variant="secondary" state={isOvernightNight ? "warning" : "info"}>
                  {!isSleepIn && duration ? `${duration}h · ` : ""}
                  {isOvernightNight ? "Spans into next day" : "Same day"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="space-y-1">
                  <Label required className="text-md font-medium text-slate-700">
                    Start Time (24h)
                  </Label>
                  <DatePicker
                    variant="datetime"
                    use12Hours={false}
                    value={withClock(nightStartClock)}
                    onChange={(d) => {
                      if (!d) return;
                      updateNightWindow(format(d, "HH:mm"), nightEndClock);
                    }}
                    minDate={nightShiftDay}
                    maxDate={nightShiftDay}
                    placeholder="Select start time"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label required className="text-md font-medium text-slate-700">
                    End Time (24h)
                  </Label>
                  <DatePicker
                    variant="datetime"
                    use12Hours={false}
                    value={withClock(nightEndClock)}
                    onChange={(d) => {
                      if (!d) return;
                      updateNightWindow(nightStartClock, format(d, "HH:mm"));
                    }}
                    minDate={nightShiftDay}
                    maxDate={nightShiftDay}
                    placeholder="Select end time"
                    className="w-full"
                  />
                </div>
              </div>

              <Text size="xs" variant="muted">
                One night per date. The end time rolls into the following morning automatically.
              </Text>
            </div>
          )}

          {/* Staff & Resident Selectors */}
          <ShiftStaffResidentSelectors
            careType={careType}
            isSharedCare={isSharedCare}
            isOneToOne={isOneToOne}
            isOffDay={isOffDay}
            staffList={staffList}
            selectedStaffIds={selectedStaffIds}
            onToggleStaff={toggleStaffSelection}
            onSetSingleStaff={(id) => setSelectedStaffIds([id])}
            residents={residents}
            selectedResidentIds={selectedResidentIds}
            onToggleResident={toggleResidentSelection}
            onSetSingleResident={(id) => setSelectedResidentIds([id])}
            onSelectAllResidents={() => {
              setFormError(null);
              setSelectedResidentIds(residents.map((r) => r.id));
            }}
            onClearResidents={() => {
              setFormError(null);
              setSelectedResidentIds([]);
            }}
          />

          {/* Timing & Duration */}
          {!isOffDay && (
            <ShiftTimingDurationInputs
              isSleepIn={isSleepIn}
              isNightShift={isNightShift}
              duration={duration}
              setDuration={setDuration}
              shiftWindow={shiftWindow}
              setShiftWindow={setShiftWindow}
            />
          )}

          {/* Handover / Instructions Notes */}
          <div className="space-y-1">
            <Label className="text-md font-medium text-slate-700">Handover Notes / Instructions</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Care notes, specific tasks, medication handovers..."
              className="bg-white"
            />
          </div>

          {/* Scheduling Conflict & Safeguard Error Alert */}
          {formError && (
            <Alert variant="destructive" className="animate-in fade-in duration-200">
              <AlertCircle className="size-4.5" />
              <AlertTitle>Scheduling Conflict / Safeguard Notice</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} disabled={isSaving} variant="primary" size="lg">
            {isSaving ? "Saving..." : "Save Shift Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
