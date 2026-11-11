import type {
  RiskAssessment,
  RiskControl,
  RiskTemplate,
  Resident,
  User,
} from '@repo/db';
import type { RiskStatus } from '@repo/schema';

export type RiskAssessmentWithRelations = RiskAssessment & {
  controls: RiskControl[];
  template: RiskTemplate | null;
  resident:
    | (Pick<Resident, 'id' | 'fullName' | 'photoUrl'> & {
        bed?: { room: { roomNumber: string } } | null;
      })
    | null;
  approver: Pick<User, 'id' | 'fullName'> | null;
  reviewer: Pick<User, 'id' | 'fullName'> | null;
};

export interface RiskOverviewStats {
  total: number;
  byLevel: { level: string; count: number }[];
  byCategory: { category: string; count: number }[];
  pendingReview: number;
  reviewsDueIn7Days: number;
  highRiskActive: number;
}

export interface ActorContext {
  tenantId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  roleName: string;
  canApprove: boolean;
}

export function actorAuditFields(actor: ActorContext) {
  return {
    tenantId: actor.tenantId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    userFullName: actor.userFullName,
    userRoleName: actor.roleName,
  };
}

export const HIGH_RISK_SCORE_THRESHOLD = 12;

export const ALLOWED_TRANSITIONS: Record<RiskStatus, RiskStatus[]> = {
  Draft: ['Active', 'PendingReview', 'Archived'],
  PendingReview: ['Active', 'Draft', 'Archived'],
  Active: ['PendingReview', 'Archived', 'Draft'],
  Archived: ['Draft', 'Active'],
};

export const RISK_RELATIONS_INCLUDE = {
  controls: { where: { deletedAt: null } },
  template: true,
  resident: {
    select: {
      id: true,
      fullName: true,
      photoUrl: true,
      bed: { select: { room: { select: { roomNumber: true } } } },
    },
  },
  approver: { select: { id: true, fullName: true } },
  reviewer: { select: { id: true, fullName: true } },
} as const;
