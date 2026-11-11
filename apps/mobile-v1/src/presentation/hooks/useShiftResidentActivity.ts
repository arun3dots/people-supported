import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT_TIMELINE } from '@repo/endpoints';
import type { Resident } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { useAuth } from '../context/AuthContext';
import type { ResidentTimelineItem } from './useResidentDetail';

export interface ShiftResidentActivity extends ResidentTimelineItem {
  residentName: string;
  residentId: string;
}

interface ResidentTimelineWithCarerId extends ResidentTimelineItem {
  carer?: {
    id?: string;
    fullName?: string;
  } | null;
}

interface ResidentAccessAudit {
  id: string;
  actionType: string;
  timestamp: string;
  userFullName?: string | null;
}

interface AuditLogsResponse {
  data?: ResidentAccessAudit[];
}

export function useShiftResidentActivity(
  residents: Resident[],
  currentUserId?: string
) {
  const { user } = useAuth();
  const canReadAuditLogs = ['admin', 'manager', 'superadmin'].includes(
    (user?.roleName || '').toLowerCase()
  );
  const residentIds = residents.map((resident) => resident.id).filter(Boolean);

  const query = useQuery<ShiftResidentActivity[]>({
    queryKey: ['shift-resident-activity', currentUserId, canReadAuditLogs, ...residentIds],
    queryFn: async () => {
      if (!currentUserId || residents.length === 0) return [];
      try {
        const results = await Promise.allSettled(
          residents.map(async (resident) => {
            const timelinePromise = makeMobileApiCall<ResidentTimelineWithCarerId[]>(
              GET_RESIDENT_TIMELINE,
              undefined,
              undefined,
              { id: resident.id }
            ).catch(() => [] as ResidentTimelineWithCarerId[]);

            // Backend restricts GET /api/audit-logs to Admin and Manager roles (@Roles('Admin', 'Manager'))
            const auditPromise = canReadAuditLogs
              ? makeMobileApiCall<AuditLogsResponse>(
                  'getAuditLogs',
                  undefined,
                  {
                    entityId: resident.id,
                    actionType: 'RESIDENT_RECORD_VIEWED',
                    userId: currentUserId,
                    limit: 10,
                  }
                ).catch(() => ({ data: [] as ResidentAccessAudit[] }))
              : Promise.resolve({ data: [] as ResidentAccessAudit[] });

            const [timeline, accessAudit] = await Promise.all([timelinePromise, auditPromise]);

            const timelineItems = Array.isArray(timeline) ? timeline : [];
            const auditItems = Array.isArray(accessAudit?.data) ? accessAudit.data : [];

            return [
              ...timelineItems.map((activity) => ({
                ...activity,
                residentName: resident.fullName,
                residentId: resident.id,
              })),
              ...auditItems.map((entry) => ({
                id: entry.id,
                eventType: entry.actionType,
                summary: 'Resident profile viewed',
                timestamp: entry.timestamp,
                carer: { fullName: entry.userFullName ?? 'Staff member' },
                residentName: resident.fullName,
                residentId: resident.id,
              })),
            ];
          })
        );

        const activities: ShiftResidentActivity[] = [];
        for (const res of results) {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            activities.push(...res.value);
          }
        }

        return activities
          .sort(
            (first, second) =>
              new Date(second.timestamp).getTime() -
              new Date(first.timestamp).getTime()
          )
          .slice(0, 15);
      } catch (error) {
        safeLogger.warn('Failed to load recent activity for current-shift residents', error);
        return [];
      }
    },
    enabled: residentIds.length > 0 && Boolean(currentUserId),
    staleTime: 1000 * 30,
    retry: 1,
  });

  return {
    activities: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
