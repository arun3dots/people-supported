"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, toast } from "@repo/ui/components/ui";
import {
  useGetResidentQuery,
  useDischargeResidentMutation,
  useUploadDocumentMutation,
} from "../../../../../../lib/queries/residents";
import { ResidentDischargeHeroCard } from "./components/ResidentDischargeHeroCard";
import {
  DischargeFormSections,
  DischargeFormData,
  HandoverDoc,
} from "./components/DischargeFormSections";
import { DischargeReviewModal } from "./components/DischargeReviewModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DischargePageSchema = z.object({
  reason: z.string().trim().min(1, "Reason for discharge is required"),
  dischargeType: z.string().min(1, "Discharge type is required"),
  dischargeDate: z.string().min(1, "Discharge date is required"),
  dischargeTime: z.string().min(1, "Discharge time is required"),
  carePlanReview: z.string().min(1, "Care plan review status is required"),
  riskAssessment: z.string().min(1, "Risk assessment status is required"),
  medicationReview: z.string().min(1, "Medication review status is required"),
});

export default function ResidentDischargePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const residentId = resolvedParams.id;
  const router = useRouter();

  const { data: resident, isLoading: isResidentLoading } = useGetResidentQuery(residentId);
  const dischargeMutation = useDischargeResidentMutation(residentId);
  const uploadDocMutation = useUploadDocumentMutation();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<DischargeFormData>({
    reason: "",
    dischargeType: "",
    dischargeDate: "",
    dischargeTime: "",
    carePlanReview: "",
    riskAssessment: "",
    medicationReview: "",
    familyNotified: false,
    gpNotified: false,
    handoverDocuments: [],
  });

  const handleUploadFile = async (file: File) => {
    try {
      const uploaded = await uploadDocMutation.mutateAsync({
        residentId,
        file,
        category: "Discharge Handover",
      });

      const uploadedDoc = uploaded as { fileUrl?: string } | undefined;
      const newDoc: HandoverDoc = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileType: file.name.split(".").pop() || "docx",
        fileSize: file.size,
        fileUrl: uploadedDoc?.fileUrl || "",
        updatedAt: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setFormData((prev) => ({
        ...prev,
        handoverDocuments: [...prev.handoverDocuments, newDoc],
      }));
    } catch {
      // Toast already handled by mutation
    }
  };

  const handleReviewClick = () => {
    setErrors({});
    const validation = DischargePageSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast({
        title: "Discharge details required",
        description: "Please fill in all required discharge details highlighted below.",
        variant: "destructive",
      });
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleCompleteDischarge = async () => {
    try {
      await dischargeMutation.mutateAsync({
        dischargeType: formData.dischargeType as "Planned" | "Emergency" | "Transfer" | "Hospital" | "Deceased" | "Other",
        reason: formData.reason,
        dischargeDate: formData.dischargeDate,
        dischargeTime: formData.dischargeTime,
        carePlanReview: formData.carePlanReview,
        riskAssessment: formData.riskAssessment,
        medicationReview: formData.medicationReview,
        familyNotified: formData.familyNotified,
        gpNotified: formData.gpNotified,
        handoverDocuments: formData.handoverDocuments,
      });
      setIsReviewModalOpen(false);
      router.push(`/admin/residents`);
    } catch {
      // Error handled by mutation toast
    }
  };

  if (isResidentLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-800" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/residents/${residentId}`}>
          <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
            <ArrowLeft className="size-4" /> Back to Resident
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Resident Discharge
          </h1>
          <p className="text-md text-slate-500 font-medium">
            Manage and track the complete discharge process for the resident.
          </p>
        </div>
      </div>

      {/* Hero Banner Card */}
      <ResidentDischargeHeroCard resident={resident} />

      {/* Form Sections */}
      <DischargeFormSections
        formData={formData}
        setFormData={setFormData}
        onReviewClick={handleReviewClick}
        onCancel={() => router.push(`/admin/residents/${residentId}`)}
        onUploadFile={handleUploadFile}
        isUploading={uploadDocMutation.isPending}
        errors={errors}
        setErrors={setErrors}
      />

      {/* Review Modal */}
      <DischargeReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        resident={resident}
        formData={formData}
        onConfirm={handleCompleteDischarge}
        isLoading={dischargeMutation.isPending}
      />
    </div>
  );
}
