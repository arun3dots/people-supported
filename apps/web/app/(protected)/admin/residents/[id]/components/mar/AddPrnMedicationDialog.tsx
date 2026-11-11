"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Pill, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
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
  useAdministerAdHocMedicationMutation,
} from "../../../../../../../lib/queries/residents";
import { PrnDirectAdminFields } from "./PrnDirectAdminFields";
import { MedicationImageUploader } from "./MedicationImageUploader";

interface AddPrnMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName?: string;
  initialDrugName?: string;
  initialDose?: string;
  initialForm?: string;
}

const COMMON_PRN_FORMS = [
  "Tablet", "Capsule", "Liquid / Syrup", "Inhaler",
  "Topical Gel / Cream", "Injection (SC/IM)", "Eye Drops", "Sublingual Spray",
];

const COMMON_INDICATIONS = [
  "Mild to Moderate Pain Relief", "Severe Pain / Breakthrough",
  "Anxiety / Agitation / PRN Calming", "Breathlessness / Inhaler Relief",
  "Pyrexia / Fever Reduction", "Nausea / Antiemetic",
  "Constipation / Laxative", "Allergic Reaction / Antihistamine",
];

const AddPrnMedicationSchema = z.object({
  drugName: z.string().trim().min(1, "PRN medication name is required"),
  dose: z.string().trim().min(1, "Single dose is required (e.g. 500mg, 2 Puffs)"),
  form: z.string().min(1, "Please select a form / route"),
  indication: z.string().min(1, "Please select a clinical indication"),
});

export function AddPrnMedicationDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
  initialDrugName = "",
  initialDose = "",
  initialForm = "",
}: AddPrnMedicationDialogProps): React.JSX.Element {
  const createRoundMutation = useCreateMedicationRoundMutation();
  const administerAdhocMutation = useAdministerAdHocMedicationMutation();

  const [mode, setMode] = useState<"prescribe" | "administer">("prescribe");
  const [drugName, setDrugName] = useState(initialDrugName);
  const [dose, setDose] = useState(initialDose);
  const [form, setForm] = useState(initialForm);
  const [indication, setIndication] = useState("");
  const [instructions, setInstructions] = useState("Take 1-2 doses every 4 to 6 hours as needed. Max 4 doses in 24 hours.");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Direct administration fields
  const [status, setStatus] = useState<"Given" | "Refused" | "Omitted" | "NPO">("Given");
  const [adminReason, setAdminReason] = useState("");
  const [pulse, setPulse] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSubmitting = createRoundMutation.isPending || administerAdhocMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = AddPrnMedicationSchema.safeParse({ drugName, dose, form, indication });
    if (!validation.success) {
      const issues: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !issues[key]) issues[key] = issue.message;
      }
      setFieldErrors(issues);
      return;
    }

    try {
      if (mode === "prescribe") {
        await createRoundMutation.mutateAsync({
          residentId,
          data: {
            drugName: drugName.trim(),
            dose: dose.trim(),
            form: `${form} (PRN)`,
            instructions: instructions.trim() || undefined,
            imageUrls,
            scheduledTime: new Date().toISOString(),
            allowLateAdministration: true,
            isAdhoc: true,
          },
        });
      } else {
        const vitalsObj: Record<string, unknown> = {};
        if (pulse) vitalsObj.pulse = pulse;
        if (bloodSugar) vitalsObj.bloodSugar = bloodSugar;
        if (temp) vitalsObj.temp = temp;
        if (spo2) vitalsObj.spo2 = spo2;

        await administerAdhocMutation.mutateAsync({
          residentId,
          data: {
            drugName: drugName.trim(),
            dose: dose.trim(),
            form,
            instructions: instructions.trim() || undefined,
            imageUrls,
            status,
            reason: adminReason.trim() || `${indication}: ${instructions}`,
            vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
          },
        });
      }

      onOpenChange(false);
      setDrugName("");
      setDose("");
      setImageUrls([]);
      setAdminReason("");
      setPulse("");
      setBloodSugar("");
      setTemp("");
      setSpo2("");
      setFieldErrors({});
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj?.message || "Failed to process PRN medication");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <Pill className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">PRN (As Needed) Medication</DialogTitle>
              <DialogDescription className="text-[12px] text-slate-500">Manage on-demand PRN medications for {residentName || "this resident"}.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl">
          <Button type="button" variant={mode === "prescribe" ? "primary" : "ghost"} size="sm" onClick={() => setMode("prescribe")} className="rounded-xl text-md font-semibold h-9 shadow-none gap-1.5">
            <Sparkles className="size-3.5" /> Prescribe PRN Protocol
          </Button>
          <Button type="button" variant={mode === "administer" ? "primary" : "ghost"} size="sm" onClick={() => setMode("administer")} className="rounded-xl text-md font-semibold h-9 shadow-none gap-1.5">
            <CheckCircle2 className="size-3.5" /> Log PRN Dose Given
          </Button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-md font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>PRN Medication Name</Label>
              <Input
                placeholder="e.g. Paracetamol, Salbutamol, Lorazepam"
                value={drugName}
                onChange={(e) => {
                  setDrugName(e.target.value);
                  if (fieldErrors.drugName) setFieldErrors((prev) => ({ ...prev, drugName: "" }));
                }}
                errorMessage={fieldErrors.drugName}
              />
            </div>
            <div className="space-y-1">
              <Label required>Single Dose</Label>
              <Input
                placeholder="e.g. 500mg - 1000mg, 2 Puffs"
                value={dose}
                onChange={(e) => {
                  setDose(e.target.value);
                  if (fieldErrors.dose) setFieldErrors((prev) => ({ ...prev, dose: "" }));
                }}
                errorMessage={fieldErrors.dose}
              />
            </div>
          </div>

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
                  {COMMON_PRN_FORMS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.form && (
                <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">{fieldErrors.form}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label required>Clinical Indication</Label>
              <Select
                value={indication || undefined}
                onValueChange={(val) => {
                  setIndication(val);
                  if (fieldErrors.indication) setFieldErrors((prev) => ({ ...prev, indication: "" }));
                }}
              >
                <SelectTrigger className={cn(fieldErrors.indication && "border-red-500")}>
                  <SelectValue placeholder="Select clinical indication" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_INDICATIONS.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.indication && (
                <p className="text-sm text-text-error font-medium min-h-[18px] mt-1">{fieldErrors.indication}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>PRN Protocol / Dosing Limits</Label>
            <Textarea
              rows={2}
              placeholder="e.g. 1-2 tablets every 4 hours as required for fever. Max 4 doses in 24 hours."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <MedicationImageUploader
            residentId={residentId}
            imageUrls={imageUrls}
            onChange={setImageUrls}
          />

          {mode === "administer" && (
            <PrnDirectAdminFields
              status={status}
              setStatus={setStatus}
              adminReason={adminReason}
              setAdminReason={setAdminReason}
              pulse={pulse}
              setPulse={setPulse}
              bloodSugar={bloodSugar}
              setBloodSugar={setBloodSugar}
              temp={temp}
              setTemp={setTemp}
              spo2={spo2}
              setSpo2={setSpo2}
            />
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : mode === "prescribe" ? "Prescribe PRN Protocol" : "Confirm & Record Dose"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
