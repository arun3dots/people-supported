"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { z } from "zod";
import {
  Pill,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HeartPulse,
  Clock,
  AlertCircle,
  Info,
  Eye,
} from "lucide-react";
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
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { useAdministerMedicationMutation } from "../../../../../../../lib/queries/residents";

interface AdministerMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: {
    id: string;
    drugName: string;
    dose: string;
    form?: string;
    instructions?: string;
    imageUrls?: string[];
    scheduledTime?: string;
    mandatoryObservations?: string[];
  } | null;
  residentId: string;
}

const AdministerMedicationSchema = z
  .object({
    status: z.enum(["Given", "Refused", "Not Available", "NPO"]),
    reason: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status !== "Given" && (!val.reason || !val.reason.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: `Clinical rationale is required when status is '${val.status}'`,
      });
    }
  });

export function AdministerMedicationDialog({
  open,
  onOpenChange,
  round,
  residentId,
}: AdministerMedicationDialogProps): React.JSX.Element {
  const administerMutation = useAdministerMedicationMutation();
  const [status, setStatus] = useState<"Given" | "Refused" | "Not Available" | "NPO">("Given");
  const [reason, setReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Vitals
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!round) return <></>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = AdministerMedicationSchema.safeParse({ status, reason });
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
      const vitalsObj: Record<string, unknown> = {};
      if (bpSystolic) vitalsObj.bpSystolic = bpSystolic;
      if (bpDiastolic) vitalsObj.bpDiastolic = bpDiastolic;
      if (pulse) vitalsObj.pulse = pulse;
      if (temp) vitalsObj.temp = temp;
      if (spo2) vitalsObj.spo2 = spo2;
      if (bloodSugar) vitalsObj.bloodSugar = bloodSugar;

      await administerMutation.mutateAsync({
        roundId: round.id,
        status: status as "Given" | "Refused" | "Not Available",
        reason: reason.trim() || undefined,
        residentId,
        vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
      });

      onOpenChange(false);
      setReason("");
      setStatus("Given");
      setFieldErrors({});
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj?.message || "Failed to record administration");
    }
  };

  const images = round.imageUrls || [];
  const obsInputs = [
    { label: "BP Systolic", val: bpSystolic, set: setBpSystolic, ph: "120" },
    { label: "BP Diastolic", val: bpDiastolic, set: setBpDiastolic, ph: "80" },
    { label: "Pulse (bpm)", val: pulse, set: setPulse, ph: "72" },
    { label: "Temp (°C)", val: temp, set: setTemp, ph: "36.8", step: "0.1" },
    { label: "SpO2 (%)", val: spo2, set: setSpo2, ph: "98" },
    { label: "Blood Sugar", val: bloodSugar, set: setBloodSugar, ph: "5.5", step: "0.1" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="bg-white rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Pill className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Administer Medication</DialogTitle>
              <DialogDescription className="text-md text-slate-500">Record round outcome and vitals.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-md font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Text size="lg" weight="bold" className="text-slate-900">{round.drugName}</Text>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900 text-md">{round.dose}</Badge>
                {round.form && <Badge variant="secondary" className="text-md">{round.form}</Badge>}
              </div>
              {round.scheduledTime && (
                <div className="flex items-center gap-1.5 text-slate-500 text-md mt-1">
                  <Clock className="size-3.5" />
                  <span>Scheduled: {format(new Date(round.scheduledTime), "dd MMM yyyy 'at' HH:mm")}</span>
                </div>
              )}
            </div>
            {images.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {images.slice(0, 2).map((img, idx) => (
                  <div key={idx} onClick={() => setPreviewImage(img)} className="size-12 rounded-lg border border-slate-200 overflow-hidden relative cursor-pointer group shadow-2xs hover:border-emerald-500">
                    <img src={img} alt="Medication" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="size-3.5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {round.instructions && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-md">
              <Info className="size-4 shrink-0 mt-0.5 text-amber-700" />
              <span>{round.instructions}</span>
            </div>
          )}
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label required>Administration Outcome</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button type="button" variant={status === "Given" ? "primary" : "outline"} size="sm" onClick={() => { setStatus("Given"); if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: "" })); }} className="gap-1.5 h-10">
                <CheckCircle2 className="size-4" /> Given
              </Button>
              <Button type="button" variant={status === "Refused" ? "destructive" : "outline"} size="sm" onClick={() => setStatus("Refused")} className="gap-1.5 h-10">
                <XCircle className="size-4" /> Refused
              </Button>
              <Button type="button" variant={status === "Not Available" ? "destructive" : "outline"} size="sm" onClick={() => setStatus("Not Available")} className="gap-1.5 h-10">
                <AlertTriangle className="size-4" /> Omitted
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setStatus("NPO")} className={`gap-1.5 h-10 ${status === "NPO" ? "border-amber-500 bg-amber-50 text-amber-900 font-bold" : ""}`}>
                NPO
              </Button>
            </div>
          </div>

          {status !== "Given" && (
            <div className="space-y-1">
              <Label required>Clinical Reason / Rationale for '{status}'</Label>
              <Textarea
                rows={2}
                placeholder="Detail why medication was refused/omitted..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: "" }));
                }}
                errorMessage={fieldErrors.reason}
              />
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="flex items-center gap-1.5 font-semibold text-slate-900">
              <HeartPulse className="size-4 text-emerald-800" /> Pre-Administration Observations (Optional)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {obsInputs.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <Label>{item.label}</Label>
                  <Input placeholder={item.ph} value={item.val} onChange={(e) => item.set(e.target.value)} type="number" step={item.step} />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant={status === "Given" ? "primary" : "destructive"} disabled={administerMutation.isPending}>
              {administerMutation.isPending ? "Recording..." : `Confirm ${status}`}
            </Button>
          </DialogFooter>
        </form>

        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent size="lg" className="p-2 bg-black/95 border-none flex flex-col items-center justify-center">
              <img src={previewImage} alt="Packaging Large" className="max-h-[80vh] w-auto rounded-lg object-contain" />
              <Button variant="ghost" size="sm" className="text-white mt-2" onClick={() => setPreviewImage(null)}>Close Full Preview</Button>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
