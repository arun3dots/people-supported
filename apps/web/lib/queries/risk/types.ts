// Local response shapes — these mirror backend RiskAssessmentWithRelations.
// When @repo/schema response types land (Refactor.md Phase 9), these get
// replaced by canonical imports.

import type { RiskCategory, RiskLevel, RiskStatus } from "@repo/schema";

export interface RiskControlResponse {
  id: string;
  riskAssessmentId: string;
  description: string;
  isExisting: boolean;
  assignedToId: string | null;
  dueDate: string | null;
  status: "Pending" | "InProgress" | "Completed" | "Overdue";
  completedAt: string | null;
  completedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessmentResponse {
  id: string;
  tenantId: string;
  residentId: string;
  templateId: string | null;
  category: RiskCategory;
  title: string;
  hazardDescription: string;
  tool: string | null;
  likelihood: number;
  severity: number;
  inherentScore: number;
  inherentLevel: RiskLevel;
  residualLikelihood: number | null;
  residualSeverity: number | null;
  residualScore: number | null;
  residualLevel: RiskLevel | null;
  status: RiskStatus;
  reviewFrequency: string;
  nextReviewDate: string;
  factors: unknown;
  approvedById: string | null;
  approvedAt: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  controls: RiskControlResponse[];
  template: { id: string; name: string; category: string } | null;
  resident: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    bed?: { room: { roomNumber: string } } | null;
  } | null;
  approver: { id: string; fullName: string } | null;
  reviewer: { id: string; fullName: string } | null;
}

export interface RiskTemplateResponse {
  id: string;
  tenantId: string | null;
  name: string;
  category: RiskCategory;
  hazardDescription: string;
  tool: string | null;
  defaultLikelihood: number;
  defaultSeverity: number;
  defaultControls: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAlertResponse {
  id: string;
  tenantId: string;
  recipientId: string;
  riskAssessmentId: string | null;
  type: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface RiskOverviewResponse {
  total: number;
  byLevel: { level: string; count: number }[];
  byCategory: { category: string; count: number }[];
  pendingReview: number;
  reviewsDueIn7Days: number;
  highRiskActive: number;
}
