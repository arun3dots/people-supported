"use client";

import type { PreAdmissionPartDDTO } from "@repo/schema";
import { DEFAULT_ADMISSION_FORM_DATA } from "../../data/admissionFormFields";
import type { AdmissionFormData } from "../../types";
import { Step4ADL } from "../../components/step4-adl/Step4ADL";

interface PreAdmissionADLStepProps {
  value: PreAdmissionPartDDTO;
  onChange: (patch: Partial<PreAdmissionPartDDTO>) => void;
}

function parseFalls(value: string): number | string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isInteger(number) && number >= 0 ? number : trimmed;
}

export function PreAdmissionADLStep({
  value,
  onChange,
}: PreAdmissionADLStepProps) {
  const formData: AdmissionFormData = {
    ...DEFAULT_ADMISSION_FORM_DATA,
    mobilityAidsUsed: value.mobilityAids,
    fallRiskScore: value.fallsRiskLevel ?? "",
    fallsLast6Months:
      value.fallsLast6Months === null || value.fallsLast6Months === undefined
        ? ""
        : String(value.fallsLast6Months),
    ambulationDistance: value.ambulationDistance ?? "",
    cognitiveScore: value.cognitiveScore ?? "",
    orientation: value.orientation ?? "",
    communicationAbility: value.communicationAbility ?? "",
    behavioralConcerns: value.behavioralConcerns ?? "",
    sleepPattern: value.sleepPattern ?? "",
    dietType: value.dietType ?? "",
    textureModification: value.fluidConsistency ?? "",
    feedingAssistanceNeed: value.feedingAssistanceNeed ?? "",
    familyInvolvement: value.familyInvolvement ?? "",
    routinePreferences: value.routinePreferences ?? "",
  };

  const updateFormData = (patch: Partial<AdmissionFormData>) => {
    const updated: Partial<PreAdmissionPartDDTO> = {};
    if (patch.mobilityAidsUsed) updated.mobilityAids = patch.mobilityAidsUsed;
    if (patch.fallRiskScore !== undefined) {
      updated.fallsRiskLevel =
        patch.fallRiskScore === "Low" ||
        patch.fallRiskScore === "Medium" ||
        patch.fallRiskScore === "High"
          ? patch.fallRiskScore
          : null;
    }
    if (patch.fallsLast6Months !== undefined) {
      updated.fallsLast6Months = parseFalls(patch.fallsLast6Months);
    }
    if (patch.ambulationDistance !== undefined) {
      updated.ambulationDistance = patch.ambulationDistance;
    }
    if (patch.cognitiveScore !== undefined) {
      updated.cognitiveScore = patch.cognitiveScore;
    }
    if (patch.orientation !== undefined) updated.orientation = patch.orientation;
    if (patch.communicationAbility !== undefined) {
      updated.communicationAbility = patch.communicationAbility;
    }
    if (patch.behavioralConcerns !== undefined) {
      updated.behavioralConcerns = patch.behavioralConcerns;
    }
    if (patch.sleepPattern !== undefined) {
      updated.sleepPattern = patch.sleepPattern;
    }
    if (patch.dietType !== undefined) updated.dietType = patch.dietType;
    if (patch.textureModification !== undefined) {
      updated.fluidConsistency = patch.textureModification;
    }
    if (patch.feedingAssistanceNeed !== undefined) {
      updated.feedingAssistanceNeed = patch.feedingAssistanceNeed;
    }
    if (patch.familyInvolvement !== undefined) {
      updated.familyInvolvement = patch.familyInvolvement;
    }
    if (patch.routinePreferences !== undefined) {
      updated.routinePreferences = patch.routinePreferences;
    }
    onChange(updated);
  };

  return (
    <Step4ADL
      formData={formData}
      updateFormData={updateFormData}
      adlChecklist={value.adlChecklist}
      updateAdlChecklist={(adlChecklist) => onChange({ adlChecklist })}
      onPrev={() => undefined}
      onNext={() => undefined}
      showNavigation={false}
    />
  );
}
