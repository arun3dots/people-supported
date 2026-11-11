export interface EmergencyContact {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  relationship: string;
  phone: string;
  emailAddress?: string;
}

export interface CareProviderItem {
  type: string;
  name: string;
  clinic?: string;
  phone?: string;
}

export interface CurrentMedicationItem {
  name: string;
  dose: string;
  frequency: string;
  route: string;
  prescribingDoctor?: string;
}

export type ADLKatzLevel =
  | "Independent"
  | "Supervision"
  | "Limited Assist"
  | "Extensive Assist"
  | "Total Dependence";

export interface ADLKatzMatrix {
  bathing: ADLKatzLevel;
  dressing: ADLKatzLevel;
  toileting: ADLKatzLevel;
  transferring: ADLKatzLevel;
  continence: ADLKatzLevel;
  eating: ADLKatzLevel;
}

export interface ConsentChecklistItem {
  name: string;
  required: boolean;
  signed: boolean;
  dateSigned?: string;
  documentUrl?: string;
}

export interface BelongingItem {
  item: string;
  description?: string;
  conditionPhotoUrl?: string;
  estValue?: number;
}

export type DocumentChecklistStatus = "Verified" | "Uploaded" | "Missing" | "N/A";

export interface DocumentChecklistItem {
  id: string;
  name: string;
  category: string;
  required: boolean;
  status: DocumentChecklistStatus;
  fileUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface BaselineVitals {
  bp?: string;
  pulse?: number;
  temp?: number;
  respiratoryRate?: number;
  spO2?: number;
}

export interface AdmissionFormData {
  // Step 1: Personal
  photoUrl?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  preferredName?: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nhsNumber?: string;
  nationalId?: string;
  nationalIdType?: string;
  religion?: string;
  languagesSpoken: string[];
  interpreterRequired: boolean;
  formerOccupation?: string;
  hobbies?: string;
  previousAddress?: string;
  admissionDate: string;
  admissionType: string;
  admittedFrom: string;
  referringFacilityName?: string;

  // Step 2: Contacts / POA
  primaryContact: EmergencyContact;
  secondaryContact?: Partial<EmergencyContact>;
  responsibleParty: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };
  legalRep: {
    type: string;
    nameContact?: string;
    supportingDocumentUrl?: string;
  };
  generalPractitioner: {
    name: string;
    clinic?: string;
    phone: string;
  };
  otherProviders: CareProviderItem[];

  // Step 3: Medical Hx
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  baselineVitals?: BaselineVitals;
  medicationAllergies: string[];
  foodAllergies: string[];
  environmentalAllergies: string[];
  currentMedications: CurrentMedicationItem[];
  chronicConditions: string[];
  pastSurgeries?: string;
  immunizationHistory?: string;
  skinConditionPressureAreas?: string;
  continenceStatus: string;
  sensoryAids?: string;
  dentalStatus?: string;
  substanceUseHistory?: string;
  recentHospitalizations?: string;

  // Step 4: ADL / Psychosocial
  adlKatzMatrix: ADLKatzMatrix;
  adlScore: number;
  mobilityAidsUsed: string[];
  fallRiskScore: string;
  fallsLast6Months?: string;
  ambulationDistance?: string;
  cognitiveScore?: string;
  orientation?: string;
  communicationAbility?: string;
  behavioralConcerns?: string;
  sleepPattern?: string;
  dietType: string;
  textureModification: string;
  feedingAssistanceNeed: string;
  familyInvolvement?: string;
  routinePreferences?: string;

  // Step 5: Legal / Consents
  consentChecklist: ConsentChecklistItem[];
  advanceDirectives: {
    livingWillOnFile: string;
    dnarStatus: string;
    healthcareProxyNamed?: string;
  };
  poaDocumentUrl?: string;
  guardianshipOrderUrl?: string;
  insuranceAssignmentStatus: string;

  // Step 6: Financial
  primaryPaymentMethod: string;
  secondaryCoverage?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  benefitId?: string;
  billingResponsibleParty: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name: string;
    relationship?: string;
    phone?: string;
    address: string;
  };
  agreedRoomRate: number;
  agreedRoomRatePeriod: string;
  depositAmount: number;
  depositDate?: string;
  paymentSchedule: string;
  directDebitDetails?: string;
  financialPoaDocUrl?: string;

  // Step 7: Room / Belongings
  assignedBedId: string;
  roomNumber?: string;
  roomType: string;
  moveInDateTime?: string;
  roommate?: string;
  belongings: BelongingItem[];
  liabilityWaiverSigned: boolean;
  assistiveDevices: string[];
  valuablesInSafe: boolean;
  valuablesDescription?: string;

  // Step 8: Documents
  documents: DocumentChecklistItem[];

  // Step 9: Final Review & Confirmation
  staffDeclarationSigned: boolean;
  admittingStaffName: string;
  confirmationDateTime: string;
}

export type AdmissionStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface AdmissionStepMeta {
  number: AdmissionStep;
  title: string;
  shortTitle: string;
  description: string;
}
