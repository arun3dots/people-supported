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
import { Briefcase, ExternalLink, Globe, Fingerprint, AlertCircle } from "lucide-react";
import { DatePicker } from "@repo/ui/components/ui";
import { useUpsertRtwMutation, useUploadComplianceDocumentMutation, type RtwRecord } from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { useToast } from "@repo/ui/hooks";
import { FileUploadField } from "./FileUploadField";
import { cn } from "@repo/ui/lib/utils";

const rtwSchema = z.object({
  verificationType: z.enum(["Manual", "ShareCode", "IDVT"]),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  shareCode: z.string().optional(),
  idvtProvider: z.string().optional(),
  transactionRef: z.string().optional(),
  rtwStatus: z.string().min(1, "Status is required"),
  verificationDate: z.string().optional(),
  workRestrictions: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.verificationType === "Manual") {
    if (!data.documentType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Document type is required", path: ["documentType"] });
    }
    if (!data.documentNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Document number is required", path: ["documentNumber"] });
    }
  }
  if (data.verificationType === "ShareCode") {
    if (!data.shareCode || data.shareCode.length < 9) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid 9-character share code required", path: ["shareCode"] });
    }
  }
  if (data.verificationType === "IDVT") {
    if (!data.idvtProvider) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provider name is required", path: ["idvtProvider"] });
    }
    if (!data.transactionRef) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Transaction reference is required", path: ["transactionRef"] });
    }
  }
  if (data.verificationDate && new Date(data.verificationDate) > new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cannot be in the future", path: ["verificationDate"] });
  }
});

type RtwFormValues = z.infer<typeof rtwSchema>;

