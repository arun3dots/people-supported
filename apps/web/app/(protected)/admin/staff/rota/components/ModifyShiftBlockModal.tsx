"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Alert, AlertDescription, AlertTitle, Button, DatePicker, Dialog, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { AlertCircle } from "lucide-react";
import type { PropertyItem, SchemeItem } from "../../../../../../lib/types/facility";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { Resident } from "../../../../../../lib/types/resident";
import type { StaffMember } from "../../../../../../lib/types/staff";
import { ShiftCareTypePresetCards, type CareTypePreset } from "./ShiftCareTypePresetCards";
import { ShiftStaffResidentSelectors } from "./ShiftStaffResidentSelectors";
import { extractErrorMessage } from "./rotaCoverageUtils";

export interface ShiftBlockFormData {
  careType: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  shiftWindow: string;
  schemeId?: string;
  propertyId?: string;
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
  schemes?: SchemeItem[];
  properties?: PropertyItem[];
  onSave: (data: ShiftBlockFormData) => Promise<void>;
  isSaving?: boolean;
}

function buildDateTimeFromWindow(baseDateStr: string, windowStr: string): { start: Date; end: Date } {
  const match = windowStr.match(/(\d{1,2}):(\d{2})\s*[-\u2013\u2014]\s*(\d{1,2}):(\d{2})/);
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const year = y || new Date().getFullYear();
  const month = (m || 1) - 1;
  const day = d || 1;
  if (!match) {
    return {
      start: new Date(year, month, day, 7, 0, 0, 0),
      end: new Date(year, month, day, 15, 0, 0, 0),
    };
  }
  const sh = Number(match[1]);
  const sm = Number(match[2]);
  const eh = Number(match[3]);
  const em = Number(match[4]);
  const start = new Date(year, month, day, sh, sm, 0, 0);
  const isOvernight = eh < sh || (eh === sh && em <= sm);
  const end = new Date(year, month, isOvernight ? day + 1 : day, eh, em, 0, 0);
  return { start, end };
}

