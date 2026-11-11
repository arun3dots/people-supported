/**
 * UK Social Care & CQC Regulation 12 eMAR Validation Engine
 * Enforces the 6 Rights of Medication Administration and Controlled Drugs Safeguards.
 */

export interface MedicationItem {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  drugName: string;
  dose: string;
  route: string; // e.g. Oral, Topical, Sublingual, Subcutaneous
  scheduledTime: string;
  instructions?: string;
  isControlledDrug?: boolean;
  activeIngredients?: string[];
}

export interface ResidentAllergyInfo {
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-Threatening';
}

export type MedicationAdministrationStatus = 'Given' | 'Refused' | 'Omitted' | 'NPO';

export interface AdministrationAttempt {
  medication: MedicationItem;
  residentAllergies: ResidentAllergyInfo[];
  status: MedicationAdministrationStatus;
  reason?: string;
  administeredByStaffId: string;
  witnessStaffId?: string; // Mandatory for Controlled Drugs
}

export interface EmarValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  requiresWitness: boolean;
  allergyConflict?: string;
}

export function validateMedicationAdministration(
  attempt: AdministrationAttempt
): EmarValidationResult {
  // 1. Check for Allergy Conflict (Right Resident / Right Medication)
  const drugLower = attempt.medication.drugName.toLowerCase();
  for (const allergy of attempt.residentAllergies) {
    const allergyLower = allergy.allergen.toLowerCase();
    if (drugLower.includes(allergyLower) || allergyLower.includes(drugLower)) {
      return {
        isValid: false,
        error: `ALLERGY CONTRAINDICATION: Resident has a documented ${allergy.allergen} allergy (${allergy.severity}). Medication administration blocked under CQC Regulation 12.`,
        requiresWitness: false,
        allergyConflict: allergy.allergen,
      };
    }
  }

  // 2. Controlled Drug (Schedule 2/3) Dual Signature Check
  if (attempt.medication.isControlledDrug && attempt.status === 'Given') {
    if (!attempt.witnessStaffId) {
      return {
        isValid: false,
        error: 'CONTROLLED DRUG REQUIREMENT: A registered nurse or senior carer witness signature is legally required for Controlled Drugs.',
        requiresWitness: true,
      };
    }
  }

  // 3. Reason check for non-administration (Refused, Omitted, NPO)
  if (attempt.status !== 'Given' && (!attempt.reason || attempt.reason.trim().length === 0)) {
    return {
      isValid: false,
      error: `CLINICAL AUDIT ERROR: A mandatory reason code must be documented when status is ${attempt.status}.`,
      requiresWitness: false,
    };
  }

  return {
    isValid: true,
    requiresWitness: !!attempt.medication.isControlledDrug,
  };
}
