/**
 * CQC/NHS Audit Event Types
 * Typed interfaces for every auditable event in the system.
 */

// Categories
export type AuditCategory =
  | 'AUTH'
  | 'PAGE_VIEW'
  | 'MEDICATION'
  | 'CARE_PLAN'
  | 'SAFEGUARDING'
  | 'DATA_ACCESS'
  | 'CLINICAL_DOC'
  | 'STAFF_ACTIVITY'
  | 'CONSENT'
  | 'SYSTEM'
  | 'LEGACY';

// Actions per category
export type AuthAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'FORGOT_PASSWORD_REQUESTED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_SECRET_GENERATED'
  | 'MFA_VERIFIED'
  | 'MFA_VERIFY_FAILED'
  | 'MFA_RESET_REQUESTED'
  | 'MFA_RESET_VERIFIED'
  | 'MFA_RESET_COMPLETED'
  | 'TOKEN_ROTATED'
  | 'ROLE_CHANGED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'DATA_EXPORTED'
  | 'BRANCH_SWITCHED';

export type MedicationAction =
  | 'DOSE_GIVEN'
  | 'DOSE_MISSED'
  | 'DOSE_REFUSED'
  | 'DOSE_WITHHELD'
  | 'MAR_CREATED'
  | 'MAR_UPDATED'
  | 'MEDICATION_ROUND_CREATED'
  | 'MEDICATION_ROUND_DELETED'
  | 'MEDICATION_PRESCRIPTION_CREATED'
  | 'MEDICATION_PRESCRIPTION_STOPPED'
  | 'MEDICATION_PRESCRIPTION_CHANGED'
  | 'MEDICATION_PRESCRIPTION_PAUSED'
  | 'CONTROLLED_DRUG_RECORDED'
  | 'STOCK_ADJUSTED';

export type CarePlanAction =
  | 'CARE_PLAN_CREATED'
  | 'CARE_PLAN_UPDATED'
  | 'CARE_PLAN_REVIEWED'
  | 'CARE_PLAN_APPROVED'
  | 'CARE_PLAN_ARCHIVED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'ACTIVATED'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'CREATED'
  | 'FIELD_CHANGED'
  | 'TASK_COMPLETED'
  | 'TASK_SKIPPED'
  | 'GOAL_ADDED'
  | 'GOAL_RETIRED'
  | 'TASK_ADDED'
  | 'TASK_REMOVED';

export type SafeguardingAction =
  | 'INCIDENT_REPORTED'
  | 'INCIDENT_REVIEWED'
  | 'INCIDENT_ACTIONED'
  | 'INCIDENT_CLOSED'
  | 'REFERRAL_MADE';

export type DataAccessAction =
  | 'RESIDENT_LIST_VIEWED'
  | 'RESIDENT_RECORD_VIEWED'
  | 'RESIDENT_EMERGENCY_VIEWED'
  | 'STAFF_LIST_VIEWED'
  | 'STAFF_RECORD_VIEWED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'REPORT_DOWNLOADED'
  | 'DATA_EXPORTED'
  | 'VIEW_OBSERVATIONS'
  | 'VIEW_OBSERVATION'
  | 'VIEW_INCIDENT'
  | 'VIEW_CONTROLLED_DRUG_REGISTER'
  | 'VIEW_CARE_NOTE'
  | 'VIEW_COMPLAINT'
  | 'VIEW_SAFEGUARDING';

export type ClinicalDocAction =
  | 'RISK_ASSESSMENT_CREATED'
  | 'RISK_ASSESSMENT_UPDATED'
  | 'RISK_ASSESSMENT_VIEWED'
  | 'RISK_ASSESSMENT_TRANSITIONED'
  | 'RISK_ASSESSMENT_APPROVED'
  | 'RISK_ASSESSMENT_REVIEW_DUE'
  | 'RISK_ASSESSMENT_DELETED'
  | 'RISK_CONTROL_CREATED'
  | 'RISK_CONTROL_UPDATED'
  | 'RISK_CONTROL_COMPLETED'
  | 'RISK_TEMPLATE_CREATED'
  | 'RISK_TEMPLATE_UPDATED'
  | 'RISK_TEMPLATE_DELETED'
  | 'CARE_NOTE_ADDED'
  | 'CARE_NOTE_UPDATED'
  | 'CARE_NOTE_DELETED'
  | 'BODY_MAP_UPDATED'
  | 'CARE_NOTE_AMENDED'
  | 'OBSERVATION_RECORDED'
  | 'OBSERVATION_AMENDED'
  | 'OBSERVATION_CORRECTED'
  | 'MEDICATION_ADMINISTERED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_ARCHIVED'
  | 'DOCUMENT_RESTORED'
  | 'PRE_ADMISSION_CREATED'
  | 'PRE_ADMISSION_UPDATED'
  | 'PRE_ADMISSION_VIEWED'
  | 'PRE_ADMISSION_SUBMITTED'
  | 'PRE_ADMISSION_DECIDED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_UPDATED'
  | 'ASSESSMENT_VIEWED'
  | 'ASSESSMENT_COMPLETED'
  | 'NEED_CARE_PLAN_UPDATED'
  | 'NEED_CARE_PLAN_AGREED'
  | 'CARE_TASK_CREATED'
  | 'CARE_TASK_UPDATED'
  | 'CARE_TASK_RECORDED'
  | 'CARE_TASK_UNDONE'
  | 'SHIFT_NOTE_ADDED';

