"use client";

import {
  PRE_ADMISSION_CARE_TYPES,
  type PreAdmissionPartADTO,
  type UpdatePreAdmissionMetaDTO,
} from "@repo/schema";
import { PhotoUploadCard } from "../../components/step1-personal/PhotoUploadCard";
import { FieldGrid, PartCard } from "../shared/PartCard";
import {
  CheckField,
  DateField,
  ListField,
  SelectField,
  TextAreaField,
  TextField,
} from "../shared/fields";
import type { PartFormProps } from "../shared/types";

const STAY_TYPES = ["Permanent", "Respite", "Short-term"] as const;
const CARE_LEVELS = ["High", "Medium", "Low"] as const;
const ADMITTED_FROM = ["Home", "Hospital", "Other facility"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;
const MARITAL = ["Single", "Married", "Widowed", "Divorced"] as const;

interface PartAFormProps extends PartFormProps<PreAdmissionPartADTO> {
  residentId: string | null;
  meta: UpdatePreAdmissionMetaDTO;
  onMetaChange: (patch: UpdatePreAdmissionMetaDTO) => void;
}

export function PartAForm({
  value,
  onChange,
  errors,
  residentId,
  meta,
  onMetaChange,
}: PartAFormProps) {
  const careTypeOptions =
    value.typeOfCare &&
    !PRE_ADMISSION_CARE_TYPES.some((careType) => careType === value.typeOfCare)
      ? [...PRE_ADMISSION_CARE_TYPES, value.typeOfCare]
      : PRE_ADMISSION_CARE_TYPES;

  return (
    <div className="space-y-6 font-sans">
      <PartCard
        title="Assessment details"
        description="Where and when the pre-admission assessment was carried out."
      >
        <FieldGrid cols={3}>
          <DateField
            label="Assessed on"
            value={meta.assessedAt?.slice(0, 10)}
            onChange={(v) => onMetaChange({ assessedAt: v || null })}
          />
          <TextField
            label="Assessed at"
            placeholder="e.g. Ward 7, Royal County Hospital"
            value={meta.assessedLocation}
            onChange={(v) => onMetaChange({ assessedLocation: v })}
          />
          <TextField
            label="Assessed by"
            value={meta.assessedByName}
            onChange={(v) => onMetaChange({ assessedByName: v })}
          />
        </FieldGrid>
      </PartCard>

      <PhotoUploadCard
        photoUrl={value.photoUrl ?? undefined}
        draftResidentId={residentId}
        onPhotoChange={(photoUrl) => onChange({ photoUrl })}
      />

      <PartCard title="A · Personal details">
        <FieldGrid cols={3}>
          <TextField
            label="First name"
            required
            value={value.firstName}
            errorMessage={errors?.firstName}
            onChange={(v) => onChange({ firstName: v })}
          />
          <TextField
            label="Middle name"
            value={value.middleName}
            onChange={(v) => onChange({ middleName: v })}
          />
          <TextField
            label="Last name"
            required
            value={value.lastName}
            errorMessage={errors?.lastName}
            onChange={(v) => onChange({ lastName: v })}
          />
          <TextField
            label="Preferred name"
            placeholder="e.g. Peggy"
            value={value.preferredName}
            onChange={(v) => onChange({ preferredName: v })}
          />
          <DateField
            label="Date of birth"
            required
            dob
            value={value.dob}
            errorMessage={errors?.dob}
            onChange={(v) => onChange({ dob: v })}
          />
          <div className="grid grid-cols-2 gap-x-2">
            <SelectField
              label="Gender"
              required
              options={GENDERS}
              value={value.gender}
              errorMessage={errors?.gender}
              onChange={(v) => onChange({ gender: v })}
            />
            <SelectField
              label="Marital status"
              required
              options={MARITAL}
              value={value.maritalStatus}
              errorMessage={errors?.maritalStatus}
              onChange={(v) => onChange({ maritalStatus: v })}
            />
          </div>
        </FieldGrid>
        <FieldGrid>
          <TextField
            label="NHS number"
                        placeholder="10-digit NHS number"
            value={value.nhsNumber}
            errorMessage={errors?.nhsNumber}
            onChange={(v) => onChange({ nhsNumber: v })}
          />
          <TextField
            label="Other national ID / passport"
            value={value.nationalId}
            onChange={(v) => onChange({ nationalId: v })}
          />
          <TextField
            label="Preferred language"
            required
            placeholder="e.g. English"
            value={value.language}
            errorMessage={errors?.language}
            onChange={(v) => onChange({ language: v })}
          />
          <ListField
            label="Languages spoken"
            placeholder="e.g. English, Welsh"
            value={value.languagesSpoken}
            onChange={(v) => onChange({ languagesSpoken: v })}
          />
          <CheckField
            label="Interpreter required"
            checked={value.interpreterRequired}
            onChange={(v) => onChange({ interpreterRequired: v })}
          />
          <TextField
            label="Religion"
            placeholder="e.g. Church of England, likes Sunday service"
            value={value.religion}
            onChange={(v) => onChange({ religion: v })}
          />
          <TextField
            label="Former job"
            value={value.formerOccupation}
            onChange={(v) => onChange({ formerOccupation: v })}
          />
          <TextField
            label="Previous address"
            required
            value={value.previousAddress}
            errorMessage={errors?.previousAddress}
            onChange={(v) => onChange({ previousAddress: v })}
          />
        </FieldGrid>
      </PartCard>

      <PartCard title="A · Admission">
        <FieldGrid cols={3}>
          <SelectField
            label="Type of stay"
            required
            options={STAY_TYPES}
            value={value.stayType}
            errorMessage={errors?.stayType}
            onChange={(v) =>
              onChange({ stayType: v as PreAdmissionPartADTO["stayType"] })
            }
          />
          <SelectField
            label="Type of care"
            required
            options={careTypeOptions}
            value={value.typeOfCare}
            errorMessage={errors?.typeOfCare}
            onChange={(v) => onChange({ typeOfCare: v })}
          />
          <SelectField
            label="Level of care"
            required
            options={CARE_LEVELS}
            value={value.careLevel}
            errorMessage={errors?.careLevel}
            onChange={(v) =>
              onChange({ careLevel: v as PreAdmissionPartADTO["careLevel"] })
            }
          />
          <DateField
            label="Expected admission date"
            value={value.expectedAdmissionDate}
            onChange={(v) => onChange({ expectedAdmissionDate: v })}
          />
          <SelectField
            label="Admitted from"
            required
            options={ADMITTED_FROM}
            value={value.admittedFrom}
            errorMessage={errors?.admittedFrom}
            onChange={(v) => onChange({ admittedFrom: v })}
          />
          <TextField
            label="Referring facility"
            placeholder="e.g. Royal County Hospital, Ward 7"
            className="sm:col-span-2"
            value={value.referringFacilityName}
            onChange={(v) => onChange({ referringFacilityName: v })}
          />
        </FieldGrid>
        <TextAreaField
          label="Reason for admission"
          required
          placeholder="Why the person can no longer manage where they are"
          value={value.admissionReason}
          errorMessage={errors?.admissionReason}
          onChange={(v) => onChange({ admissionReason: v })}
        />
        <TextAreaField
          label="Their own view"
          placeholder="In their own words, e.g. “I know I can’t go back to the house on my own.”"
          value={value.residentView}
          onChange={(v) => onChange({ residentView: v })}
        />
      </PartCard>
    </div>
  );
}
