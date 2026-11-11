import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT_MEDICATION_ROUNDS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { useResidentPrescriptions } from './ResidentPrescriptionsCard';
import { mapRawRoundsToMarLists } from './residentMar.utils';

export function useResidentMarData(residentId?: string) {
  const { data: rawRounds = [], isLoading } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['resident-medication-rounds', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const res = await makeMobileApiCall<Array<Record<string, unknown>>>(
        GET_RESIDENT_MEDICATION_ROUNDS,
        undefined,
        undefined,
        { id: residentId }
      ).catch(() => []);
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 3,
  });

  const { data: prescriptions = [] } = useResidentPrescriptions(residentId);

  const { prnList, recentList } = useMemo(
    () => mapRawRoundsToMarLists(rawRounds),
    [rawRounds]
  );

  // Scheduled rows come from prescriptions; legacy rounds (no prescription) are appended.
  const scheduledList = useMemo(() => {
    const scheduledRounds = [
      ...prescriptions.filter((rx) => rx.status === 'Active').flatMap((rx) => rx.rounds),
      ...rawRounds.filter((r) => !r.prescriptionId),
    ];
    return mapRawRoundsToMarLists(scheduledRounds).scheduledList;
  }, [prescriptions, rawRounds]);

  return { isLoading, scheduledList, prnList, recentList };
}