interface RtwVerificationFormProps {
  staffId: string;
  staffName: string;
  existing?: RtwRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentTypes = [
  "British Passport",
  "Irish Passport",
  "Birth Certificate + NI",
  "Biometric Residence Permit",
  "Biometric Residence Card",
  "Other",
];

export function RtwVerificationForm({
  staffId,
  staffName,
  existing,
  open,
  onOpenChange,
}: RtwVerificationFormProps) {
  const { toast } = useToast();
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RtwFormValues>({
    resolver: zodResolver(rtwSchema),
    defaultValues: {
      verificationType: (existing?.verificationType as "Manual" | "ShareCode" | "IDVT") || "Manual",
      documentType: existing?.documentType || "",
      documentNumber: existing?.documentNumber || "",
      issueDate: existing?.issueDate?.substring(0, 10) || "",
      expiryDate: existing?.expiryDate?.substring(0, 10) || "",
      shareCode: existing?.shareCode || "",
      idvtProvider: existing?.idvtProvider || "",
      transactionRef: existing?.transactionRef || "",
      rtwStatus: existing?.rtwStatus || "Pending",
      verificationDate: existing?.verificationDate?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      workRestrictions: existing?.workRestrictions || "",
    },
  });

  const verificationType = watch("verificationType");
  const documentType = watch("documentType");
  const rtwStatus = watch("rtwStatus");
  const issueDateValue = watch("issueDate");
  const expiryDateValue = watch("expiryDate");
  const verificationDateValue = watch("verificationDate");

  useEffect(() => {
    if (open) {
      reset({
        verificationType: (existing?.verificationType as "Manual" | "ShareCode" | "IDVT") || "Manual",
        documentType: existing?.documentType || "",
        documentNumber: existing?.documentNumber || "",
        issueDate: existing?.issueDate?.substring(0, 10) || "",
        expiryDate: existing?.expiryDate?.substring(0, 10) || "",
        shareCode: existing?.shareCode || "",
        idvtProvider: existing?.idvtProvider || "",
        transactionRef: existing?.transactionRef || "",
        rtwStatus: existing?.rtwStatus || "Pending",
        verificationDate: existing?.verificationDate?.substring(0, 10) || new Date().toISOString().substring(0, 10),
        workRestrictions: existing?.workRestrictions || "",
      });
      setDocumentFile(null);
    }
  }, [existing, open, reset]);

  const mutation = useUpsertRtwMutation(staffId);
  const uploadMutation = useUploadComplianceDocumentMutation(staffId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onFormSubmit = async (data: RtwFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
      if (documentFile) {
        await uploadMutation.mutateAsync({ file: documentFile, domain: "rtw" });
      }
      toast({
        title: "Success",
        description: documentFile
          ? "Right to Work verification and document saved successfully"
          : "Right to Work verification saved successfully",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save RTW verification",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || mutation.isPending || uploadMutation.isPending;

  const pathTabs = [
    { key: "Manual", label: "Manual", icon: <Briefcase className="w-4 h-4" /> },
    { key: "ShareCode", label: "Share Code", icon: <Globe className="w-4 h-4" /> },
    { key: "IDVT", label: "Digital (IDVT)", icon: <Fingerprint className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Right to Work Verification — {staffName}
          </DialogTitle>
          <DialogDescription>
            Complete the verification using one of the three approved paths below.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Verification Path Tabs */}
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            {pathTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setValue("verificationType", tab.key as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-md font-medium transition-all",
                  verificationType === tab.key
                    ? "bg-white text-primary shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Path A: Manual Verification */}
          {verificationType === "Manual" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required>Document Type</Label>
                <Select value={documentType} onValueChange={(val) => setValue("documentType", val)}>
                  <SelectTrigger className={cn(errors.documentType && "border-red-500")}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((dt) => (
                      <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentType && <p className="text-md text-red-500 font-medium">{errors.documentType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label required>Document Number</Label>
                <Input
                  {...register("documentNumber")}
                  placeholder="GBR-123456"
                  errorMessage={errors.documentNumber?.message}
                />
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
                <Label>Expiry Date</Label>
                <DatePicker
                  value={expiryDateValue}
                  onChange={(d) => setValue("expiryDate", d ? d.toISOString().substring(0, 10) : "")}
                  minDate={new Date()}
                  placeholder="Select expiry date..."
                  errorMessage={errors.expiryDate?.message}
                />
              </div>
            </div>
          )}

          {/* Path B: Share Code */}
          {verificationType === "ShareCode" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label required>Share Code (9 characters)</Label>
                  <Input
                    {...register("shareCode")}
                    onChange={(e) => setValue("shareCode", e.target.value.toUpperCase())}
                    placeholder="ABC123DEF"
                    maxLength={9}
                    errorMessage={errors.shareCode?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <DatePicker
                    value={expiryDateValue}
                    onChange={(d) => setValue("expiryDate", d ? d.toISOString().substring(0, 10) : "")}
                    minDate={new Date()}
                    placeholder="Select expiry date..."
                    errorMessage={errors.expiryDate?.message}
                  />
                </div>
              </div>
              <a
                href="https://www.gov.uk/view-right-to-work"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-md text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" /> Open GOV.UK Employer Portal
              </a>
            </div>
          )}

          {/* Path C: IDVT */}
          {verificationType === "IDVT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required>IDVT Provider</Label>
                <Input
                  {...register("idvtProvider")}
                  placeholder="e.g. Yoti, Post Office"
                  errorMessage={errors.idvtProvider?.message}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Transaction Reference</Label>
                <Input
                  {...register("transactionRef")}
                  placeholder="TXN-789"
                  errorMessage={errors.transactionRef?.message}
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Verification Date</Label>
              <DatePicker
                value={verificationDateValue}
                onChange={(d) => setValue("verificationDate", d ? d.toISOString().substring(0, 10) : "")}
                maxDate={new Date()}
                placeholder="Select verification date..."
                errorMessage={errors.verificationDate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={rtwStatus} onValueChange={(val) => setValue("rtwStatus", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Requires Follow-up">Requires Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Work Restrictions</Label>
              <Input {...register("workRestrictions")} placeholder="e.g. Max 20hrs/week" errorMessage={errors.workRestrictions?.message} />
            </div>
          </div>

          {/* Document Upload */}
          <div className="border-t border-border pt-4">
            <FileUploadField
              label="Supporting Document"
              existingUrl={existing?.documentUrl}
              onFileSelect={setDocumentFile}
              staffId={staffId}
              documentTitle={`Right to Work — ${staffName}`}
              helpText="Upload passport scan, share code result, or IDVT certificate (PDF, JPG, PNG up to 10MB)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (documentFile ? "Uploading & Saving..." : "Saving...")
                : "Save Verification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
