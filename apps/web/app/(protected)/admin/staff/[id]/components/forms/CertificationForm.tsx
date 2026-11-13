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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/Select";
import { Award, Loader2 } from "lucide-react";
import { DatePicker } from "@repo/ui/components/ui";
import {
  useCreateCertificationMutation,
  useUpdateCertificationMutation,
  useUploadComplianceDocumentMutation,
  type CertificationRecord,
} from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { useToast } from "@repo/ui/hooks";
import { FileUploadField } from "./FileUploadField";
import { cn } from "@repo/ui/lib/utils";

const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  skills: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  status: z.string().min(1, "Status is required"),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

interface CertificationFormProps {
  staffId: string;
  staffName: string;
  existing?: CertificationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificationForm({
  staffId,
  staffName,
  existing,
  open,
  onOpenChange,
}: CertificationFormProps) {
  const { toast } = useToast();
  const isEdit = !!existing;
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: existing?.name || "",
      skills: existing?.skills ? existing?.skills.join(", ") : "",
      issueDate: existing?.issueDate?.substring(0, 10) || "",
      expiryDate: existing?.expiryDate?.substring(0, 10) || "",
      status: (existing?.status as any) || "",
    },
  });

  const statusValue = watch("status");
  const issueDateValue = watch("issueDate");
  const expiryDateValue = watch("expiryDate");

  // Sync form with existing record when it changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: existing?.name || "",
        skills: existing?.skills ? existing?.skills.join(", ") : "",
        issueDate: existing?.issueDate?.substring(0, 10) || "",
        expiryDate: existing?.expiryDate?.substring(0, 10) || "",
        status: (existing?.status as any) || "",
      });
      setDocumentFile(null);
      setIsSubmitting(false);
    }
  }, [existing, open, reset]);

  const createMutation = useCreateCertificationMutation(staffId);
  const updateMutation = useUpdateCertificationMutation(staffId);
  const uploadMutation = useUploadComplianceDocumentMutation(staffId);

  const onFormSubmit = async (data: CertificationFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let certId = existing?.id;

      const skillsArray = data.skills
        ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const payload = {
        name: data.name,
        skills: skillsArray,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        status: data.status,
      };

      if (isEdit && existing) {
        await updateMutation.mutateAsync({ certId: existing.id, data: payload as any });
      } else {
        const responseData: any = await createMutation.mutateAsync(payload as any);
        certId = responseData?.id;
      }

      if (documentFile && certId) {
        await uploadMutation.mutateAsync({
          file: documentFile,
          domain: "certification",
          certId,
        });
      }

      toast({
        title: "Success",
        description: isEdit
          ? (documentFile ? "Certification and document updated successfully" : "Certification updated successfully")
          : (documentFile ? "Certification and document uploaded successfully" : "Certification added successfully"),
      });

      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save certification or upload document",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !isPending) onOpenChange(false); }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {isEdit ? "Edit" : "Add"} Certification — {staffName}
          </DialogTitle>
          <DialogDescription className="text-md">
            Record a mandatory NHS/CQC training module or certification.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label required>
              Training / Certification Name
            </Label>
            <Input
              {...register("name")}
              placeholder="e.g. Safeguarding Adults (Level 2)"
              errorMessage={errors.name?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Skills</Label>
            <Input
              {...register("skills")}
              placeholder="e.g. First Aid, CPR, Medication Administration"
              errorMessage={errors.skills?.message}
            />
            <p className="text-md text-muted-foreground">
              Enter skills separated by commas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label required>
                Issue Date
              </Label>
              <DatePicker
                value={issueDateValue}
                onChange={(d) => setValue("issueDate", d ? format(d, "yyyy-MM-dd") : "")}
                maxDate={new Date()}
                placeholder="Select issue date..."
                errorMessage={errors.issueDate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label required>
                Expiry Date
              </Label>
              <DatePicker
                value={expiryDateValue}
                onChange={(d) => setValue("expiryDate", d ? format(d, "yyyy-MM-dd") : "")}
                minDate={new Date()}
                placeholder="Select expiry date..."
                errorMessage={errors.expiryDate?.message}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required>Status</Label>
            <Select
              value={statusValue}
              onValueChange={(val) => setValue("status", val as any, { shouldValidate: true })}
            >
              <SelectTrigger className={cn(errors.status && "border-rose-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Valid">Valid</SelectItem>
                <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {errors.status?.message && (
              <p className="text-md text-rose-500 mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Document Upload */}
          <div className="border-t border-border pt-4">
            <FileUploadField
              label="Certificate Document"
              existingUrl={existing?.certificateUrl}
              onFileSelect={setDocumentFile}
              staffId={staffId}
              documentTitle={existing?.name || "Certificate Document"}
              helpText="Upload training certificate or qualification proof (PDF, JPG, PNG up to 10MB)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending
                ? (documentFile ? "Uploading & Saving..." : "Saving...")
                : isEdit
                  ? "Update Certification"
                  : "Add Certification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
