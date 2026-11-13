import { AdmissionStepMeta, AdmissionFormData, DocumentChecklistItem } from "../types";

export const ADMISSION_STEPS: AdmissionStepMeta[] = [
  {
    number: 1,
    title: "1. Personal",
    shortTitle: "Personal",
    description: "Personal and demographic information",
  },
  {
    number: 2,
    title: "2. Contacts/POA",
    shortTitle: "Contacts/POA",
    description: "Emergency contacts, responsible party, and providers",
  },
  {
    number: 3,
    title: "3. Medical Hx",
    shortTitle: "Medical Hx",
    description: "Diagnoses, vitals, allergies, and medications",
  },
  {
    number: 4,
    title: "4. ADL/Psychosocial",
    shortTitle: "ADL / Psychosocial",
    description: "Katz Independence Scale, mobility, and preferences",
  },
  {
    number: 5,
    title: "5. Legal/Consents",
    shortTitle: "Legal / Consents",
    description: "Admission agreements and advance directives",
  },
  {
    number: 6,
    title: "6. Financial",
    shortTitle: "Financial",
    description: "Payment method, rates, deposit, and direct debit",
  },
  {
    number: 7,
    title: "7. Room/Belongings",
    shortTitle: "Room / Belongings",
    description: "Room & bed assignment, belongings inventory, and safe items",
  },
  {
    number: 8,
    title: "8. Documents",
    shortTitle: "Documents",
    description: "Document checklist, verification, and uploads",
  },
  {
    number: 9,
    title: "9. Review",
    shortTitle: "Review",
    description: "Final verification, staff sign-off, and admission confirmation",
  },
];

export const DEFAULT_DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  { id: "doc-1", name: "Photo ID (UK Passport / Driving Licence / BRP)", category: "Identification", required: true, status: "Verified" },
  { id: "doc-2", name: "Physician's Admission Order", category: "Medical", required: true, status: "Verified" },
  { id: "doc-3", name: "Medical History & Physical (H&P) Report", category: "Medical", required: true, status: "Verified" },
  { id: "doc-4", name: "Current Medication List", category: "Medications", required: true, status: "Verified" },
  { id: "doc-5", name: "TB Test / Chest X-Ray Result", category: "Clinical", required: true, status: "Uploaded" },
  { id: "doc-6", name: "Immunization Records", category: "Clinical", required: false, status: "Uploaded" },
  { id: "doc-7", name: "Insurance / Payer Card", category: "Financial", required: true, status: "Uploaded" },
  { id: "doc-8", name: "Power of Attorney / Guardianship Document", category: "Legal", required: false, status: "N/A" },
  { id: "doc-9", name: "Advance Directive (Living Will / DNR)", category: "Legal", required: false, status: "N/A" },
  { id: "doc-10", name: "Admission Agreement (signed)", category: "Agreements", required: true, status: "Verified" },
  { id: "doc-11", name: "Resident Rights Acknowledgment (signed)", category: "Agreements", required: true, status: "Verified" },
  { id: "doc-12", name: "Consent Forms (treatment, photo)", category: "Agreements", required: true, status: "Uploaded" },
];

export const ADMISSION_UPLOAD_LIMITS = {
  PHOTO: {
    maxSizeMB: 5,
    accept: "image/png,image/jpeg,image/webp,image/jpg",
    formatsLabel: "JPG, PNG, WEBP",
    hint: "JPG, PNG, WEBP · Max 5MB",
  },
  DOCUMENT: {
    maxSizeMB: 10,
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,application/pdf",
    formatsLabel: "PDF, DOC, DOCX, PNG, JPG",
    hint: "PDF, DOC, DOCX, PNG, JPG · Max 10MB per file",
  },
} as const;

