"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@repo/ui/components/ui/Dialog";
import { Button } from "@repo/ui/components/ui/Button";
import { Input } from "@repo/ui/components/ui/Input";
import { Label } from "@repo/ui/components/ui/Label";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/Select";
import { Activity, HeartPulse, AlertCircle } from "lucide-react";
import { DatePicker } from "@repo/ui/components/ui";
import {
  useUpsertHealthMutation,
  useCreateImmunisationMutation,
  useUpdateImmunisationMutation,
  useUploadComplianceDocumentMutation,
  type HealthRecord,
  type ImmunisationRecord,
} from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { useToast } from "@repo/ui/hooks";
import { FileUploadField } from "./FileUploadField";
import { cn } from "@repo/ui/lib/utils";

// ──────────────── Health Clearance Form ────────────────

const healthSchema = z.object({
  clearanceDate: z.string().optional(),
  nextAssessmentDate: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  assessedBy: z.string().optional(),
  outcome: z.string().optional(),
  restrictions: z.string().optional(),
  notes: z.string().optional(),
});

type HealthFormValues = z.infer<typeof healthSchema>;

interface HealthClearanceFormProps {
  staffId: string;
  staffName: string;
  existing?: HealthRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HealthClearanceForm({
  staffId,
  staffName,
  existing,
  open,
  onOpenChange,
}: HealthClearanceFormProps) {
  const { toast } = useToast();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const parseExisting = (record?: HealthRecord | null) => {
    const rawNotes = record?.notes || "";
    const nextAssMatch = rawNotes.match(/\[NextAssessment:\s*(.+?)\]/);
    const assessedByMatch = rawNotes.match(/\[AssessedBy:\s*(.+?)\]/);
    const outcomeMatch = rawNotes.match(/\[Outcome:\s*(.+?)\]/);
    const restrictionsMatch = rawNotes.match(/\[Restrictions:\s*(.+?)\]/);
    const userNotesOnly = rawNotes.replace(/\[(NextAssessment|AssessedBy|Outcome|Restrictions|Document):[^\]]+\]/g, "").trim();

    return {
      clearanceDate: record?.clearanceDate?.substring(0, 10) || "",
      nextAssessmentDate: record?.nextAssessmentDate?.substring(0, 10) || (nextAssMatch ? nextAssMatch[1] : ""),
      status: record?.status || "",
      assessedBy: record?.assessedBy || (assessedByMatch ? assessedByMatch[1] : ""),
      outcome: record?.outcome || (outcomeMatch ? outcomeMatch[1] : ""),
      restrictions: record?.restrictions || (restrictionsMatch ? restrictionsMatch[1] : ""),
      notes: userNotesOnly,
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: parseExisting(existing),
  });

  const statusValue = watch("status");
  const clearanceDateValue = watch("clearanceDate");
  const nextAssessmentDateValue = watch("nextAssessmentDate");

  useEffect(() => {
    if (open) {
      reset(parseExisting(existing));
      setDocumentFile(null);
    }
  }, [existing, open, reset]);

