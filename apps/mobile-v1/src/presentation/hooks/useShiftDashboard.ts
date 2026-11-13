import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { START_SHIFT, END_SHIFT, UPDATE_HANDOVER_NOTES } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { useAuth } from '../context/AuthContext';
import {
  formatContinuingTimeRemaining,
  isContinuousNextShift,
  isShiftPast,
  resolveShiftStartEndMs,
} from './shiftDashboard.utils';
import { formatUkTime, getUkDateString } from '../../lib/date';

import { loadShiftDashboard, type ShiftDashboardData } from './shiftDashboard.query';
import { useAssignedShiftTasks } from './useAssignedShiftTasks';

export type { DashboardAlert } from './dashboardAlerts.query';
export type {
  HandoverPersonInfo,
  PreviousShiftHandoverInfo,
  ShiftInfo,
} from './shiftDashboard.utils';

export function useShiftDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // 1. TanStack Query for Active Shift, Shift Details, and Shift List
  const {
    data: dashboardData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<ShiftDashboardData>({
    queryKey: ['active-shift'],
    queryFn: () => loadShiftDashboard(),
    staleTime: 1000 * 30, // 30 seconds
  });

  const activeShift = dashboardData?.shift ?? null;
  const upcomingShift = dashboardData?.upcomingShift ?? null;
  const shiftList = dashboardData?.shiftList ?? [];
  const hasContinuousNext = Boolean(
    activeShift?.hasContinuousNextShift ||
      (activeShift && upcomingShift && isContinuousNextShift(activeShift, upcomingShift)) ||
      (activeShift && shiftList.some((candidate) => isContinuousNextShift(activeShift, candidate))),
  );
  const isActivePast = isShiftPast(activeShift, nowMs);
  const isShiftStarted = Boolean(
    activeShift?.isStarted &&
      !activeShift.isCompleted &&
      (!isActivePast || !hasContinuousNext),
  );
  const isShiftContinuing = Boolean(isShiftStarted && isActivePast);

  useEffect(() => {
    setNowMs(Date.now());
    if (!activeShift?.isStarted || activeShift.isCompleted) return;

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    const { endMs } = resolveShiftStartEndMs(activeShift);
    let boundaryTimeoutId: ReturnType<typeof setTimeout> | undefined;
    if (endMs) {
      const msUntilEnd = endMs - Date.now();
      if (msUntilEnd > 0 && msUntilEnd <= 60 * 60 * 1000) {
        boundaryTimeoutId = setTimeout(() => {
          setNowMs(Date.now());
          queryClient.invalidateQueries({ queryKey: ['active-shift'] });
        }, msUntilEnd + 1500);
      }
    }

    return () => {
      clearInterval(intervalId);
      if (boundaryTimeoutId) clearTimeout(boundaryTimeoutId);
    };
  }, [
    activeShift?.id,
    activeShift?.isStarted,
    activeShift?.isCompleted,
    activeShift?.rawEndTime,
    activeShift?.endTime,
    queryClient,
  ]);

  const taskQuery = useAssignedShiftTasks(
    activeShift,
    dashboardData?.assignedResidents ?? [],
    user?.roleName,
    getUkDateString(new Date()),
  );
  const shift =
    activeShift && isShiftStarted
      ? {
          ...activeShift,
          isContinuing: isShiftContinuing,
          hasContinuousNextShift: hasContinuousNext,
          ...(isShiftContinuing
            ? {
                status: 'Continuing',
                timeRemainingStr: formatContinuingTimeRemaining(activeShift, nowMs),
              }
            : {}),
          tasksCompleted:
            taskQuery.data?.filter((task) => task.status === 'Completed').length ??
            activeShift.tasksCompleted,
          tasksTotal: taskQuery.data?.length ?? activeShift.tasksTotal,
          taskProgressLoading: taskQuery.isPending,
          taskProgressError: taskQuery.isError,
        }
      : activeShift;

  // 2. Start Shift Mutation
  const startShiftMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const shiftId = dashboardData?.shift?.id;
      if (!shiftId) return;
      await makeMobileApiCall(START_SHIFT, { notes }, undefined, { id: shiftId });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['active-shift'] });
      const prevData = queryClient.getQueryData<ShiftDashboardData>(['active-shift']);

      const nowTimeStr = formatUkTime(new Date());

      if (prevData?.shift) {
        queryClient.setQueryData<ShiftDashboardData>(['active-shift'], {
          ...prevData,
          shift: {
            ...prevData.shift,
            isStarted: true,
            status: 'Started',
            actualStartedTime: nowTimeStr,
          },
        });
      }
      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(['active-shift'], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({
        queryKey: ['carer-assigned-resident-tasks'],
      });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
  });

  // 3. End Shift Mutation
  const endShiftMutation = useMutation({
    mutationFn: async (handoverNotes: string) => {
      const currentShift = shift;
      if (!currentShift?.id) return;
      await makeMobileApiCall(
        END_SHIFT,
        {
          handoverNotes,
          tasksCompleted: currentShift.tasksCompleted,
          tasksTotal: currentShift.tasksTotal,
        },
        undefined,
        { id: currentShift.id },
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['active-shift'] });
      const prevData = queryClient.getQueryData<ShiftDashboardData>(['active-shift']);

      if (prevData?.shift) {
        queryClient.setQueryData<ShiftDashboardData>(['active-shift'], {
          ...prevData,
          shift: {
            ...prevData.shift,
            tasksCompleted: shift?.tasksCompleted ?? prevData.shift.tasksCompleted,
            tasksTotal: shift?.tasksTotal ?? prevData.shift.tasksTotal,
            status: 'Completed',
            isStarted: false,
            isCompleted: true,
            timeRemainingStr: 'Shift ended',
          },
        });
      }
      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(['active-shift'], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({
        queryKey: ['carer-assigned-resident-tasks'],
      });
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
  });

  // 4. Update Running Handover Notes Mutation (without ending shift)
  const updateNotesMutation = useMutation({
    mutationFn: async (handoverNotes: string) => {
      const currentShift = dashboardData?.shift;
      if (!currentShift?.id) return;
      await makeMobileApiCall(UPDATE_HANDOVER_NOTES, { handoverNotes }, undefined, {
        id: currentShift.id,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlertIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
  }, []);

  const activeAlerts = useMemo(() => {
    const rawAlerts = dashboardData?.urgentAlerts ?? [];
    return rawAlerts.filter((alert) => !dismissedAlertIds.includes(alert.id));
  }, [dashboardData?.urgentAlerts, dismissedAlertIds]);

  const refetchTasks = taskQuery.refetch;
  const refreshShifts = useCallback(async () => {
    const result = await refetch();
    if (isShiftStarted) await refetchTasks();
    return result;
  }, [refetch, refetchTasks, isShiftStarted]);

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    shift,
    upcomingShift: dashboardData?.upcomingShift ?? null,
    shiftList: dashboardData?.shiftList ?? [],
    assignedResidents: dashboardData?.assignedResidents ?? [],
    isShiftStarted,
    isShiftContinuing,
    isShiftCompleted: Boolean(
      dashboardData?.shift?.isCompleted || dashboardData?.shift?.status === 'Completed',
    ),
    urgentAlerts: activeAlerts,
    dismissAlert,
    startShift: (notes?: string) => startShiftMutation.mutateAsync(notes),
    endShift: (handoverNotes: string) => endShiftMutation.mutateAsync(handoverNotes),
    saveHandoverNotes: (notes: string) => updateNotesMutation.mutateAsync(notes),
    refreshShifts,
    loading,
    error,
  };
}
