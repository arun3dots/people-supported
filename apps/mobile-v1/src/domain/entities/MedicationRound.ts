export type MedicationStatus = 'Pending' | 'Given' | 'Refused' | 'Omitted' | 'NPO';

export interface MedicationRoundItem {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  drugName: string;
  dose: string;
  form: string; // Tablet, Capsule, Liquid, Patch, Injection
  route: string; // Oral, Topical, Subcutaneous
  scheduledTime: string; // "08:00", "12:00", "18:00", "22:00"
  instructions?: string;
  isControlledDrug: boolean;
  status: MedicationStatus;
  administeredAt?: string | null;
  administeredByStaffName?: string | null;
  witnessStaffName?: string | null;
  reason?: string | null;
}