export type StaffActivityAction =
  | 'SHIFT_STARTED'
  | 'SHIFT_ENDED'
  | 'SHIFT_HANDOVER_SUBMITTED'
  | 'TASK_DELEGATED'
  | 'HANDOVER_NOTE_ADDED'
  | 'RTW_UPDATED'
  | 'DBS_UPDATED'
  | 'HEALTH_CLEARANCE_UPDATED'
  | 'COMPLIANCE_DOC_UPLOADED'
  | 'CERTIFICATION_CREATED'
  | 'IMMUNISATION_CREATED'
  | 'IMMUNISATION_UPDATED'
  | 'IMMUNISATION_DELETED';

export type SystemAction =
  | 'ROLE_PERMISSIONS_CHANGED'
  | 'FACILITY_CREATED'
  | 'FACILITY_UPDATED'
  | 'FACILITY_DELETED'
  | 'TENANT_RETENTION_POLICY_UPDATED'
  | 'TENANT_OFFBOARDING_EXPORT_REQUESTED'
  | 'TENANT_OFFBOARDING_PURGED'
  | 'COMPLAINT_REGISTERED'
  | 'COMPLAINT_UPDATED'
  | 'SAFEGUARDING_REFERRAL_CREATED'
  | 'SAFEGUARDING_REFERRAL_UPDATED';

export type ConsentAction =
  | 'CONSENT_GRANTED'
  | 'CONSENT_WITHDRAWN'
  | 'CONSENT_REVIEWED'
  | 'DPA_ACCEPTED';

// Base event shape
export interface BaseAuditEvent {
  tenantId?: string | null; // Nullable for platform-level events (failed logins)
  userId?: string | null; // Nullable for system events
  userEmail?: string; // Denormalised at point of write
  userFullName?: string; // Denormalised at point of write
  userRoleName?: string; // Denormalised role at point of event
  categoryType: AuditCategory;
  actionType: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string; // Human-readable (e.g. resident name)
  residentId?: string;
  description?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  latitude?: number; // Best-effort client-reported GPS latitude (PAGE_VIEW)
  longitude?: number; // Best-effort client-reported GPS longitude (PAGE_VIEW)
  locationName?: string; // Reverse-geocoded place name (best-effort, PAGE_VIEW)
}

// Specific event shapes
export interface AuthAuditEvent extends BaseAuditEvent {
  categoryType: 'AUTH';
  actionType: AuthAction;
  metadata?: {
    failureReason?: string; // For FAILED_LOGIN
    previousRoleId?: string; // For ROLE_CHANGED
    newRoleId?: string;
    exportType?: string; // For DATA_EXPORTED
    mfaDisabled?: boolean;
    [key: string]: unknown;
  };
}

export interface MedicationAuditEvent extends BaseAuditEvent {
  categoryType: 'MEDICATION';
  actionType: MedicationAction;
  entityType?:
    | 'MedicationRound'
    | 'MedicationPrescription'
    | 'MedAdministration'
    | 'ControlledDrugRegister';
  metadata?: {
    drugName?: string;
    dose?: string;
    form?: string;
    scheduledTime?: string;
    administeredTime?: string;
    witnessId?: string; // CQC requirement: witness for controlled drugs
    witnessName?: string;
    refusalReason?: string; // For DOSE_REFUSED
    withheldReason?: string; // For DOSE_WITHHELD
    [key: string]: unknown;
  };
}

export interface CarePlanAuditEvent extends BaseAuditEvent {
  categoryType: 'CARE_PLAN';
  actionType: CarePlanAction;
  entityType?: string;
  metadata?: {
    sectionName?: string;
    version?: number;
    changeReason?: string;
    approverId?: string;
    approverName?: string;
    [key: string]: unknown;
  };
}

export interface SafeguardingAuditEvent extends BaseAuditEvent {
  categoryType: 'SAFEGUARDING';
  actionType: SafeguardingAction;
  entityType?: 'Incident' | 'SafeguardingReferral';
  metadata?: {
    harmLevel?: number;
    category?: string;
    reviewerId?: string;
    reviewerName?: string;
    referralTarget?: string; // e.g. 'CQC' | 'LocalAuthority' | 'Police'
    responseTimeMinutes?: number;
    [key: string]: unknown;
  };
}

export interface DataAccessAuditEvent extends BaseAuditEvent {
  categoryType: 'DATA_ACCESS';
  actionType: DataAccessAction;
  entityType?:
    | 'Resident'
    | 'Document'
    | 'Staff'
    | 'User'
    | 'Observation'
    | 'SafeguardingReferral'
    | 'Complaint'
    | 'ControlledDrugRegister'
    | 'ResidentConsent';
  metadata?: {
    accessMode?: 'EMERGENCY_DIRECTORY'; // Read-only break-glass access outside normal assignment
    isAssignedResident?: boolean;
    [key: string]: unknown;
  };
}

export interface ClinicalDocAuditEvent extends BaseAuditEvent {
  categoryType: 'CLINICAL_DOC';
  actionType: ClinicalDocAction;
}

export interface ConsentAuditEvent extends BaseAuditEvent {
  categoryType: 'CONSENT';
  actionType: ConsentAction;
  metadata?: {
    consentType?: string; // 'Photography' | 'DataSharing' | 'Research'
    consentedBy?: string; // Resident or PoA
    [key: string]: unknown;
  };
}

export interface SystemAuditEvent extends BaseAuditEvent {
  categoryType: 'SYSTEM';
  actionType: SystemAction;
}

// Union type for all audit events
export type AuditEvent =
  | AuthAuditEvent
  | MedicationAuditEvent
  | CarePlanAuditEvent
  | SafeguardingAuditEvent
  | DataAccessAuditEvent
  | ClinicalDocAuditEvent
  | ConsentAuditEvent
  | SystemAuditEvent
  | BaseAuditEvent;

// BullMQ job data shape
export interface AuditJobData {
  event: AuditEvent;
  enqueuedAt: string; // ISO string
}
