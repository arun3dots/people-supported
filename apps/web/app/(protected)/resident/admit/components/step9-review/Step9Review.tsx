"use client";

import React from "react";
import {
  Input,
  Label,
  Button,
  Badge,
  InfoField,
  Checkbox,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import { Edit3, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { AdmissionFormData, AdmissionStep } from "../../types";
import { isStepValid } from "../../utils/admissionStepValidation";

interface Step9ReviewProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onGoToStep: (step: AdmissionStep) => void;
  onFinalize: () => void;
  isSubmitting?: boolean;
}

export function Step9Review({
  formData,
  updateFormData,
  onPrev,
  onGoToStep,
  onFinalize,
  isSubmitting = false,
}: Step9ReviewProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Card 1: Personal & Demographics */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            1. Personal &amp; Demographic Details
          </Text>
          <Button
            type="button"
            variant="link"
            onClick={() => onGoToStep(1)}
            className="text-emerald-800 gap-1"
          >
            <Edit3 className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {formData.photoUrl ? (
            <img
              src={formData.photoUrl}
              alt="Resident"
              crossOrigin="use-credentials"
              className="size-16 rounded-full object-cover border-2 border-emerald-100 shrink-0 mt-1"
            />
          ) : null}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            <InfoField
              label="Full Name"
              value={
                formData.fullName ||
                `${formData.firstName} ${formData.lastName}`.trim()
              }
              subValue={
                formData.middleName
                  ? `Middle: ${formData.middleName}`
                  : undefined
              }
            />
            <InfoField
              label="Preferred Name"
              value={formData.preferredName || "None"}
            />
            <InfoField label="Date of Birth" value={formData.dob || "N/A"} />
            <InfoField
              label="Gender / Status"
              value={`${formData.gender || "N/A"} • ${formData.maritalStatus || "N/A"}`}
            />
            <InfoField
              label="NHS Number"
              value={formData.nhsNumber || "Not Provided"}
            />
            <InfoField
              label="Admission Type"
              value={formData.admissionType || "Permanent"}
            />
            <InfoField
              label="Admission Date"
              value={formData.admissionDate || "N/A"}
            />
            <InfoField
              label="Admitted From"
              value={`${formData.admittedFrom || "Home"} (${formData.referringFacilityName || "Direct"})`}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Contacts & Healthcare Providers */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            2. Contacts &amp; Healthcare Providers
          </Text>
          <Button
            type="button"
            variant="link"
            onClick={() => onGoToStep(2)}
            className="text-emerald-800 gap-1"
          >
            <Edit3 className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoField
            label="Primary Contact"
            value={`${formData.primaryContact.name || "N/A"} (${formData.primaryContact.relationship || "Contact"})`}
            subValue={formData.primaryContact.phone}
          />
          <InfoField
            label="Secondary Contact"
            value={
              formData.secondaryContact?.name
                ? `${formData.secondaryContact.name} (${formData.secondaryContact.relationship})`
                : "None"
            }
            subValue={formData.secondaryContact?.phone}
          />
          <InfoField
            label="Responsible Party"
            value={`${formData.responsibleParty.name || "N/A"}${formData.responsibleParty.relationship ? ` (${formData.responsibleParty.relationship})` : ""}`}
            subValue={formData.responsibleParty.phone}
          />
          <InfoField
            label="General Practitioner (GP)"
            value={formData.generalPractitioner.name || "N/A"}
            subValue={`${formData.generalPractitioner.clinic || ""} • ${formData.generalPractitioner.phone || ""}`}
          />
        </div>
      </div>

      {/* Card 3: Medical History & Medications */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            3. Medical History &amp; Medications
          </Text>
          <Button
            type="button"
            variant="link"
            onClick={() => onGoToStep(3)}
            className="text-emerald-800 gap-1"
          >
            <Edit3 className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoField
            label="Primary Diagnosis"
            value={formData.primaryDiagnosis || "N/A"}
          />
          <InfoField
            label="Secondary Diagnoses"
            value={formData.secondaryDiagnoses.join(", ") || "None"}
          />
          <InfoField
            label="BMI &amp; Vitals"
            value={`BMI: ${formData.bmi || "N/A"} • BP: ${formData.baselineVitals?.bp || "N/A"}`}
          />
          <InfoField
            label="Active Prescriptions"
            value={`${formData.currentMedications.length} medications listed`}
          />
        </div>
      </div>

      {/* Card 4: ADL & Psychosocial */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            4. Functional Independence &amp; Profile
          </Text>
          <Button
            type="button"
            variant="link"
            onClick={() => onGoToStep(4)}
            className="text-emerald-800 gap-1"
          >
            <Edit3 className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoField
            label="Katz ADL Score"
            value={`${formData.adlScore} / 6 (Independence Score)`}
          />
          <InfoField
            label="Fall Risk Assessment"
            value={formData.fallRiskScore || "Low"}
          />
          <InfoField
            label="Diet &amp; Texture"
            value={`${formData.dietType || "Regular"} (${formData.textureModification || "Normal"})`}
          />
          <InfoField
            label="Mobility Aids"
            value={formData.mobilityAidsUsed.join(", ") || "None"}
          />
        </div>
      </div>

      {/* Card 5: Room & Financial */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-4 shadow-none border-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            5. Room Allocation &amp; Financial Terms
          </Text>
          <Button
            type="button"
            variant="link"
            onClick={() => onGoToStep(6)}
            className="text-emerald-800 gap-1"
          >
            <Edit3 className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoField
            label="Assigned Room"
            value={`Room ${formData.roomNumber || "N/A"} (${formData.roomType || "Single"})`}
          />
          <InfoField
            label="Payment Method"
            value={formData.primaryPaymentMethod || "Private Pay"}
          />
          <InfoField
            label="Agreed Rate"
            value={`£${formData.agreedRoomRate || 0} / ${formData.agreedRoomRatePeriod || "Month"}`}
          />
          <InfoField
            label="DNAR / Resuscitation"
            value={formData.advanceDirectives.dnarStatus || "Full Code"}
          />
        </div>
      </div>

      {/* Staff Declaration & Confirmation Card */}
      <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none">
        <div className="pb-4 border-b border-slate-200/80">
          <Text as="h3" size="md" weight="bold">
            Admitting Staff Sign-Off &amp; Declaration
          </Text>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Admitting Staff Name</Label>
              <Input
                type="text"
                value={formData.admittingStaffName}
                onChange={(e) =>
                  updateFormData({ admittingStaffName: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Confirmation Date / Time</Label>
              <DatePicker
                variant="datetime"
                value={formData.confirmationDateTime}
                onChange={(date) =>
                  updateFormData({
                    confirmationDateTime: date
                      ? format(date, "yyyy-MM-dd'T'HH:mm")
                      : "",
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200/70 bg-white">
            <Checkbox
              checked={formData.staffDeclarationSigned}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                updateFormData({ staffDeclarationSigned: checked === true })
              }
            />
            <Text size="md" variant="subdued" className="leading-relaxed">
              I confirm all mandatory admission information has been collected
              and verified according to statutory care regulations.
            </Text>
          </div>
        </div>
      </div>

      {/* Navigation & Finalize Button */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onPrev}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isStepValid(9, formData) || isSubmitting}
          onClick={onFinalize}
          className="rounded-xl font-semibold px-6 shadow-none"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting
            ? "Finalising Admission..."
            : "Confirm & Finalise Admission"}
          {!isSubmitting && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
