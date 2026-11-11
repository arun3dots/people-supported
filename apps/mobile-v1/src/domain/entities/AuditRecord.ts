export type AuditActionType =
  | 'MEDICATION_ADMINISTRATION'
  | 'OBSERVATION_RECORDED'
  | 'TASK_COMPLETED'
  | 'FLUID_LOGGED'
  | 'INCIDENT_REPORTED'
  | 'HANDOVER_SUBMITTED'
  | 'RESIDENT_PROFILE_VIEWED';

export interface AuditRecord {
  id: string;
  actionType: AuditActionType;
  residentId?: string;
  staffId: string;
  staffName: string;
  role: string;
  timestampUtc: string; // ISO 8601 UTC
  isRetrospectiveEntry: boolean;
  retrospectiveOriginalTime?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
