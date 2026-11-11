export interface ResidentDocumentItem {
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  isRequired: boolean;
  dateStr: string;
  fileType: 'PDF' | 'DOC' | 'IMG';
  mimeType?: string;
  fileSize?: string;
  viewUrl: string;
  downloadUrl?: string;
}

export const RESIDENT_DOCUMENT_CATEGORIES = [
  'Care Plan',
  'Medical Report',
  'Risk Assessment',
  'Legal & Consent',
  'ID & Proof of Address',
  'Prescription',
  'Hospital Discharge',
  'General',
  'Other',
] as const;