  const mutation = useUpsertHealthMutation(staffId);
  const uploadMutation = useUploadComplianceDocumentMutation(staffId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onFormSubmit = async (data: HealthFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const metaTags: string[] = [];
    if (data.nextAssessmentDate) metaTags.push(`[NextAssessment:${data.nextAssessmentDate}]`);
    if (data.assessedBy) metaTags.push(`[AssessedBy:${data.assessedBy}]`);
    if (data.outcome) metaTags.push(`[Outcome:${data.outcome}]`);
    if (data.restrictions) metaTags.push(`[Restrictions:${data.restrictions}]`);

    const cleanUserNotes = (data.notes || "").replace(/\[(NextAssessment|AssessedBy|Outcome|Restrictions|Document):[^\]]+\]/g, "").trim();
    const finalNotes = [cleanUserNotes, ...metaTags].filter(Boolean).join("\n");

    try {
      await mutation.mutateAsync({
        status: data.status,
        clearanceDate: data.clearanceDate || undefined,
        notes: finalNotes || undefined,
      });
      if (documentFile) {
        await uploadMutation.mutateAsync({ file: documentFile, domain: "health" });
      }
      toast({
        title: "Success",
        description: documentFile
          ? "Health clearance and document saved successfully"
          : "Health clearance saved successfully",
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save health clearance";
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || mutation.isPending || uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !isPending) onOpenChange(false); }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Occupational Health Clearance — {staffName}
          </DialogTitle>
          <DialogDescription>
            Record occupational health clearance, assessment dates, assessor details, and restrictions.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Clearance Date</Label>
              <DatePicker
                value={clearanceDateValue}
                onChange={(d) => setValue("clearanceDate", d ? format(d, "yyyy-MM-dd") : "")}
                maxDate={new Date()}
                placeholder="Select clearance date..."
                errorMessage={errors.clearanceDate?.message}
              />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            <div className="space-y-1.5">
              <Label>Next Assessment Due</Label>
              <DatePicker
                value={nextAssessmentDateValue}
                onChange={(d) => setValue("nextAssessmentDate", d ? format(d, "yyyy-MM-dd") : "")}
                minDate={new Date()}
                placeholder="Select next due date..."
                errorMessage={errors.nextAssessmentDate?.message}
              />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label required>Overall Status</Label>
              <Select value={statusValue} onValueChange={(val) => setValue("status", val, { shouldValidate: true })}>
                <SelectTrigger className={cn(errors.status && "border-rose-500")}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleared">Cleared (Fit to Work)</SelectItem>
                  <SelectItem value="Pending">Pending Assessment</SelectItem>
                  <SelectItem value="Restricted">Restricted / Adjustments Needed</SelectItem>
                </SelectContent>
              </Select>

              {errors.status?.message && (
                <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
              )}
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            <div className="space-y-1.5">
              <Label>Assessed By</Label>
              <Input {...register("assessedBy")} placeholder="e.g. Dr. Sarah Jenkins (OH Provider)" errorMessage={errors.assessedBy?.message} />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Input {...register("outcome")} placeholder="e.g. Fit to Work / Fit with Adjustments" errorMessage={errors.outcome?.message} />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            <div className="space-y-1.5">
              <Label>Work Restrictions</Label>
              <Input {...register("restrictions")} placeholder="e.g. Max 10kg lifting, no night shifts" errorMessage={errors.restrictions?.message} />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes & Summary</Label>
            <Textarea {...register("notes")} placeholder="e.g. Health assessment completed with no issues reported" rows={3} errorMessage={errors.notes?.message} />
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Document Upload */}
          <div className="border-t border-border pt-4">
            <FileUploadField
              label="Health Clearance Document"
              onFileSelect={setDocumentFile}
              existingUrl={existing?.documentUrl}
              staffId={staffId}
              documentTitle={`Health Clearance — ${staffName}`}
              helpText="Upload occupational health assessment or clearance letter (PDF, JPG, PNG up to 10MB)"
            />
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (documentFile ? "Uploading & Saving..." : "Saving...")
                : "Save Health Clearance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────── Immunisation Form ────────────────

const immunisationSchema = z.object({
  name: z.string().min(1, "Immunisation name is required"),
  dateAdministered: z.string().min(1, "Date administered is required"),
  nextDueDate: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type ImmunisationFormValues = z.infer<typeof immunisationSchema>;

interface ImmunisationFormProps {
  staffId: string;
  staffName: string;
  existing?: ImmunisationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImmunisationForm({
  staffId,
  staffName,
  existing,
  open,
  onOpenChange,
}: ImmunisationFormProps) {
  const { toast } = useToast();
  const isEdit = !!existing;

  const parseExisting = (record?: ImmunisationRecord | null) => {
    const rawStatus = record?.status || "";
    const nextDueMatch = rawStatus.match(/\[NextDue:\s*(.+?)\]/) || record?.name?.match(/\[NextDue:\s*(.+?)\]/);
    const existingNextDue = record?.nextDueDate || (nextDueMatch ? nextDueMatch[1] : "");
    const cleanStatus = rawStatus.replace(/\[NextDue:\s*.+?\]/g, "").trim();

    return {
      name: record?.name?.replace(/\[NextDue:\s*.+?\]/g, "").trim() || "",
      dateAdministered: record?.dateAdministered?.substring(0, 10) || "",
      nextDueDate: existingNextDue ? existingNextDue.substring(0, 10) : "",
      status: cleanStatus || "",
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ImmunisationFormValues>({
    resolver: zodResolver(immunisationSchema),
    defaultValues: parseExisting(existing),
  });

  const statusValue = watch("status");
  const dateAdministeredValue = watch("dateAdministered");
  const nextDueDateValue = watch("nextDueDate");

  useEffect(() => {
    if (open) {
      reset(parseExisting(existing));
    }
  }, [existing, open, reset]);

  const createMutation = useCreateImmunisationMutation(staffId, {
    onSuccess: () => {
      toast({ title: "Success", description: "Immunisation record added" });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message || "Failed to add immunisation" }),
  });

  const updateMutation = useUpdateImmunisationMutation(staffId, {
    onSuccess: () => {
      toast({ title: "Success", description: "Immunisation record updated" });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update immunisation" }),
  });

  const onFormSubmit = (data: ImmunisationFormValues) => {
    const finalName = data.nextDueDate
      ? `${data.name} [NextDue: ${data.nextDueDate}]`
      : data.name;

    const payload = {
      name: finalName,
      dateAdministered: data.dateAdministered,
      status: data.status,
    };

    if (isEdit && existing) {
      updateMutation.mutate({ immId: existing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            {isEdit ? "Edit" : "Add"} Immunisation — {staffName}
          </DialogTitle>
          <DialogDescription>
            Record the immunisation details for this staff member.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label required>Immunisation Name</Label>
            <Input
              {...register("name")}
              placeholder="e.g. Hepatitis B, COVID-19, Flu"
              errorMessage={errors.name?.message}
            />
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label required>Date Administered</Label>
              <DatePicker
                value={dateAdministeredValue}
                onChange={(d) => setValue("dateAdministered", d ? format(d, "yyyy-MM-dd") : "")}
                maxDate={new Date()}
                placeholder="Select date administered..."
                errorMessage={errors.dateAdministered?.message}
              />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            <div className="space-y-1.5">
              <Label>Next Due Date</Label>
              <DatePicker
                value={nextDueDateValue}
                onChange={(d) => setValue("nextDueDate", d ? format(d, "yyyy-MM-dd") : "")}
                minDate={new Date()}
                placeholder="Select next due date..."
                errorMessage={errors.nextDueDate?.message}
              />
              {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label required>Status</Label>
            <Select value={statusValue} onValueChange={(val) => setValue("status", val, { shouldValidate: true })}>
              <SelectTrigger className={cn(errors.status && "border-rose-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Up to date">Up to date</SelectItem>
                <SelectItem value="Requires Booster">Requires Booster</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}

            {errors.status?.message && (
              <p className="text-sm text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update" : "Add Immunisation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
