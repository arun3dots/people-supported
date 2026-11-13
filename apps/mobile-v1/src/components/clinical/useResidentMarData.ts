import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT_MEDICATION_ROUNDS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { useResidentPrescriptions } from './ResidentPrescriptionsCard';
import { mapRawRoundsToMarLists } from './residentMar.utils';

export function useResidentMarData(residentId?: string) {
  const { data: rawRounds = [], isLoading, error: roundsError, refetch: refetchRounds } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['resident-medication-rounds', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const res = await makeMobileApiCall<Array<Record<string, unknown>>>(
        GET_RESIDENT_MEDICATION_ROUNDS,
        undefined,
        undefined,
        { id: residentId }
      );
      if (!Array.isArray(res)) throw new Error('Invalid medication rounds response');
      return res;
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 3,
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading, error: prescriptionsError, refetch: refetchPrescriptions } = useResidentPrescriptions(residentId);

  const { prnList, recentList } = useMemo(
    () => mapRawRoundsToMarLists(rawRounds),
    [rawRounds]
  );

  // Scheduled rows come from prescriptions; legacy rounds (no prescription) are appended.
  const scheduledList = useMemo(() => {
    const scheduledRounds = [
      ...prescriptions.filter((rx) => rx.status === 'Active').flatMap((rx) => rx.rounds.map((round) => ({ ...round, startDate: rx.startDate }))),
      ...rawRounds.filter((r) => !r.prescriptionId),
    ];
    return mapRawRoundsToMarLists(scheduledRounds).scheduledList;
  }, [prescriptions, rawRounds]);

  return {
    isLoading: isLoading || prescriptionsLoading,
    error: roundsError || prescriptionsError,
    refetch: () => Promise.all([refetchRounds(), refetchPrescriptions()]),
    scheduledList, prnList, recentList,
  };
}
