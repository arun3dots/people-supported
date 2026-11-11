"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import type { Shift } from "../../../../../../lib/types/shifts";
import type { Resident } from "../../../../../../lib/types/resident";

export interface ShiftBlockFormData {
  careType: string;
  durationHours: number;
  shiftWindow: string;
  handoverNotes?: string;
  residentIds?: string[];
}

interface ModifyShiftBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  staffName?: string;
  dayLabel?: string;
  residents?: Resident[];
  onSave: (data: ShiftBlockFormData) => Promise<void>;
  isSaving?: boolean;
}

const CARE_TYPE_PRESETS: Record<string, { duration: number; window: string }> = {
  "Shared Care (Core Support)": { duration: 8, window: "07:00 - 15:00" },
  "1:1 Dedicated Support": { duration: 6, window: "09:00 - 15:00" },
  "Sleep-in (Overnight)": { duration: 9, window: "22:00 - 07:00" },
  "Waking Night": { duration: 10, window: "21:00 - 07:00" },
  "Off / Rest Day": { duration: 0, window: "Off" },
};

export function ModifyShiftBlockModal({
  open,
  onOpenChange,
  shift,
  staffName,
  dayLabel,
  residents = [],
  onSave,
  isSaving = false,
}: ModifyShiftBlockModalProps): React.JSX.Element {
  const { toast } = useToast();

  const [careType, setCareType] = useState<string>(
    "Shared Care (Core Support)",
  );
  const [duration, setDuration] = useState<string>("8");
  const [shiftWindow, setShiftWindow] = useState<string>("07:00 - 15:00");
  const [notes, setNotes] = useState<string>("");
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const initialCareType = shift?.careType || "Shared Care (Core Support)";
    setCareType(initialCareType);
    setDuration(
      String(
        shift?.durationHours ??
          CARE_TYPE_PRESETS[initialCareType]?.duration ??
          8,
      ),
    );
    setShiftWindow(
      shift?.shiftWindow ||
        CARE_TYPE_PRESETS[initialCareType]?.window ||
        "07:00 - 15:00",
    );
    setNotes(shift?.notes || "");

    const existingAssignedId =
      shift?.assignments?.flatMap((a) => a.assignedResidentIds || [])[0] ||
      (residents.length > 0 ? residents[0]?.id || "" : "");
    setSelectedResidentId(existingAssignedId);
  }, [open, shift, residents]);

  const handleCareTypeChange = (newType: string) => {
    setCareType(newType);
    const preset = CARE_TYPE_PRESETS[newType];
    if (preset) {
      setDuration(String(preset.duration));
      setShiftWindow(preset.window);
    }
  };

  const handleFormSubmit = async () => {
    if (
      careType !== "Off / Rest Day" &&
      !selectedResidentId &&
      residents.length > 0
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a person supported for this shift.",
      });
      return;
    }

    try {
      await onSave({
        careType,
        durationHours: Number(duration) || 0,
        shiftWindow: shiftWindow.trim(),
        handoverNotes: notes.trim() || undefined,
        residentIds: selectedResidentId ? [selectedResidentId] : [],
      });
      toast({
        title: "Shift Block Saved",
        description: `Updated ${careType} for ${staffName || "Staff"} on ${dayLabel || "Rota"}.`,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to Save Shift",
        description:
          err instanceof Error ? err.message : "Could not update shift block",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Modify Shift Care Type &amp; Hours
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {staffName
              ? `${staffName} · ${dayLabel || "Selected Day"}`
              : "Configure shift allocation and timing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-md font-medium text-slate-700">
              Care Type
            </Label>
            <Select value={careType} onValueChange={handleCareTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Shared Care (Core Support)">
                  Shared Care (Core Support)
                </SelectItem>
                <SelectItem value="1:1 Dedicated Support">
                  1:1 Dedicated Support
                </SelectItem>
                <SelectItem value="Sleep-in (Overnight)">
                  Sleep-in (Overnight)
                </SelectItem>
                <SelectItem value="Waking Night">Waking Night</SelectItem>
                <SelectItem value="Off / Rest Day">Off / Rest Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {careType !== "Off / Rest Day" && (
            <div className="space-y-1">
              <Label required className="text-md font-medium text-slate-700">
                {careType === "1:1 Dedicated Support"
                  ? "Person Supported (1:1)"
                  : "Person Supported"}
              </Label>
              <Select
                value={selectedResidentId}
                onValueChange={setSelectedResidentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select person supported" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {residents.length > 0 ? (
                    residents.map((r) => {
                      const roomName =
                        r.bed?.room?.roomNumber ||
                        r.supportedLivingDetails?.referenceCode ||
                        "";
                      return (
                        <SelectItem key={r.id} value={r.id}>
                          {r.fullName}
                          {roomName ? ` (${roomName})` : ""}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="none" disabled>
                      No people supported available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
            <div className="space-y-1">
              <Label className="text-md font-medium text-slate-700">
                Duration (Hours)
              </Label>
              <Input
                type="number"
                min={0}
                max={24}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-md font-medium text-slate-700">
                Shift Window (24h)
              </Label>
              <Input
                value={shiftWindow}
                onChange={(e) => setShiftWindow(e.target.value)}
                placeholder="07:00 - 15:00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-md font-medium text-slate-700">
              Shift Handover Notes
            </Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Early core shared support across Flats 1 and 2..."
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={isSaving}
            variant="primary"
            size="lg"
          >
            {isSaving ? "Saving..." : "Save shift block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
