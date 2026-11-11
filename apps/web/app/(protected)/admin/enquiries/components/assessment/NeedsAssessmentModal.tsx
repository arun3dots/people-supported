"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Text,
} from "@repo/ui/components/ui";
import type { EnquiryResponseDTO, NeedsAssessmentDataDTO } from "@repo/schema";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import { useUpdateEnquiryMutation } from "../../../../../../lib/queries/enquiries";
import { AssessmentFormTab } from "./AssessmentFormTab";
import { DEFAULT_ASSESSMENT_FORM } from "./types";
import {
  ClipboardCheck,
  Save,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import { downloadElementAsPDF } from "@repo/ui/lib/pdf";

interface NeedsAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: EnquiryResponseDTO | null;
  readOnly?: boolean;
}

export function NeedsAssessmentModal({
  isOpen,
  onClose,
  enquiry,
  readOnly = false,
}: NeedsAssessmentModalProps) {
  const { user } = useAuth();
  const updateMutation = useUpdateEnquiryMutation(enquiry?.id || "");

  const [formData, setFormData] = useState<NeedsAssessmentDataDTO>(
    DEFAULT_ASSESSMENT_FORM
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // A Save/Approve is only allowed once the fields actually rendered in this modal
  // are complete: the required header/outcome fields AND every loaded question.
  // (Mobility/cognitive/nutrition/etc. sections are not part of this modal, so they
  // are intentionally omitted here — checking them would keep the button disabled.)
  const isComplete = React.useMemo(() => {
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    const coreFieldsFilled = Boolean(
      str(formData.dateOfAssessment) &&
        str(formData.assessorName) &&
        str(formData.prospectFullName) &&
        str(formData.dob) &&
        str(formData.currentLocation) &&
        str(formData.assessmentReason) &&
        str(formData.recommendedCareAllocationLevel) &&
        str(formData.assessorSignature)
    );

    // Every loaded template question must have a valid answer.
    const allQuestionsAnswered = (formData.customQuestions || []).every((q) => {
      if (q.type === "checkbox") {
        return Array.isArray(q.answer) && q.answer.length > 0;
      }
      return Boolean(q.answer && String(q.answer).trim().length > 0);
    });

    return coreFieldsFilled && allQuestionsAnswered;
  }, [formData]);

  useEffect(() => {
    if (isOpen && enquiry) {
      const existingData = enquiry.assessmentData as NeedsAssessmentDataDTO | null;
      const prospectName = `${enquiry.firstName || ""} ${enquiry.lastName || ""}`.trim();
      const dobStr = enquiry.dob
        ? new Date(enquiry.dob).toISOString().split("T")[0]
        : "";

      setFormData({
        ...DEFAULT_ASSESSMENT_FORM,
        ...(existingData || {}),
        prospectFullName: existingData?.prospectFullName || prospectName,
        currentLocation: existingData?.currentLocation || enquiry.currentLocation || "Home",
        dob: existingData?.dob || dobStr,
        assessorName: existingData?.assessorName || user?.fullName || "Assessing Nurse",
        dateOfAssessment:
          existingData?.dateOfAssessment || new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen, enquiry, user]);

  const handleFieldChange = (
    field: keyof NeedsAssessmentDataDTO,
    value: unknown
  ) => {
    setFormData((prev: NeedsAssessmentDataDTO) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (decisionOverride?: "APPROVED" | "DECLINED") => {
    if (!enquiry) return;

    // Only include a decision if explicitly approved/declined — never infer from default form state
    const resolvedDecision = decisionOverride ?? "PENDING";

    const finalData: NeedsAssessmentDataDTO = {
      ...formData,
      finalAssessorDecision: resolvedDecision,
      dateCompleted:
        decisionOverride || formData.dateCompleted
          ? new Date().toISOString().split("T")[0]
          : formData.dateCompleted,
      assessorSignature:
        formData.assessorSignature || user?.fullName || "Verified Assessor",
    };

    // Determine workflow status change:
    // - No override (plain save) → keep current status or "Assessment Pending"
    // - Approved → Ready for Admission
    // - Declined → Closed
    const newStatus: "Assessment Pending" | "Ready for Admission" | "Closed" =
      decisionOverride === "APPROVED"
        ? "Ready for Admission"
        : decisionOverride === "DECLINED"
          ? "Closed"
          : "Assessment Pending";

    await updateMutation.mutateAsync({
      assessmentData: finalData,
      status: newStatus as "Assessment Pending" | "Ready for Admission" | "Closed",
    });

    onClose();
  };

  const handleDownloadPDF = async () => {
    const filename = `Needs-Assessment-${enquiry?.firstName || "Prospect"}-${enquiry?.lastName || "Assessment"}`;
    setIsDownloading(true);
    try {
      await downloadElementAsPDF("#needs-assessment-printable-container", {
        filename,
        scale: 2,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!enquiry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="5xl" >
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:px-6 bg-surface-neutral/50 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold text-text-body flex items-center gap-2">
                <ClipboardCheck className="size-5 text-surface-primary shrink-0" />
                <span className="truncate">Pre-Admission Needs Assessment</span>
              </DialogTitle>
              <Text size="sm" variant="muted" className="mt-1 break-words">
                Candidate:{" "}
                <Text as="span" size="sm" weight="semibold" className="text-text-body">
                  {enquiry.firstName} {enquiry.lastName}
                </Text>{" "}
                • Category:{" "}
                <Text as="span" size="sm" weight="semibold" className="text-text-body">
                  {enquiry.careCategory}
                </Text>{" "}
                • Stage:{" "}
                <Text as="span" size="sm" weight="semibold" className="text-text-body">
                  {enquiry.status}
                </Text>
              </Text>
            </div>

            {/*<div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                <FileDown className="size-3.5" />
                {isDownloading ? "Exporting..." : "Download PDF"}
              </Button>
            </div>*/}
          </div>
        </DialogHeader>

        {/* Assessment Form Content */}
        <div
          id="needs-assessment-printable-container"
          className="flex-1 overflow-y-auto p-5 sm:p-6 focus-visible:outline-hidden"
        >
          <AssessmentFormTab
            formData={formData}
            onChange={handleFieldChange}
            readOnly={readOnly}
          />
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:px-6 bg-surface-neutral/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {readOnly ? "Close" : "Cancel"}
          </Button>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave()}
                disabled={updateMutation.isPending}
              >
                <Save className="size-3.5" />
                Save Assessment
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave("DECLINED")}
                disabled={updateMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                Reject / Close Enquiry
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleSave("APPROVED")}
                disabled={!isComplete || updateMutation.isPending}
              >
                <CheckCircle2 className="size-3.5" />
                Approve &amp; Mark Ready for Admission
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
