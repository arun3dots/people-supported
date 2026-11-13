
import type { SupportedLivingDetailsDTO, PreAdmissionRecordDTO } from '@repo/schema';
import { residentDetailFromRecord } from './residentRecordedData';

export interface ResidentTimelineItem {
  id: string;
  eventType: string;
  summary: string;
  timestamp: string;
  carer?: {
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

export interface ResidentContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface ResidentDetailData {
  preAdmissions?: Partial<PreAdmissionRecordDTO>[];
  allergySummary?: string | null;
  fallsRiskLevel?: string | null;
  id: string;
  fullName: string;
  dob?: string | null;
  nhsNumber?: string | null;
  status: string;
  fundingType?: string | null;
  admissionDate?: string | null;
  photoUrl?: string | null;
  dnarStatus?: boolean;
  gpDetails?: {
    gpName?: string;
    practice?: string;
    phone?: string;
    email?: string;
  } | null;
  nextOfKin?: ResidentContact | ResidentContact[] | null;
  profile?: {
    preferredName?: string | null;
    gender?: string | null;
    formerOccupation?: string | null;
    hobbies?: string | null;
    religion?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    postcode?: string | null;
    insuranceProvider?: string | null;
  } | null;
  admission?: {
    admissionReason?: string | null;
    payer?: string | null;
    insurancePolicyNumber?: string | null;
    secondaryCoverage?: string | null;
    stayType?: string | null;
    agreedRoomRate?: number | null;
    expectedDischargeDate?: string | null;
  } | null;
  careProfile?: {
    careCategory?: string | null;
    primaryCareNeed?: string | null;
    primaryDiagnosis?: string | null;
    secondaryDiagnoses?: string[];
    chronicConditions?: string[];
    feedingAssistanceNeed?: string | null;
    supportRequired?: string[];
    allergies?: string[];
    medicationAllergies?: string[];
    foodAllergies?: string[];
    mobility?: string | null;
    mobilityAidsUsed?: string[];
    dietType?: string | null;
    dietaryRequirements?: string[];
    routinePreferences?: string | null;
    hospitalConsultant?: string | null;
    hospitalName?: string | null;
    communityNursePhone?: string | null;
  } | null;
  bed?: {
    number?: string | null;
    bedLabel?: string | null;
    room?: {
      roomNumber?: string | null;
      name?: string | null;
      wing?: {
        name?: string | null;
        scheme?: string | null;
      } | null;
    } | null;
  } | null;
  supportedLivingDetails?: SupportedLivingDetailsDTO | null;
  keyworker?: {
    id: string;
    fullName: string;
  } | null;
  observations?: Array<{
    id: string;
    news2Score?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    pulse?: number | null;
    temp?: number | null;
    spo2?: number | null;
    respiration?: number | null;
    spo2Scale?: number | null;
    airOrOxygen?: 'Air' | 'Oxygen' | null;
    consciousness?: string | null;
    isAbnormal?: boolean | null;
    notifyGP?: boolean | null;
    increaseMonitoring?: boolean | null;
    timestamp: string;
    notes?: string | null;
    createdById?: string | null;
  }>;
}

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT, GET_RESIDENTS, GET_RESIDENT_TIMELINE } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { useAuth } from '../context/AuthContext';

export function useResidentDetail(initialId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const canReadAuditLogs = ['admin', 'manager', 'superadmin'].includes(
    (user?.roleName || '').toLowerCase()
  );
  const residentQuery = useQuery<ResidentDetailData | null>({
    queryKey: ['resident-detail', initialId || 'primary'],
    queryFn: async () => {
      const targetId = initialId;

      if (!targetId) {
        throw new Error('No resident identifier available');
      }

      const record = await makeMobileApiCall<ResidentDetailData>(
        GET_RESIDENT,
        undefined,
        undefined,
        { id: targetId }
      );
      if (!record.preAdmissions) {
        const response = await makeMobileApiCall<ResidentDetailData[] | { data: ResidentDetailData[] }>(
          GET_RESIDENTS, undefined, { all: true, assignedOnly: true },
        );
        const directory = Array.isArray(response) ? response : response.data;
        const samePerson = directory.find((person) => person.id === targetId);
        record.preAdmissions = samePerson?.preAdmissions;
      }
      return residentDetailFromRecord(record);
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && Boolean(initialId),
  });

  const residentId = enabled ? (residentQuery.data?.id ?? initialId) : undefined;
  const timelineQuery = useQuery<ResidentTimelineItem[]>({
    queryKey: ['residentTimeline', residentId || 'none'],
    queryFn: async () => {
      if (!residentId) return [];
      try {
        const timeline = await makeMobileApiCall<ResidentTimelineItem[]>(
          GET_RESIDENT_TIMELINE,
          undefined,
          undefined,
          { id: residentId }
        );
        if (!Array.isArray(timeline)) {
          throw new Error('Resident timeline response was not a list');
        }
        return timeline;
      } catch (error) {
        safeLogger.warn('Failed to load resident activity timeline', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && Boolean(residentId),
  });

  const accessAuditQuery = useQuery<ResidentTimelineItem[]>({
    queryKey: ['residentAccessAudit', residentId || 'none', canReadAuditLogs],
    queryFn: async () => {
      if (!residentId || !canReadAuditLogs) return [];
      try {
        const response = await makeMobileApiCall<AuditLogsResponse>(
          'getAuditLogs',
          undefined,
          {
            entityId: residentId,
            actionType: 'RESIDENT_RECORD_VIEWED',
            limit: 1,
          }
        );
        return (response.data ?? []).map((entry) => ({
          id: entry.id,
          eventType: entry.actionType,
          summary: 'Profile viewed',
          timestamp: entry.timestamp,
          carer: { fullName: entry.userFullName ?? 'Staff member' },
        }));
      } catch (error) {
        safeLogger.warn('Failed to load resident access audit', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    enabled: enabled && Boolean(residentId) && canReadAuditLogs,
  });

  const refetch = useCallback(async () => {
    await residentQuery.refetch();
    await Promise.all([
      timelineQuery.refetch(),
      canReadAuditLogs ? accessAuditQuery.refetch() : Promise.resolve(),
    ]);
  }, [
    residentQuery.refetch,
    timelineQuery.refetch,
    accessAuditQuery.refetch,
    canReadAuditLogs,
  ]);

  const timeline = [
    ...(timelineQuery.data ?? []),
    ...(accessAuditQuery.data ?? []),
  ].sort(
    (first, second) =>
      new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
  );

  return {
    resident: residentQuery.data ?? null,
    timeline,
    activityError:
      timelineQuery.error instanceof Error
        ? timelineQuery.error.message
        : accessAuditQuery.error instanceof Error
          ? accessAuditQuery.error.message
          : null,
    loading:
      residentQuery.isLoading ||
      (Boolean(residentId) &&
        (timelineQuery.isLoading || accessAuditQuery.isLoading)),
    error:
      residentQuery.data
        ? null
        : residentQuery.error instanceof Error
          ? residentQuery.error.message
          : null,
    refetch,
  };
}