export function ModifyShiftBlockModal({
  open,
  onOpenChange,
  initialShift,
  initialStaffId,
  initialDateStr,
  staffList = [],
  residents = [],
  schemes = [],
  properties = [],
  onSave,
  isSaving = false,
}: ModifyShiftBlockModalProps): React.JSX.Element {
  const { toast } = useToast();

  const [formError, setFormError] = useState<string | null>(null);
  const [careType, setCareType] = useState<string>("");
  const [startDateTime, setStartDateTime] = useState<Date | undefined>(undefined);
  const [endDateTime, setEndDateTime] = useState<Date | undefined>(undefined);
  const [schemeId, setSchemeId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);

  const isSharedCare = careType === "Shared Care (Core Support)";
  const isOneToOne = careType === "1:1 Dedicated Support";
  const isSleepIn = careType === "Sleep-in (Overnight)";
  const isOffDay = careType === "Off / Rest Day";

  const activeResidents = useMemo(
    () => residents.filter((r) => r.status === "Active"),
    [residents],
  );

  const filteredProperties = useMemo(() => {
    if (!schemeId) return properties;
    return properties.filter((p) => p.schemeId === schemeId);
  }, [properties, schemeId]);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    const initialCareType = initialShift?.careType || "";
    setCareType(initialCareType);

    if (initialShift) {
      setStartDateTime(new Date(initialShift.startTime));
      setEndDateTime(new Date(initialShift.endTime));
    } else {
      setStartDateTime(undefined);
      setEndDateTime(undefined);
    }

    setNotes(initialShift?.notes || "");

    const assignedStaff =
      initialShift?.userIds && initialShift.userIds.length > 0
        ? initialShift.userIds
        : initialStaffId
          ? [initialStaffId]
          : [];
    setSelectedStaffIds(assignedStaff);

    // Resolve initial Scheme & Property only when editing an existing shift
    const initPropId = initialShift?.wingId || "";
    if (initPropId) {
      const matchedProp = properties.find((p) => p.id === initPropId);
      setPropertyId(initPropId);
      setSchemeId(matchedProp?.schemeId || "");
    } else {
      setSchemeId("");
      setPropertyId("");
    }

    const initialRes =
      initialShift?.residentIds && initialShift.residentIds.length > 0
        ? initialShift.residentIds
        : [];
    setSelectedResidentIds(initialRes);
  }, [open, initialShift, initialStaffId, initialDateStr, properties]);

  const handleSelectCarePreset = (preset: CareTypePreset) => {
    setFormError(null);
    setCareType(preset.id);
    if (startDateTime) {
      const baseStr = format(startDateTime, "yyyy-MM-dd");
      const { start, end } = buildDateTimeFromWindow(
        baseStr,
        preset.id === "Off / Rest Day" ? "08:00 - 16:00" : preset.window,
      );
      setStartDateTime(start);
      setEndDateTime(end);
    }

    if (preset.id !== "Shared Care (Core Support)" && preset.id !== "2:1 Dedicated Support" && selectedStaffIds.length > 1) {
      setSelectedStaffIds(selectedStaffIds.slice(0, 1));
    }

    if (preset.id === "Off / Rest Day") {
      setSelectedResidentIds([]);
    } else if (
      preset.id !== "Shared Care (Core Support)" &&
      preset.id !== "Sleep-in (Overnight)" &&
      preset.id !== "Waking Night" &&
      selectedResidentIds.length > 1
    ) {
      setSelectedResidentIds(selectedResidentIds.slice(0, 1));
    }
  };

  const toggleStaffSelection = (id: string) => {
    setFormError(null);
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
    if (!careType) {
      toast({ title: "Validation error", description: "Please select a care type.", variant: "destructive" });
      return;
    }
    if (!startDateTime || !endDateTime) {
      toast({ title: "Validation error", description: "Start and End date/time are required.", variant: "destructive" });
      return;
    }
    const finalStart = isOffDay
      ? new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate(), 8, 0, 0, 0)
      : startDateTime;
    const finalEnd = isOffDay
      ? new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate(), 16, 0, 0, 0)
      : endDateTime;

    if (finalEnd.getTime() <= finalStart.getTime()) {
      toast({ title: "Validation error", description: "End date & time must be after Start date & time.", variant: "destructive" });
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
    if (!isOffDay && selectedResidentIds.length === 0 && !propertyId) {
      toast({
        title: "Validation error",
        description: "Select a property or at least one person supported.",
        variant: "destructive",
      });
      return;
    }

    const diffHours = Math.round(((finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60)) * 10) / 10;
    const durationHours = isSleepIn || isOffDay ? 0 : diffHours;
    const shiftWindow = isOffDay
      ? "Off"
      : `${format(finalStart, "HH:mm")} - ${format(finalEnd, "HH:mm")}`;

    try {
      await onSave({
        careType,
        startTime: finalStart.toISOString(),
        endTime: finalEnd.toISOString(),
        durationHours,
        shiftWindow,
        schemeId: schemeId || undefined,
        propertyId: propertyId || undefined,
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
            Configure care model, scheme/property, start &amp; end time, staff allocation, and people supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ShiftCareTypePresetCards careType={careType} onSelectCareType={handleSelectCarePreset} />

          {/* Scheme & Property Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="space-y-1">
              <Label className="text-md font-semibold text-slate-800">Scheme</Label>
              <Select
                value={schemeId || "none"}
                onValueChange={(val) => {
                  setFormError(null);
                  const nextScheme = val === "none" ? "" : val;
                  setSchemeId(nextScheme);
                  if (propertyId) {
                    const prop = properties.find((p) => p.id === propertyId);
                    if (prop && nextScheme && prop.schemeId !== nextScheme) setPropertyId("");
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="Select scheme (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All / No Specific Scheme</SelectItem>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-md font-semibold text-slate-800">Property</Label>
              <Select
                value={propertyId || "none"}
                onValueChange={(val) => {
                  setFormError(null);
                  const nextPropId = val === "none" ? "" : val;
                  setPropertyId(nextPropId);
                  const prop = properties.find((p) => p.id === nextPropId);
                  if (prop?.schemeId) setSchemeId(prop.schemeId);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white">
                  <SelectValue placeholder="Select property (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Specific Property</SelectItem>
                  {filteredProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Simple Start Date & Time / End Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="space-y-1">
              <Label required className="text-md font-semibold text-slate-800">
                {isOffDay ? "Start Date" : "Start Date & Time"}
              </Label>
              <DatePicker
                variant={isOffDay ? "date" : "datetime"}
                use12Hours={false}
                value={startDateTime}
                onChange={(d: Date | undefined) => {
                  setFormError(null);
                  setStartDateTime(d);
                }}
                minDate={initialShift ? undefined : new Date(new Date().setHours(0, 0, 0, 0))}
                maxYear={new Date().getFullYear() + 5}
                placeholder={isOffDay ? "Select start date" : "Select start date & time"}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label required className="text-md font-semibold text-slate-800">
                {isOffDay ? "End Date" : "End Date & Time"}
              </Label>
              <DatePicker
                variant={isOffDay ? "date" : "datetime"}
                use12Hours={false}
                value={endDateTime}
                onChange={(d: Date | undefined) => {
                  setFormError(null);
                  setEndDateTime(d);
                }}
                minDate={startDateTime}
                maxYear={new Date().getFullYear() + 5}
                placeholder={isOffDay ? "Select end date" : "Select end date & time"}
                className="w-full"
              />
            </div>
          </div>

          <ShiftStaffResidentSelectors
            careType={careType}
            isSharedCare={isSharedCare}
            isOneToOne={isOneToOne}
            isOffDay={isOffDay}
            staffList={staffList}
            selectedStaffIds={selectedStaffIds}
            onToggleStaff={toggleStaffSelection}
            onSetSingleStaff={(id) => setSelectedStaffIds([id])}
            residents={activeResidents}
            selectedResidentIds={selectedResidentIds}
            onToggleResident={toggleResidentSelection}
            onSetSingleResident={(id) => setSelectedResidentIds([id])}
            onSelectAllResidents={() => {
              setFormError(null);
              setSelectedResidentIds(activeResidents.map((r) => r.id));
            }}
            onClearResidents={() => {
              setFormError(null);
              setSelectedResidentIds([]);
            }}
          />

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
