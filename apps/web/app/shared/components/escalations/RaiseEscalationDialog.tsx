"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertTitle,
  AlertDescription,
  Textarea,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Activity,
  HeartCrack,
  Info,
} from "lucide-react";
import {
  EscalationReason,
  EscalationSeverity,
} from "@repo/schema";
import { useCreateEscalationMutation } from "../../../../lib/queries/escalations";
import { useGetResidentsQuery } from "../../../../lib/queries/residents";

export interface RaiseEscalationProps {
  isOpen: boolean;
  onClose: () => void;
  presetResidentId?: string;
  presetResidentName?: string;
  presetTaskId?: string;
  presetTaskTitle?: string;
  presetReason?: EscalationReason;
  presetNotes?: string;
  onSuccess?: () => void;
}

export function RaiseEscalationDialog({
  isOpen,
  onClose,
  presetResidentId,
  presetResidentName,
  presetTaskId,
  presetTaskTitle,
  presetReason,
  presetNotes,
  onSuccess,
}: RaiseEscalationProps): React.JSX.Element {
  const [residentId, setResidentId] = useState<string>("");
  const [reason, setReason] = useState<EscalationReason | "">("");
  const [severity, setSeverity] = useState<EscalationSeverity | "">("");
  const [initialNotes, setInitialNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: allResidents = [] } = useGetResidentsQuery();
  const residents = React.useMemo(
    () => allResidents.filter((r) => !r.isDraft && r.status !== "Draft"),
    [allResidents],
  );
  const createEscalation = useCreateEscalationMutation();

  useEffect(() => {
    if (isOpen) {
      setResidentId(presetResidentId || "");
      setReason(presetReason || "");
      setSeverity("");
      setInitialNotes(
        presetNotes ||
          (presetTaskTitle
            ? `Task '${presetTaskTitle}' was skipped or failed. Resident condition requires clinical evaluation.`
            : ""),
      );
      setErrorMsg(null);
    }
  }, [isOpen, presetResidentId, presetReason, presetNotes, presetTaskTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId) {
      setErrorMsg("Please select a resident");
      return;
    }
    if (!severity) {
      setErrorMsg("Please select an urgency severity level");
      return;
    }
    if (!reason) {
      setErrorMsg("Please select a trigger category");
      return;
    }
    if (!initialNotes || initialNotes.trim().length < 3) {
      setErrorMsg("Please provide clinical notes explaining the concern (min 3 characters)");
      return;
    }

    try {
      await createEscalation.mutateAsync({
        residentId,
        reason,
        severity,
        initialNotes: initialNotes.trim(),
        taskId: presetTaskId,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to raise escalation";
      setErrorMsg(msg);
    }
  };

  const reasonsList: Array<{ id: EscalationReason; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "AcuteDeterioration", label: "Acute Deterioration", icon: AlertTriangle },
    { id: "AbnormalVitals", label: "Abnormal Vitals / NEWS2", icon: Activity },
    { id: "RefusedMedication", label: "Refused Critical Meds", icon: Flame },
    { id: "Fall", label: "Fall or Physical Injury", icon: HeartCrack },
    { id: "SkippedTask", label: "Skipped Essential Care", icon: ShieldAlert },
    { id: "Behavioural", label: "Distress / Behavioural", icon: Info },
    { id: "Other", label: "Other Clinical Concern", icon: AlertTriangle },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="2xl" className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 font-['Outfit',sans-serif]">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Raise Clinical Alert to Nurse on Duty
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Instantly dispatches an in-app urgent alert and logs an SBAR triage requirement.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <Alert className="border-rose-200 bg-rose-50 text-rose-800">
              <AlertTitle className="font-semibold">Action Required</AlertTitle>
              <AlertDescription className="text-md">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Resident Selection */}
          <div className="space-y-1.5">
            <label className="text-md font-semibold text-slate-800">Resident</label>
            {presetResidentId ? (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 flex items-center justify-between">
                <span>{presetResidentName || "Selected Resident"}</span>
                <span className="text-md text-slate-400 font-normal">Locked to Task</span>
              </div>
            ) : (
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select a resident" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.fullName} {r.bed?.room?.roomNumber ? `(Room ${r.bed.room.roomNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Urgency / Severity Level */}
          <div className="space-y-1.5">
            <label className="text-md font-semibold text-slate-800">Urgency Severity</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSeverity("Medium")}
                className={cn(
                  "flex items-center justify-center h-10 px-3 rounded-xl text-md font-semibold transition-all border cursor-pointer",
                  severity === "Medium"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300",
                )}
              >
                Medium Urgency
              </button>
              <button
                type="button"
                onClick={() => setSeverity("High")}
                className={cn(
                  "flex items-center justify-center h-10 px-3 rounded-xl text-md font-semibold transition-all border cursor-pointer",
                  severity === "High"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300",
                )}
              >
                High Urgency
              </button>
              <button
                type="button"
                onClick={() => setSeverity("Critical")}
                className={cn(
                  "flex items-center justify-center h-10 px-3 rounded-xl text-md font-semibold transition-all border cursor-pointer",
                  severity === "Critical"
                    ? "bg-red-700 text-white border-red-700 shadow-sm ring-2 ring-red-400/50"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300",
                )}
              >
                Critical (Immediate)
              </button>
            </div>
          </div>

          {/* Clinical Trigger Reason */}
          <div className="space-y-1.5">
            <label className="text-md font-semibold text-slate-800">Trigger Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {reasonsList.map((item) => {
                const Icon = item.icon;
                const isSelected = reason === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReason(item.id)}
                    className={cn(
                      "flex items-center justify-start gap-2.5 min-h-[44px] py-2 px-3.5 rounded-xl text-md font-medium transition-all border text-left cursor-pointer",
                      isSelected
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isSelected ? "text-white" : "text-slate-500")} />
                    <span className="whitespace-normal leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="space-y-1.5">
            <label className="text-md font-semibold text-slate-800">
              Clinical Observation Notes &amp; Symptoms
            </label>
            <Textarea
              rows={3}
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
              placeholder="Describe symptoms, vital signs noticed, resident statements, or reasons for concern..."
              className="rounded-xl border-slate-200 text-md focus:border-primary"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-md font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createEscalation.isPending}
              className="h-10 px-5 rounded-xl text-md font-semibold"
            >
              <Flame className="size-4 mr-2" />
              {createEscalation.isPending ? "Dispatching..." : "Dispatch Clinical Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
