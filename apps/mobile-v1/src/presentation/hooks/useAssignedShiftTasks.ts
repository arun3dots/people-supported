import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Resident } from '../../domain/entities/Resident';
import type { ShiftInfo } from './shiftDashboard.utils';
import { loadDailyTasks } from './dailyTasks.query';

/** The dashboard and task board share one list, including agreed care-plan tasks. */
export function useAssignedShiftTasks(
  shift: ShiftInfo | null,
  residents: Resident[],
  roleName: string | undefined,
  date: string,
) {
  const residentIds = useMemo(
    () => [...new Set(residents.map((resident) => resident.id))].sort(),
    [residents],
  );
  const taskShift = shift?.name.toLowerCase().includes('night') ? 'Night' : 'Day';
  const queryKey = [
    'carer-assigned-resident-tasks',
    date,
    shift?.id ?? null,
    residentIds,
    roleName ?? null,
    taskShift,
  ] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => loadDailyTasks(date, residents, residentIds, taskShift, roleName),
    enabled: Boolean(shift?.isStarted && !shift.isCompleted),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return { ...query, queryKey };
}
