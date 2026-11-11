import { prisma } from '@repo/db';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from './notifications.types';

export type MatrixSourceCode =
  | 'EMAR-001'
  | 'EMAR-007'
  | 'EMAR-004'
  | 'MH-001'
  | 'MH-009'
  | 'MH-007'
  | 'INC-004'
  | 'INC-003'
  | 'INC-005'
  | 'INC-006'
  | 'CP-007'
  | 'MH-011'
  | 'CP-008'
  | 'HR-002'
  | 'HR-004'
  | 'ROT-004'
  | 'ROT-001'
  | 'FIN-002/FIN-005'
  | 'RM-006'
  | 'CQC-001';

export type TenantRoleName = 'Admin' | 'Manager' | 'Nurse' | 'Carer';

export interface MatrixNotificationRule {
  code: MatrixSourceCode;
  notification: string;
  trigger: string;
  channels: NotificationChannel[];
  inApp: boolean;
  recipientRoles: TenantRoleName[];
  onShiftRoles?: TenantRoleName[];
  priority: NotificationPriority;
  category: NotificationCategory;
  immediate?: boolean;
}

/**
 * Canonical 20-Row Notification Matrix (CQC / NICE / Statutory Care Operations).
 * Maps every row from the product Notification Matrix to its channels, recipients,
 * priority, and category.
 */
export const NOTIFICATION_MATRIX: Record<
  MatrixSourceCode,
  MatrixNotificationRule
