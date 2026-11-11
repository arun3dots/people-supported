import type { AdmissionFormData, AdmissionStep } from "../types";
import { residentNameRegex } from "@repo/schema";

/**
 * Whether a step's required fields are filled, mirroring each form's own
 * Continue-button gating so a step only completes when its Continue would
 * actually allow advancing.
 */
export function isStepValid(step: AdmissionStep, data: AdmissionFormData): boolean {
  switch (step) {
    case 1:
      return Boolean(
        data.firstName?.trim() &&
          data.lastName?.trim() &&
          data.dob &&
          residentNameRegex.test(data.firstName.trim()) &&
          residentNameRegex.test(data.lastName.trim()) &&
          (!data.middleName?.trim() || residentNameRegex.test(data.middleName.trim())) &&
          (!data.preferredName?.trim() || residentNameRegex.test(data.preferredName.trim()))
      );
    case 2:
      return Boolean(
        data.primaryContact?.name?.trim() &&
          data.primaryContact?.phone?.trim() &&
          data.primaryContact?.emailAddress?.trim() &&
          data.responsibleParty?.name?.trim() &&
          data.responsibleParty?.phone?.trim() &&
          data.generalPractitioner?.name?.trim() &&
          data.generalPractitioner?.phone?.trim() &&
          residentNameRegex.test(data.primaryContact?.name?.trim() || "") &&
          residentNameRegex.test(data.responsibleParty?.name?.trim() || "") &&
          residentNameRegex.test(data.generalPractitioner?.name?.trim() || "") &&
          (!data.secondaryContact?.name?.trim() || residentNameRegex.test(data.secondaryContact.name.trim())) &&
          (!data.legalRep?.nameContact?.trim() || residentNameRegex.test(data.legalRep.nameContact.trim()))
      );
    case 3:
      return true;
    case 4:
      return Object.values(data.adlKatzMatrix).length >= 6;
    case 5:
      return (
        data.consentChecklist
          .filter((c) => c.required)
          .every((c) => c.signed)
      );
    case 6:
      return Boolean(data.primaryPaymentMethod);
    case 7:
      return Boolean(data.roomNumber && data.assignedBedId);
    case 8:
      return data.documents
        .filter((d) => d.required)
        .every((d) => d.status === "Verified" || d.status === "Uploaded");
    case 9:
      return Boolean(data.staffDeclarationSigned);
    default:
      return true;
  }
}

