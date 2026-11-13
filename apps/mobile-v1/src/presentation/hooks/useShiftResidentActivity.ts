import { useQuery } from '@tanstack/react-query';
import type { Resident } from '../../domain/entities/Resident';
import { useAuth } from '../context/AuthContext';
import { loadAssignedSupportActivity } from './shiftResidentActivity.query';

export type { ShiftResidentActivity } from './shiftResidentActivity.query';

export function useShiftResidentActivity(residents: Resident[], currentUserId?: string) {
  const { user } = useAuth();
  const residentIds = [...new Set(residents.map((resident) => resident.id))].sort();
  const query = useQuery({
    queryKey: ['shift-resident-activity', 'support', currentUserId, ...residentIds],
    queryFn: () => loadAssignedSupportActivity(residents, currentUserId, user?.fullName),
    enabled: residentIds.length > 0 && Boolean(currentUserId),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  return {
    activities: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
