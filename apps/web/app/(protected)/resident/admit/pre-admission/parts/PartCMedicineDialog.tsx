"use client";

import { useState } from "react";
import type { PreAdmissionPartCDTO } from "@repo/schema";
import { MEDICATION_FORMS } from "@repo/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui";
import { MedicationScheduleSection } from "../../../../admin/residents/[id]/components/mar/MedicationScheduleSection";
import { MedicationImageUploader } from "../../../../admin/residents/[id]/components/mar/MedicationImageUploader";
import { FieldGrid } from "../shared/PartCard";
import { CheckField, SelectField, TextAreaField, TextField } from "../shared/fields";

type Medicine = PreAdmissionPartCDTO["medicines"][number];

interface PartCMedicineDialogProps {
  medicine: Medicine;
  residentId?: string;
  isNew: boolean;
  onPatch: (patch: Partial<Medicine>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PartCMedicineDialog({
  medicine,
  residentId,
  isNew,
  onPatch,
  onSave,
  onCancel,
}: PartCMedicineDialogProps) {
  const [customTime, setCustomTime] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const isSingle = medicine.scheduleType === "single";
  const formValue = medicine.form ?? medicine.route ?? "";
  const formOptions: string[] = [...MEDICATION_FORMS];
  if (formValue && !formOptions.includes(formValue)) formOptions.push(formValue);
  const hasSchedule = isSingle
    ? Boolean(medicine.scheduledTime)
    : Boolean(
        medicine.startDate &&
          medicine.endDate &&
          medicine.startDate <= medicine.endDate &&
          medicine.times?.length,
      );
  const isValid =
    Boolean(medicine.name.trim()) &&
    Boolean(medicine.dose?.trim()) &&
    Boolean(formValue) &&
    (!medicine.scheduleType || hasSchedule);

  const toggleTime = (time: string) => {
    const times = medicine.times ?? [];
    onPatch({
      times: times.includes(time)
        ? times.filter((item) => item !== time)
        : [...times, time].sort(),
    });
  };

  const addCustomTime = () => {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      setScheduleError("Please enter a valid time in HH:mm format");
      return;
    }
    if (!(medicine.times ?? []).includes(customTime)) {
      onPatch({ times: [...(medicine.times ?? []), customTime].sort() });
    }
    setCustomTime("");
    setScheduleError(null);
  };

  const toggleObservation = (id: string) => {
    const observations = medicine.mandatoryObservations ?? [];
    onPatch({
      mandatoryObservations: observations.includes(id)
        ? observations.filter((item) => item !== id)
        : [...observations, id],
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        size="2xl"
        className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {isNew ? "Add medicine" : "Edit medicine"}
          </DialogTitle>
          <DialogDescription className="text-md text-slate-500">
            Record medication details for pre-admission. This will not create an
            active MAR prescription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <FieldGrid cols={2}>
            <TextField
              label="Medication / Drug Name"
              required
              placeholder="e.g. Paracetamol, Amlodipine"
              value={medicine.name}
              errorMessage={!medicine.name.trim() ? "Medicine name is required" : undefined}
              onChange={(value) => onPatch({ name: value })}
            />
            <TextField
              label="Prescribed Dose"
              required
              placeholder="e.g. 500mg, 10ml, 1 Tablet"
              value={medicine.dose}
              errorMessage={!medicine.dose?.trim() ? "Dose is required" : undefined}
              onChange={(value) => onPatch({ dose: value })}
            />
            <SelectField
              label="Form / Route"
              required
              value={formValue}
              options={formOptions}
              placeholder="Select form / route"
              errorMessage={!formValue ? "Form / route is required" : undefined}
              onChange={(value) => onPatch({ form: value, route: value })}
            />
            <TextField
              label="Frequency"
              placeholder="e.g. Twice daily"
              value={medicine.frequency}
              onChange={(value) => onPatch({ frequency: value })}
            />
            <TextField
              label="Timing"
              placeholder="e.g. With breakfast, At bedtime"
              value={medicine.timing}
              onChange={(value) => onPatch({ timing: value })}
            />
            <TextField
              label="Prescriber"
              placeholder="e.g. Dr. Evans (GP)"
              value={medicine.prescriber}
              onChange={(value) => onPatch({ prescriber: value })}
            />
            <CheckField
              label="When needed (PRN)"
              checked={medicine.prn}
              onChange={(value) => onPatch({ prn: value })}
            />
            {medicine.prn && (
              <TextField
                label="Max doses per day"
                type="number"
                min={1}
                max={24}
                placeholder="e.g. 4"
                value={medicine.prnMaxPerDay?.toString()}
                onChange={(value) =>
                  onPatch({ prnMaxPerDay: value ? Number(value) : null })
                }
              />
            )}
          </FieldGrid>

          <div className="space-y-1.5">
            <label className="text-md font-medium text-slate-700">
              Schedule Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={!isSingle ? "primary" : "outline"}
                onClick={() => onPatch({ scheduleType: "recurring" })}
              >
                Daily Recurring
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isSingle ? "primary" : "outline"}
                onClick={() => onPatch({ scheduleType: "single" })}
              >
                Single Time
              </Button>
            </div>
          </div>

          <TextAreaField
            label="Administration Instructions / Precautions"
            value={medicine.instructions}
            placeholder="e.g. Take with a full glass of water after food. Do not crush or chew."
            onChange={(value) => onPatch({ instructions: value })}
          />

          {residentId ? (
            <MedicationImageUploader
              residentId={residentId}
              imageUrls={medicine.imageUrls ?? []}
              onChange={(imageUrls) => onPatch({ imageUrls })}
            />
          ) : (
            <p className="text-md text-slate-500">
              Save admission details first to attach medication images.
            </p>
          )}

          <MedicationScheduleSection
            isBulk={!isSingle}
            startDate={medicine.startDate ?? ""}
            setStartDate={(startDate) => onPatch({ startDate })}
            endDate={medicine.endDate ?? ""}
            setEndDate={(endDate) => onPatch({ endDate })}
            selectedTimes={medicine.times ?? []}
            toggleTime={toggleTime}
            customTime={customTime}
            setCustomTime={setCustomTime}
            handleAddCustomTime={addCustomTime}
            scheduledDateTime={medicine.scheduledTime ?? ""}
            setScheduledDateTime={(scheduledTime) =>
              onPatch({ scheduledTime, scheduleType: "single" })
            }
            mandatoryObservations={medicine.mandatoryObservations ?? []}
            toggleObservation={toggleObservation}
          />

          {scheduleError && (
            <p className="text-md font-medium text-red-600">{scheduleError}</p>
          )}
          {medicine.scheduleType && !hasSchedule && (
            <p className="text-md font-medium text-red-600">
              {isSingle
                ? "Select a scheduled date and time."
                : medicine.startDate &&
                    medicine.endDate &&
                    medicine.startDate > medicine.endDate
                  ? "End date must be on or after the start date."
                  : "Select start and end dates and at least one administration time."}
            </p>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={!isValid} onClick={onSave}>
            {isNew ? "Add medicine" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
