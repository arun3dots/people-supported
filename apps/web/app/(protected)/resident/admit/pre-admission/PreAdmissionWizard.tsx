"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button, Spinner, Text } from "@repo/ui/components/ui";
import { RiskAssessmentTab } from "../../../../shared/components/risk-assessment";
import { AdmissionStepper } from "../components/AdmissionStepper";
import { AdmissionSuccessScreen } from "../components/AdmissionSuccessModal";
import type { AdmissionStep } from "../types";
import { PartAForm } from "./parts/PartAForm";
import { PartBForm } from "./parts/PartBForm";
import { PartCForm } from "./parts/PartCForm";
import { PartEForm } from "./parts/PartEForm";
import { PartFForm, PartGForm } from "./parts/PartFGForms";
import { PreAdmissionADLStep } from "./parts/PreAdmissionADLStep";
import { PreAdmissionAssessmentStep } from "./parts/PreAdmissionAssessmentStep";
import { RoomStep } from "./parts/RoomStep";
import { ReviewStep } from "./review/ReviewStep";
import { PartCard } from "./shared/PartCard";
import { PRE_ADMISSION_STEPS, PRE_ADMISSION_STEP_LABELS } from "./steps";
import { usePreAdmissionWizard } from "./usePreAdmissionWizard";

export function PreAdmissionWizard() {
  const w = usePreAdmissionWizard();
  const { parts, step } = w;

  if (w.finalized) {
    return <AdmissionSuccessScreen {...w.finalized} carePlanId="" />;
  }
  if (w.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans">
      {w.enquiryData && !w.residentId && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-md">
          <Sparkles className="size-5 shrink-0" />
          <span>
            Pre-filled from Enquiry #{w.enquiryId?.slice(0, 8)}. Review each part before continuing.
          </span>
        </div>
      )}

      <AdmissionStepper
        currentStep={step}
        completedSteps={w.completedSteps}
        onStepClick={(s) => w.goToStep(s)}
        isEditMode={!!w.residentId}
        steps={PRE_ADMISSION_STEPS}
        labels={PRE_ADMISSION_STEP_LABELS}
      />

      <div className="space-y-6 pt-2">
        {step === 1 && (
          <PartAForm
            value={parts.partA}
            onChange={(p) => w.setPart("partA", p)}
            errors={w.stepErrors}
            residentId={w.residentId}
            meta={w.meta}
            onMetaChange={w.setMeta}
          />
        )}
        {step === 2 && (
          <PartGForm
            value={parts.partG}
            onChange={(p) => w.setPart("partG", p)}
            errors={w.stepErrors}
          />
        )}
        {step === 3 && (
          <PartBForm
            value={parts.partB}
            onChange={(p) => w.setPart("partB", p)}
            errors={w.stepErrors}
          />
        )}
        {step === 4 && (
          <PartCForm
            value={parts.partC}
            onChange={(p) => w.setPart("partC", p)}
            errors={w.stepErrors}
            residentId={w.residentId}
          />
        )}
        {step === 5 && (
          <PartCard
            title="Risk assessment"
            description="Complete clinical risk assessment tools for this resident. Assessments recorded here automatically sync to their care profile."
          >
            {w.residentId ? (
              <RiskAssessmentTab
                residentId={w.residentId}
                residentStatus="Draft"
                isDraft={false}
              />
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center space-y-3">
                <Text size="md" weight="medium" className="text-amber-900">
                  Please save Step 1 (Admission and personal details) first to generate a resident record before completing risk assessments.
                </Text>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => w.goToStep(1)}
                  className="rounded-xl font-semibold shadow-none"
                >
                  Go to Step 1
                </Button>
              </div>
            )}
          </PartCard>
        )}
        {step === 6 && (
          <PreAdmissionAssessmentStep
            residentId={w.residentId}
            onGoToStepOne={() => w.goToStep(1)}
            onGoToRiskStep={() => w.goToStep(5)}
            flushRef={w.assessmentFlushRef}
          />
        )}
        {step === 7 && (
          <PreAdmissionADLStep
            value={parts.partD}
            onChange={(patch) => w.setPart("partD", patch)}
          />
        )}
        {step === 8 && (
          <PartEForm
            value={parts.partE}
            onChange={(p) => w.setPart("partE", p)}
            errors={w.stepErrors}
          />
        )}
        {step === 9 && (
          <PartFForm
            value={parts.partF}
            onChange={(p) => w.setPart("partF", p)}
            errors={w.stepErrors}
          />
        )}
        {step === 10 && (
          <RoomStep
            value={parts.roomAllocation}
            onChange={(p) => w.setPart("roomAllocation", p)}
            errors={w.stepErrors}
          />
        )}
        {step === 11 && (
          <ReviewStep
            parts={parts}
            record={w.record}
            issues={w.issues}
            residentId={w.residentId}
            onGoToStep={(s) => w.goToStep(s as AdmissionStep)}
            onSubmit={w.submit}
            onDecide={w.decide}
            onAdmit={() => void w.admit()}
            isSubmitting={w.isSubmitting}
            isDeciding={w.isDeciding}
            isAdmitting={w.isAdmitting}
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          type="button"
          size="lg"
          disabled={step === 1}
          onClick={() => w.goToStep((step - 1) as AdmissionStep)}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < 11 && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={w.isSaving}
            onClick={() => void w.saveAndContinue()}
            className="rounded-xl font-semibold px-5 shadow-none"
          >
            {w.isSaving ? "Saving…" : "Save and continue"}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
