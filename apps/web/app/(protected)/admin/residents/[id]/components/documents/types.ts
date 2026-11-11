export interface StandardDocumentSlot {
  type: string;
  name: string;
  subtitle: string;
  required: boolean;
}

export const STANDARD_ADMISSION_DOCUMENTS: StandardDocumentSlot[] = [
  { type: "Proof of Identity", name: "Proof of Identity", subtitle: "Passport, Driving Licence or National ID", required: true },
  { type: "Proof of Address", name: "Proof of Address", subtitle: "Utility bill or Bank Statement", required: true },
  { type: "NHS Number / Medical Record", name: "NHS Number / Medical Record", subtitle: "NHS number confirmation or letter", required: true },
  { type: "GP Registration Letter", name: "GP Registration Letter", subtitle: "Letter from GP Practice", required: true },
  { type: "Previous Care Plan", name: "Previous Care Records", subtitle: "Relevant care and medical history", required: true },
  { type: "Consent to Care & Treatment", name: "Consent to Care & Treatment", subtitle: "Signed consent for care and treatment", required: true },
  { type: "Financial Agreement", name: "Financial Agreement", subtitle: "Funding agreement or self-funding form", required: true },
  { type: "Photo Consent", name: "Photo Consent", subtitle: "Consent for using photos and videos", required: true },
  { type: "Enduring Power of Attorney (LPA)", name: "Enduring Power of Attorney", subtitle: "LPA documents (if applicable)", required: false },
  { type: "Advance Care Directive", name: "Advance Care Plan", subtitle: "Advance decision or care plan", required: false },
  { type: "Insurance Document", name: "Insurance Documents", subtitle: "Private insurance details (if applicable)", required: false },
  { type: "Other Supporting Document", name: "Other Supporting Documents", subtitle: "Any additional relevant documents", required: false },
];

export interface DocumentRowItem {
  id: string;
  name: string;
  category: string;
  status: string;
  uploadedOn: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
}