export const DEFAULT_ADMISSION_FORM_DATA: AdmissionFormData = {
  // Step 1: Personal
  firstName: "",
  middleName: "",
  lastName: "",
  fullName: "",
  preferredName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  nhsNumber: "",
  nationalId: "",
  nationalIdType: "",
  religion: "",
  languagesSpoken: [],
  interpreterRequired: false,
  formerOccupation: "",
  hobbies: "",
  previousAddress: "",
  admissionDate: new Date().toISOString().split("T")[0] || "",
  admissionType: "",
  admittedFrom: "",
  referringFacilityName: "",

  // Step 2: Contacts/POA
  primaryContact: {
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    relationship: "",
    phone: "",
    emailAddress: "",
  },
  secondaryContact: {
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    relationship: "",
    phone: "",
    emailAddress: "",
  },
  responsibleParty: {
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    relationship: "",
    phone: "",
    address: "",
  },
  legalRep: {
    type: "",
    nameContact: "",
    supportingDocumentUrl: "",
  },
  generalPractitioner: {
    name: "",
    clinic: "",
    phone: "",
  },
  otherProviders: [],

  // Step 3: Medical Hx
  primaryDiagnosis: "",
  secondaryDiagnoses: [],
  heightCm: undefined,
  weightKg: undefined,
  bmi: undefined,
  baselineVitals: {
    bp: "",
    pulse: undefined,
    temp: undefined,
    respiratoryRate: undefined,
    spO2: undefined,
  },
  medicationAllergies: [],
  foodAllergies: [],
  environmentalAllergies: [],
  currentMedications: [],
  chronicConditions: [],
  pastSurgeries: "",
  immunizationHistory: "",
  skinConditionPressureAreas: "",
  continenceStatus: "Continent",
  sensoryAids: "",
  dentalStatus: "Natural",
  substanceUseHistory: "None",
  recentHospitalizations: "None in past 12 months",

  // Step 4: ADL / Psychosocial
  adlKatzMatrix: {
    bathing: "Independent",
    dressing: "Independent",
    toileting: "Independent",
    transferring: "Independent",
    continence: "Independent",
    eating: "Independent",
  },
  adlScore: 6,
  mobilityAidsUsed: [],
  fallRiskScore: "",
  fallsLast6Months: "",
  ambulationDistance: "",
  cognitiveScore: "",
  orientation: "",
  communicationAbility: "",
  behavioralConcerns: "",
  sleepPattern: "",
  dietType: "",
  textureModification: "",
  feedingAssistanceNeed: "",
  familyInvolvement: "",
  routinePreferences: "",

  // Step 5: Legal / Consents
  consentChecklist: [
    { name: "Admission Agreement", required: true, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
    { name: "Resident Rights Acknowledgment", required: true, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
    { name: "Privacy / GDPR Notice", required: true, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
    { name: "Consent to Treatment", required: true, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
    { name: "Consent to Photograph", required: false, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
    { name: "Grievance Procedure Notice", required: false, signed: true, dateSigned: new Date().toISOString().split("T")[0] },
  ],
  advanceDirectives: {
    livingWillOnFile: "No",
    dnarStatus: "Not yet discussed",
    healthcareProxyNamed: "",
  },
  poaDocumentUrl: "",
  guardianshipOrderUrl: "",
  insuranceAssignmentStatus: "Signed",

  // Step 6: Financial
  primaryPaymentMethod: "Private pay",
  secondaryCoverage: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  benefitId: "",
  billingResponsibleParty: {
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    relationship: "Self",
    phone: "",
    address: "",
  },
  agreedRoomRate: 3500,
  agreedRoomRatePeriod: "Month",
  depositAmount: 1000,
  depositDate: new Date().toISOString().split("T")[0],
  paymentSchedule: "Monthly",
  directDebitDetails: "Set up later",
  financialPoaDocUrl: "",

  // Step 7: Room / Belongings
  assignedBedId: "",
  roomNumber: "",
  roomType: "",
  landlord: "",
  moveInDateTime: "",
  roommate: "",
  belongings: [],
  liabilityWaiverSigned: false,
  assistiveDevices: [],
  valuablesInSafe: false,
  valuablesDescription: "",

  // Step 8: Documents
  documents: DEFAULT_DOCUMENT_CHECKLIST,

  // Step 9: Final Review
  staffDeclarationSigned: false,
  admittingStaffName: "Admissions Coordinator",
  confirmationDateTime: new Date().toLocaleString(),
};

export const CHRONIC_CONDITIONS_LIST = [
  "Diabetes (Type 2)",
  "Hypertension",
  "Cardiac Disease (CAD/CHF)",
  "Respiratory (COPD/Asthma)",
  "Renal Disease",
  "Stroke / CVA",
  "Cancer History",
  "Dementia / Alzheimer's",
  "Parkinson's Disease",
  "Arthritis / Osteoarthritis",
  "Osteoporosis",
  "Depression / Anxiety",
];

export const PAYMENT_METHODS = [
  "Private pay",
  "Long-term care insurance",
  "Government scheme",
  "Local authority funded",
  "Insurance",
];

export const LEGAL_REP_TYPES = [
  "None",
  "POA",
  "Medical POA",
  "Durable POA",
  "Guardian",
  "Committee",
];
