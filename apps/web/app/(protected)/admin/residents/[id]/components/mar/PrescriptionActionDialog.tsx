"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
} from "@repo/ui/components/ui";
import {
  useStopMedicationPrescriptionMutation,
  useChangeMedicationPrescriptionMutation,
  usePauseMedicationPrescriptionMutation,
} from "../../../../../../../lib/queries/residents";
import type { MedicationPrescriptionRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import {
  todayDateString,
  StopActionSchema,
  PauseActionSchema,
  ChangeActionSchema,
} from "./PrescriptionActionSchemas";

export type PrescriptionAction = "stop" | "pause" | "change";

interface PrescriptionActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: PrescriptionAction;
  prescription: MedicationPrescriptionRow | null;
  residentId: string;
}

const TITLES: Record<PrescriptionAction, string> = {
  stop: "Stop medication",
  pause: "Pause medication",
  change: "Change medication",
};

export function PrescriptionActionDialog({
  open,
  onOpenChange,
  action,
  prescription,
  residentId,
}: PrescriptionActionDialogProps): React.JSX.Element | null {
  const stopMutation = useStopMedicationPrescriptionMutation();
  const pauseMutation = usePauseMedicationPrescriptionMutation();
  const changeMutation = useChangeMedicationPrescriptionMutation();

  const [effectiveDate, setEffectiveDate] = useState(todayDateString());
  const [resumeOn, setResumeOn] = useState(todayDateString());
  const [reason, setReason] = useState("");
  const [backdateReason, setBackdateReason] = useState("");
  const [drugName, setDrugName] = useState(prescription?.drugName ?? "");
  const [dose, setDose] = useState(prescription?.dose ?? "");
  const [form, setForm] = useState(prescription?.form ?? "");
  const [times, setTimes] = useState((prescription?.times ?? []).join(", "));
  const [endDate, setEndDate] = useState(
    prescription ? prescription.endDate.slice(0, 10) : todayDateString(),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!prescription) return null;

  const isPending =
    stopMutation.isPending || pauseMutation.isPending || changeMutation.isPending;
  const isBackdated = effectiveDate < todayDateString();

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let result;
    if (action === "stop") {
      result = StopActionSchema.safeParse({ effectiveDate, reason, backdateReason });
    } else if (action === "pause") {
      result = PauseActionSchema.safeParse({ effectiveDate, resumeOn, reason, backdateReason });
    } else {
      result = ChangeActionSchema.safeParse({
        drugName,
        dose,
        form,
        times,
        effectiveDate,
        endDate,
        reason,
        backdateReason,
      });
    }

    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString();
        if (key && !errMap[key]) {
          errMap[key] = issue.message;
        }
      });
      setFieldErrors(errMap);
      return;
    }

    setFieldErrors({});
    const trimmedBackdate = backdateReason.trim() || undefined;
    const base = { reason: reason.trim(), backdateReason: trimmedBackdate };

    if (action === "stop") {
      await stopMutation.mutateAsync({
        prescriptionId: prescription.id,
        residentId,
        data: { ...base, effectiveDate },
      });
    } else if (action === "pause") {
      await pauseMutation.mutateAsync({
        prescriptionId: prescription.id,
        residentId,
        data: { ...base, pauseFrom: effectiveDate, resumeOn },
      });
    } else {
      await changeMutation.mutateAsync({
        prescriptionId: prescription.id,
        residentId,
        data: {
          ...base,
          effectiveDate,
          drugName: drugName.trim(),
          dose: dose.trim(),
          form: form.trim(),
          instructions: prescription.instructions ?? undefined,
          imageUrls: prescription.imageUrls ?? [],
          endDate,
          allowLateAdministration: prescription.allowLateAdministration,
          mandatoryObservations: prescription.mandatoryObservations ?? [],
          times: times
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
    }
    onOpenChange(false);
    setReason("");
    setBackdateReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>
            {prescription.drugName} · {prescription.dose}. Only future doses are
            affected; administered doses are kept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {action === "change" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div className="space-y-1">
                <Label htmlFor="rx-drug">Drug name</Label>
                <Input
                  id="rx-drug"
                  value={drugName}
                  errorMessage={fieldErrors.drugName}
                  onChange={(e) => {
                    setDrugName(e.target.value);
                    clearFieldError("drugName");
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rx-dose">Dose</Label>
                <Input
                  id="rx-dose"
                  value={dose}
                  errorMessage={fieldErrors.dose}
                  onChange={(e) => {
                    setDose(e.target.value);
                    clearFieldError("dose");
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rx-form">Form</Label>
                <Input
                  id="rx-form"
                  value={form}
                  errorMessage={fieldErrors.form}
                  onChange={(e) => {
                    setForm(e.target.value);
                    clearFieldError("form");
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rx-times">Times (HH:mm, comma separated)</Label>
                <Input
                  id="rx-times"
                  value={times}
                  errorMessage={fieldErrors.times}
                  onChange={(e) => {
                    setTimes(e.target.value);
                    clearFieldError("times");
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="space-y-1">
              <Label htmlFor="rx-effective">
                {action === "pause" ? "Pause from" : "Effective from"}
              </Label>
              <Input
                id="rx-effective"
                type="date"
                value={effectiveDate}
                errorMessage={fieldErrors.effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.target.value);
                  clearFieldError("effectiveDate");
                }}
              />
            </div>
            {action === "pause" && (
              <div className="space-y-1">
                <Label htmlFor="rx-resume">Resume on</Label>
                <Input
                  id="rx-resume"
                  type="date"
                  value={resumeOn}
                  errorMessage={fieldErrors.resumeOn}
                  onChange={(e) => {
                    setResumeOn(e.target.value);
                    clearFieldError("resumeOn");
                  }}
                />
              </div>
            )}
            {action === "change" && (
              <div className="space-y-1">
                <Label htmlFor="rx-end">End date</Label>
                <Input
                  id="rx-end"
                  type="date"
                  value={endDate}
                  errorMessage={fieldErrors.endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    clearFieldError("endDate");
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="rx-reason">Reason</Label>
            <Textarea
              id="rx-reason"
              value={reason}
              errorMessage={fieldErrors.reason}
              onChange={(e) => {
                setReason(e.target.value);
                clearFieldError("reason");
              }}
              maxLength={500}
            />
          </div>

          {isBackdated && (
            <div className="space-y-1">
              <Label htmlFor="rx-backdate">Backdate reason (required for past dates)</Label>
              <Textarea
                id="rx-backdate"
                value={backdateReason}
                errorMessage={fieldErrors.backdateReason}
                onChange={(e) => {
                  setBackdateReason(e.target.value);
                  clearFieldError("backdateReason");
                }}
                maxLength={500}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Saving..." : TITLES[action]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