> = {
  'EMAR-001': {
    code: 'EMAR-001',
    notification: 'Medication due/overdue',
    trigger: 'Drug round starting or >30 min overdue',
    channels: ['MOBILE_PUSH', 'WEB_PUSH'],
    inApp: true,
    recipientRoles: ['Carer'],
    onShiftRoles: ['Carer'],
    priority: 'High',
    category: 'MEDICATION',
  },
  'EMAR-007': {
    code: 'EMAR-007',
    notification: 'Medication error',
    trigger: 'Error recorded in eMAR',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager', 'Nurse'],
    priority: 'Critical',
    category: 'MEDICATION',
    immediate: true,
  },
  'EMAR-004': {
    code: 'EMAR-004',
    notification: 'Controlled drug discrepancy',
    trigger: 'Balance mismatch on reconciliation',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'MEDICATION',
    immediate: true,
  },
  'MH-001': {
    code: 'MH-001',
    notification: 'Suicide/self-harm risk — Critical rating',
    trigger: 'New Critical-rated assessment saved',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    onShiftRoles: ['Nurse', 'Carer'],
    priority: 'Critical',
    category: 'CLINICAL',
    immediate: true,
  },
  'MH-009': {
    code: 'MH-009',
    notification: 'Observation check overdue',
    trigger: 'Scheduled check-in time elapsed',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    onShiftRoles: ['Carer', 'Nurse'],
    priority: 'Critical',
    category: 'CLINICAL',
  },
  'MH-007': {
    code: 'MH-007',
    notification: 'Restraint used',
    trigger: 'Restraint Documentation record created',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'SAFEGUARDING',
    immediate: true,
  },
  'INC-004': {
    code: 'INC-004',
    notification: 'Safeguarding referral 24-hr countdown',
    trigger: 'Serious concern referral decision made',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'SAFEGUARDING',
  },
  'INC-003': {
    code: 'INC-003',
    notification: 'RIDDOR threshold met',
    trigger: 'Incident meets RIDDOR criteria',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'INCIDENT',
  },
  'INC-005': {
    code: 'INC-005',
    notification: 'Duty of Candour 10-day deadline',
    trigger: 'Qualifying incident recorded (escalating 7/3/1 days)',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'High',
    category: 'COMPLIANCE',
  },
  'INC-006': {
    code: 'INC-006',
    notification: 'CQC notification threshold met',
    trigger: 'Incident/safeguarding meets Reg 18 criteria',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'COMPLIANCE',
  },
  'CP-007': {
    code: 'CP-007',
    notification: 'DoLS/LPS renewal approaching',
    trigger: '28/14/7/1 days before expiry',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'High',
    category: 'COMPLIANCE',
  },
  'MH-011': {
    code: 'MH-011',
    notification: 'MHA renewal/tribunal approaching',
    trigger: '28/14/7/1 days before date',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'High',
    category: 'COMPLIANCE',
  },
  'CP-008': {
    code: 'CP-008',
    notification: 'Care plan review due',
    trigger: 'Review date reached or 14 days prior',
    channels: ['IN_APP'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager', 'Nurse'],
    priority: 'Medium',
    category: 'CARE_PLAN',
  },
  'HR-002': {
    code: 'HR-002',
    notification: 'DBS expiry approaching',
    trigger: '3 months before expiry',
    channels: ['IN_APP', 'EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'High',
    category: 'HR',
  },
  'HR-004': {
    code: 'HR-004',
    notification: 'Training below threshold',
    trigger: 'Team completion <80%',
    channels: ['EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Medium',
    category: 'HR',
  },
  'ROT-004': {
    code: 'ROT-004',
    notification: 'Staffing below minimum',
    trigger: 'Shift below safe staffing ratio',
    channels: ['IN_APP', 'MOBILE_PUSH', 'WEB_PUSH'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Critical',
    category: 'ROTA',
  },
  'ROT-001': {
    code: 'ROT-001',
    notification: 'Shift unconfirmed',
    trigger: '24 hrs before shift, staff not confirmed',
    channels: ['MOBILE_PUSH', 'WEB_PUSH', 'SMS'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Medium',
    category: 'ROTA',
  },
  'FIN-002/FIN-005': {
    code: 'FIN-002/FIN-005',
    notification: 'Invoice overdue',
    trigger: 'Payment past due date',
    channels: ['EMAIL'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Medium',
    category: 'FINANCE',
  },
  'RM-006': {
    code: 'RM-006',
    notification: 'Vacancy alert',
    trigger: 'Bed vacant beyond configurable threshold',
    channels: ['IN_APP'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Medium',
    category: 'OCCUPANCY',
  },
  'CQC-001': {
    code: 'CQC-001',
    notification: 'SAF theme score drop',
    trigger: 'Evidence strength declines on a theme',
    channels: ['IN_APP'],
    inApp: true,
    recipientRoles: ['Admin', 'Manager'],
    priority: 'Medium',
    category: 'COMPLIANCE',
  },
};

/**
 * Resolves recipient user IDs for a given matrix rule within a tenant,
 * combining role-based recipients, active on-shift staff, and explicit user IDs.
 */
export async function resolveMatrixRecipients(params: {
  tenantId: string;
  rule: MatrixNotificationRule;
  explicitRecipientIds?: string[];
  residentId?: string;
}): Promise<string[]> {
  const recipientIds = new Set<string>(params.explicitRecipientIds ?? []);

  if (params.rule.recipientRoles.length > 0) {
    const roleUsers = await prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
        isActive: true,
        role: { name: { in: params.rule.recipientRoles } },
      },
      select: { id: true },
    });
    for (const u of roleUsers) {
      recipientIds.add(u.id);
    }
  }

  if (params.rule.onShiftRoles && params.rule.onShiftRoles.length > 0) {
    const now = new Date();
    const activeAssignments = await prisma.shiftAssignment.findMany({
      where: {
        deletedAt: null,
        shift: {
          tenantId: params.tenantId,
          deletedAt: null,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        ...(params.residentId
          ? { assignedResidentIds: { has: params.residentId } }
          : {}),
        user: {
          isActive: true,
          role: { name: { in: params.rule.onShiftRoles } },
        },
      },
      select: { userId: true },
    });

    for (const a of activeAssignments) {
      recipientIds.add(a.userId);
    }

    // Fallback: if no active shift assignment matched for this resident, include active users in onShiftRoles
    if (activeAssignments.length === 0) {
      const fallbackStaff = await prisma.user.findMany({
        where: {
          tenantId: params.tenantId,
          isActive: true,
          role: { name: { in: params.rule.onShiftRoles } },
        },
        select: { id: true },
      });
      for (const s of fallbackStaff) {
        recipientIds.add(s.id);
      }
    }
  }

  return Array.from(recipientIds);
}
