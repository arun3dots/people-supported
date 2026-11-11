import type { AdmissionFormData } from "../types";

export function validateStep(stepId: number, formData: AdmissionFormData): boolean {
  switch (stepId) {
    case 1:
      return Boolean(formData.fullName && formData.dob && formData.gender);
    case 2:
      return Boolean(formData.primaryContact.name && formData.generalPractitioner.name);
    case 3:
      return true;
    case 4:
      return Boolean(formData.adlKatzMatrix);
    case 5:
      return true;
    case 6:
      return Boolean(formData.primaryPaymentMethod);
    case 7:
      return Boolean(formData.assignedBedId);
    case 8:
      return true;
    case 9:
      return Boolean(formData.staffDeclarationSigned);
    default:
      return true;
  }
}
