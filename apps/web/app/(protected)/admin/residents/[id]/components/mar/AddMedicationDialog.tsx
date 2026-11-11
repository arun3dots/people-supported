"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { z } from "zod";
import { Pill, AlertCircle } from "lucide-react";
import { MEDICATION_FORMS } from "@repo/schema";
import { cn } from "@repo/ui/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import {
  useCreateMedicationRoundMutation,
  useCreateMedicationRoundBulkMutation,
} from "../../../../../../../lib/queries/residents";
import { MedicationScheduleSection } from "./MedicationScheduleSection";
import { MedicationImageUploader } from "./MedicationImageUploader";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName?: string;
}

const AddMedicationSchema = z.object({
  drugName: z.string().trim().min(1, "Medication name is required"),
  dose: z.string().trim().min(1, "Prescribed dose is required"),
  form: z.string().min(1, "Please select a form / route"),
});

export function AddMedicationDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
}: AddMedicationDialogProps): React.JSX.Element {
  const createMutation = useCreateMedicationRoundMutation();
  const createBulkMutation = useCreateMedicationRoundBulkMutation();

  const [drugName, setDrugName] = useState("");
  const [dose, setDose] = useState("");
  const [form, setForm] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isBulk, setIsBulk] = useState(true);

  // Single mode state
  const [scheduledDateTime, setScheduledDateTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'08:00")
  );

  // Recurring bulk mode state
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["08:00"]);
  const [customTime, setCustomTime] = useState("");

  const [allowLateAdministration] = useState(true);
  const [mandatoryObservations, setMandatoryObservations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSubmitting = createMutation.isPending || createBulkMutation.isPending;

  const toggleTime = (timeStr: string) => {
    if (selectedTimes.includes(timeStr)) {
      if (selectedTimes.length === 1) return;
      setSelectedTimes(selectedTimes.filter((t) => t !== timeStr));
    } else {
      setSelectedTimes([...selectedTimes, timeStr].sort());
    }
  };

  const handleAddCustomTime = () => {
    if (!customTime) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      setError("Please enter a valid time in HH:mm format");
      return;
    }
    if (!selectedTimes.includes(customTime)) {
      setSelectedTimes([...selectedTimes, customTime].sort());
    }
    setCustomTime("");
    setError(null);
  };

  const toggleObservation = (id: string) => {
    if (mandatoryObservations.includes(id)) {
      setMandatoryObservations(mandatoryObservations.filter((o) => o !== id));
    } else {
      setMandatoryObservations([...mandatoryObservations, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = AddMedicationSchema.safeParse({ drugName, dose, form });
    if (!validation.success) {
      const issues: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !issues[key]) {
          issues[key] = issue.message;
        }
      }
      setFieldErrors(issues);
      return;
    }

    try {
      if (isBulk) {
        if (selectedTimes.length === 0) {
          setError("Please select at least one administration time");
          return;
        }
        await createBulkMutation.mutateAsync({
          residentId,
          data: {
            drugName: drugName.trim(),
            dose: dose.trim(),
            form,
            instructions: instructions.trim() || undefined,
            imageUrls,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            times: selectedTimes,
            allowLateAdministration,
            mandatoryObservations,
          },
        });
      } else {
        await createMutation.mutateAsync({
          residentId,
          data: {
            drugName: drugName.trim(),
            dose: dose.trim(),
            form,
            instructions: instructions.trim() || undefined,
            imageUrls,
            scheduledTime: new Date(scheduledDateTime).toISOString(),
            allowLateAdministration,
            mandatoryObservations,
          },
        });
      }

      onOpenChange(false);
      setDrugName("");
      setDose("");
      setForm("");
      setInstructions("");
      setImageUrls([]);
      setSelectedTimes(["08:00"]);
      setFieldErrors({});
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj?.message || "Failed to prescribe medication");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Pill className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Prescribe Scheduled Medication (MAR)
              </DialogTitle>
              <DialogDescription className="text-md text-slate-500">
                Add scheduled routine medications to {residentName ? `${residentName}'s` : "the resident's"} active MAR.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-md font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drug Name & Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Medication / Drug Name</Label>
              <Input
                placeholder="e.g. Paracetamol, Amlodipine"
                value={drugName}
                onChange={(e) => {
                  setDrugName(e.target.value);
                  if (fieldErrors.drugName) setFieldErrors((prev) => ({ ...prev, drugName: "" }));
                }}
                errorMessage={fieldErrors.drugName}
              />
            </div>
            <div className="space-y-1">
              <Label required>Prescribed Dose</Label>
              <Input
                placeholder="e.g. 500mg, 10ml, 1 Tablet"
                value={dose}
                onChange={(e) => {
                  setDose(e.target.value);
                  if (fieldErrors.dose) setFieldErrors((prev) => ({ ...prev, dose: "" }));
                }}
                errorMessage={fieldErrors.dose}
              />
            </div>
          </div>

          {/* Form / Route & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Form / Route</Label>
              <Select
                value={form || undefined}
                onValueChange={(val) => {
                  setForm(val);
                  if (fieldErrors.form) setFieldErrors((prev) => ({ ...prev, form: "" }));
                }}
              >
                <SelectTrigger className={cn(fieldErrors.form && "border-red-500")}>
                  <SelectValue placeholder="Select form / route" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_FORMS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.form && (
                <p className="text-md text-text-error font-medium min-h-[18px] mt-1">
                  {fieldErrors.form}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Schedule Type</Label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={isBulk ? "primary" : "outline"}
                  onClick={() => setIsBulk(true)}
                  className="rounded-xl text-md font-semibold h-10 shadow-none"
                >
                  Daily Recurring
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!isBulk ? "primary" : "outline"}
                  onClick={() => setIsBulk(false)}
                  className="rounded-xl text-md font-semibold h-10 shadow-none"
                >
                  Single Time
                </Button>
              </div>
            </div>
          </div>

          {/* Administration Instructions */}
          <div className="space-y-1">
            <Label>Specific Instructions / Route Notes</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Take with a full glass of water with food. Do not crush."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Medication Images (Multiple) */}
          <MedicationImageUploader
            residentId={residentId}
            imageUrls={imageUrls}
            onChange={setImageUrls}
          />

          {/* Schedule Section Component */}
          <MedicationScheduleSection
            isBulk={isBulk}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            selectedTimes={selectedTimes}
            toggleTime={toggleTime}
            customTime={customTime}
            setCustomTime={setCustomTime}
            handleAddCustomTime={handleAddCustomTime}
            scheduledDateTime={scheduledDateTime}
            setScheduledDateTime={setScheduledDateTime}
            mandatoryObservations={mandatoryObservations}
            toggleObservation={toggleObservation}
          />

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Prescribing..." : isBulk ? "Prescribe Schedule" : "Add Medication Round"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
