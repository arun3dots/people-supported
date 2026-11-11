import { Prisma } from '@repo/audit-db';

export function buildAreaFilter(
  area?: string,
): Prisma.CqcAuditLogWhereInput | null {
  if (!area || area === 'all') return null;

  switch (area.toLowerCase()) {
    case 'care_log':
    case 'care log':
      return {
        OR: [
          { actionType: { contains: 'CARE_NOTE', mode: 'insensitive' } },
          { actionType: { contains: 'CARE_LOG', mode: 'insensitive' } },
        ],
      };
    case 'care_plan':
    case 'care plan':
      return {
        OR: [
          { categoryType: 'CARE_PLAN' },
          { actionType: { contains: 'CARE_PLAN', mode: 'insensitive' } },
          {
            actionType: {
              in: [
                'SUBMITTED',
                'APPROVED',
                'REJECTED',
                'CHANGES_REQUESTED',
                'ACTIVATED',
                'EXPIRED',
                'SUPERSEDED',
                'GOAL_ADDED',
                'GOAL_RETIRED',
              ],
            },
          },
        ],
      };
    case 'assessment':
      return {
        AND: [
          { actionType: { contains: 'ASSESSMENT', mode: 'insensitive' } },
          { NOT: { actionType: { contains: 'RISK', mode: 'insensitive' } } },
        ],
      };
    case 'medication':
      return {
        OR: [
          { categoryType: 'MEDICATION' },
          { actionType: { contains: 'MEDICATION', mode: 'insensitive' } },
          { actionType: { contains: 'DOSE', mode: 'insensitive' } },
          { actionType: { contains: 'MAR', mode: 'insensitive' } },
        ],
      };
    case 'incident':
      return {
        OR: [
          { categoryType: 'SAFEGUARDING' },
          { actionType: { contains: 'INCIDENT', mode: 'insensitive' } },
          { actionType: { contains: 'REFERRAL', mode: 'insensitive' } },
        ],
      };
    case 'tasks':
      return {
        actionType: { contains: 'TASK', mode: 'insensitive' },
      };
    case 'handover':
      return {
        actionType: { contains: 'HANDOVER', mode: 'insensitive' },
      };
    case 'access':
      return {
        OR: [
          { categoryType: { in: ['AUTH', 'DATA_ACCESS', 'PAGE_VIEW'] } },
          {
            actionType: {
              in: [
                'LOGIN',
                'LOGOUT',
                'FAILED_LOGIN',
                'MFA_LOGIN',
                'PAGE_VIEW',
                'PAGE_VIEWED',
                'PASSWORD_RESET',
                'PASSWORD_CHANGED',
                'RESIDENT_RECORD_VIEWED',
                'DOCUMENT_VIEWED',
                'DOCUMENT_DOWNLOADED',
              ],
            },
          },
        ],
      };
    case 'rota':
      return {
        OR: [
          { actionType: { contains: 'SHIFT', mode: 'insensitive' } },
          { actionType: { contains: 'ROTA', mode: 'insensitive' } },
        ],
      };
    case 'staff':
      return {
        OR: [
          { categoryType: 'STAFF_ACTIVITY' },
          { actionType: { contains: 'STAFF', mode: 'insensitive' } },
          {
            actionType: {
              in: [
                'RTW_UPDATED',
                'DBS_UPDATED',
                'HEALTH_CLEARANCE_UPDATED',
                'COMPLIANCE_DOC_UPLOADED',
                'CERTIFICATION_CREATED',
                'IMMUNISATION_CREATED',
                'IMMUNISATION_UPDATED',
                'IMMUNISATION_DELETED',
              ],
            },
          },
        ],
      };
    case 'observation':
      return {
        actionType: { contains: 'OBSERVATION', mode: 'insensitive' },
      };
    case 'body_map':
    case 'body map':
      return {
        actionType: { contains: 'BODY_MAP', mode: 'insensitive' },
      };
    case 'risk':
      return {
        OR: [
          { actionType: { contains: 'RISK', mode: 'insensitive' } },
          { actionType: { contains: 'HAZARD', mode: 'insensitive' } },
        ],
      };
    default:
      return null;
  }
}
