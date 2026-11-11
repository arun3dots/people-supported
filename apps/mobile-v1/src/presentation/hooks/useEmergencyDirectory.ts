import { useQuery } from '@tanstack/react-query';
import { GET_EMERGENCY_DIRECTORY, GET_EMERGENCY_RESIDENT_SUMMARY } from '@repo/endpoints';
import type {
  EmergencyDirectoryResponseDTO,
  EmergencyResidentSummaryDTO,
} from '@repo/schema';
import { makeMobileApiCall } from '../../data/api/client';

export function useEmergencyDirectory() {
  return useQuery<EmergencyDirectoryResponseDTO>({
    queryKey: ['emergency-directory'],
    queryFn: () =>
      makeMobileApiCall<EmergencyDirectoryResponseDTO>(GET_EMERGENCY_DIRECTORY),
    staleTime: 1000 * 60,
  });
}

/**
 * Every successful fetch of this endpoint writes an audit entry
 * (RESIDENT_EMERGENCY_VIEWED), so the result is never served from cache and is
 * not refetched in the background: one screen open == one logged view.
 * gcTime 0 also keeps the clinical summary out of memory once the screen closes.
 */
export function useEmergencyResidentSummary(residentId?: string) {
  return useQuery<EmergencyResidentSummaryDTO>({
    queryKey: ['emergency-resident-summary', residentId],
    queryFn: () =>
      makeMobileApiCall<EmergencyResidentSummaryDTO>(
        GET_EMERGENCY_RESIDENT_SUMMARY,
        undefined,
        undefined,
        { id: residentId as string },
      ),
    enabled: Boolean(residentId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
