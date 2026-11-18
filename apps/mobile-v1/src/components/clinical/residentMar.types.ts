export interface ScheduledMedication {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  prescribedBy: string;
  startDate: string;
  notes: string;
  status: 'Due' | 'Administered' | 'Missed' | 'On Hold' | 'Refused' | 'Omitted' | 'NPO' | 'Not recorded';
  isControlledDrug?: boolean;
  rawScheduledDate?: string | Date | null;
}

export interface PrnMedication {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  indication: string;
  maxDose: string;
  isControlledDrug?: boolean;
  notes?: string;
}

export interface RecentMedicationAdmin {
  status: string;
  recordedAt: string;
  id: string;
  drugName: string;
  dose: string;
  route: string;
  time: string;
  dateStr: string;
  administeredBy: string;
}

export interface MarAdminActionItem {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  scheduledTime: string;
  isControlledDrug?: boolean;
  notes?: string;
  isPrn?: boolean;
}

export interface AdministrationVitals {
  bpSystolic?: string;
  bpDiastolic?: string;
  pulse?: string;
  temp?: string;
  spo2?: string;
  bloodSugar?: string;
}
