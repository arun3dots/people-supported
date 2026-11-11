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
import { Switch } from "@repo/ui/components/ui/Switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/Select";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { DatePicker } from "@repo/ui/components/ui";
import { useUpsertDbsMutation, useUploadComplianceDocumentMutation, type DbsRecord } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { useToast } from "@repo/ui/hooks";
import { FileUploadField } from "./FileUploadField";
import { cn } from "@repo/ui/lib/utils";

const dbsSchema = z.object({
  certificateNumber: z.string().min(1, "Certificate number is required"),
  type: z.string().min(1, "DBS type is required"),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  updateService: z.boolean(),
  status: z.string().min(1, "Status is required"),
});

type DbsFormValues = z.infer<typeof dbsSchema>;

interface DbsVerificationFormProps {
  staffId: string;
  staffName: string;
  existing?: DbsRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DbsVerificationForm({
  staffId,
  staffName,
  existing,
  open,
  onOpenChange,
}: DbsVerificationFormProps) {
  const { toast } = useToast();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DbsFormValues>({
    resolver: zodResolver(dbsSchema),
    defaultValues: {
      certificateNumber: existing?.certificateNumber || "",
      type: existing?.type || "",
      issueDate: existing?.issueDate?.substring(0, 10) || "",
      expiryDate: existing?.expiryDate?.substring(0, 10) || "",
      updateService: existing?.updateService ?? false,
      status: existing?.status || "",
    },
  });

  const typeValue = watch("type");
  const statusValue = watch("status");
  const updateServiceValue = watch("updateService");
  const issueDateValue = watch("issueDate");
  const expiryDateValue = watch("expiryDate");

  useEffect(() => {
    if (open) {
      reset({
        certificateNumber: existing?.certificateNumber || "",
        type: existing?.type || "",
        issueDate: existing?.issueDate?.substring(0, 10) || "",
        expiryDate: existing?.expiryDate?.substring(0, 10) || "",
        updateService: existing?.updateService ?? false,
        status: existing?.status || "",
      });
      setDocumentFile(null);
    }
  }, [existing, open, reset]);

  const mutation = useUpsertDbsMutation(staffId);
  const uploadMutation = useUploadComplianceDocumentMutation(staffId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onFormSubmit = async (data: DbsFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync({
        ...data,
        issueDate: data.issueDate || undefined,
        expiryDate: data.expiryDate || undefined,
      });
      if (documentFile) {
        await uploadMutation.mutateAsync({ file: documentFile, domain: "dbs" });
      }
      toast({
        title: "Success",
        description: documentFile
          ? "DBS check and certificate document saved successfully"
          : "DBS check saved successfully",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save DBS check",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || mutation.isPending || uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            DBS Check — {staffName}
          </DialogTitle>
          <DialogDescription>
            Record the Disclosure and Barring Service check details.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label required>
                Certificate Number
              </Label>
              <Input
                {...register("certificateNumber")}
                placeholder="001234567890"
                errorMessage={errors.certificateNumber?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label required>DBS Type</Label>
              <Select value={typeValue} onValueChange={(val) => setValue("type", val, { shouldValidate: true })}>
                <SelectTrigger className={cn(errors.type && "border-rose-500")}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Enhanced">Enhanced</SelectItem>
                  <SelectItem value="Enhanced with Barred List">Enhanced with Barred List</SelectItem>
                </SelectContent>
              </Select>
              {errors.type?.message && (
                <p className="text-md text-rose-500 mt-1">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Issue Date</Label>
              <DatePicker
                value={issueDateValue}
                onChange={(d) => setValue("issueDate", d ? format(d, "yyyy-MM-dd") : "")}
                maxDate={new Date()}
                placeholder="Select issue date..."
                errorMessage={errors.issueDate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry / Renewal Date</Label>
              <DatePicker
                value={expiryDateValue}
                onChange={(d) => setValue("expiryDate", d ? format(d, "yyyy-MM-dd") : "")}
                minDate={new Date()}
                placeholder="Select expiry date..."
                errorMessage={errors.expiryDate?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
            <div>
              <Label>DBS Update Service</Label>
              <p className="text-md text-muted-foreground mt-0.5">Is the staff member registered with the DBS Update Service?</p>
            </div>
            <Switch
              checked={updateServiceValue}
              onCheckedChange={(checked) => setValue("updateService", checked)}
            />
          </div>

          <div className="space-y-1.5">
            <Label required>Status</Label>
            <Select value={statusValue} onValueChange={(val) => setValue("status", val, { shouldValidate: true })}>
              <SelectTrigger className={cn(errors.status && "border-rose-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clear">Clear (Cleared)</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Action Required">Action Required</SelectItem>
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
              label="DBS Certificate Scan"
              existingUrl={existing?.documentUrl}
              onFileSelect={setDocumentFile}
              staffId={staffId}
              documentTitle={`DBS Certificate — ${staffName}`}
              helpText="Upload a scan of the DBS certificate (PDF, JPG, PNG up to 10MB)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (documentFile ? "Uploading & Saving..." : "Saving...")
                : "Save DBS Check"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
