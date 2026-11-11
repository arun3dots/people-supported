export interface PlanItem {
  id: string;
  versionNumber: number;
  status: string;
  validFrom: string | Date;
  validTo?: string | Date | null;
  nextReviewDate?: string | Date | null;
  approvedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
  description?: string | null;
  authorRole?: string | null;
  authorId?: string | null;
  approvedById?: string | null;
  clinicalApproverId?: string | null;
  managerApproverId?: string | null;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    status?: string;
    nhsNumber?: string | null;
    bed?: {
      room?: {
        roomNumber?: string;
        wing?: {
          name?: string;
        } | null;
      } | null;
    } | null;
    keyworker?: {
      id?: string;
      fullName?: string;
      role?: {
        name?: string;
      } | null;
    } | null;
  } | null;
  goals?: Array<{ id: string; status: string; progressPercent: number }>;
  tasks?: Array<{ id: string; status: string }>;
  approvals?: Array<{ id: string; status: string; approvedAt?: string | null }>;
}

export type CarePlanFilterTab =
  | "ALL"
  | "MISSING"
  | "DRAFT"
  | "AWAITING_APPROVAL"
  | "RETURNED"
  | "ACTIVE"
  | "REVIEW_OVERDUE"
  | "DUE_14_DAYS"
  | "RECORD_CHANGED"
  | "UPDATED_7_DAYS";

export type ReviewDueFilter = "ANY" | "OVERDUE" | "14_DAYS" | "30_DAYS";
