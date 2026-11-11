import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GET_ACTIVE_SHIFT,
  GET_MY_SHIFTS,
  GET_SHIFT_DETAILS,
  GET_RESIDENTS,
  START_SHIFT,
  END_SHIFT,
  UPDATE_HANDOVER_NOTES,
  GET_NOTIFICATIONS,
} from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { Resident } from '../../domain/entities/Resident';
import { safeLogger } from '../../data/security/safeLogger';
import { useAuth } from '../context/AuthContext';
import {
  type HandoverPersonInfo,
  type PreviousShiftHandoverInfo,
  type ShiftInfo,
  type ShiftDetailsApiResponse,
  isShiftPast,
  mapApiShift,
  mapAssignedResidents,
  resolveAssignedResidents,
  normalizeShiftTimeRemaining,
} from './shiftDashboard.utils';
import { formatUkTime, getUkDateString } from '../../lib/date';

export type { HandoverPersonInfo, PreviousShiftHandoverInfo, ShiftInfo };

interface ShiftDashboardData {
  shift: ShiftInfo | null;
  upcomingShift: ShiftInfo | null;
  shiftList: ShiftInfo[];
  assignedResidents: Resident[];
  urgentAlerts: string[];
}

export function useShiftDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dismissedAlertIndices, setDismissedAlertIndices] = useState<number[]>([]);

  // 1. TanStack Query for Active Shift, Shift Details, and Shift List
  const {
    data: dashboardData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<ShiftDashboardData>({
    queryKey: ['active-shift'],
    queryFn: async () => {
      // 1.1 Fetch active & next shift
      const activeRes = await makeMobileApiCall<{
        active: Record<string, unknown> | null;
        next: Record<string, unknown> | null;
        lastCompleted?: Record<string, unknown> | null;
      }>(GET_ACTIVE_SHIFT).catch(() => null);

      // 1.2 Fetch shift list for staff member
      const listRes = await makeMobileApiCall<Record<string, unknown>[]>(GET_MY_SHIFTS).catch(
        () => []
      );

      const mappedList: ShiftInfo[] = Array.isArray(listRes)
        ? (listRes.map(mapApiShift).filter(Boolean) as ShiftInfo[])
        : [];

      let currentShift: ShiftInfo | null = null;
      let nextShift: ShiftInfo | null = null;

      if (activeRes?.active) {
        const mappedActive = mapApiShift(activeRes.active);
        if (mappedActive && !isShiftPast(mappedActive)) {
          currentShift = mappedActive;
        }
      }
      if (activeRes?.next) {
        const mappedNext = mapApiShift(activeRes.next);
        if (mappedNext && !isShiftPast(mappedNext)) {
          nextShift = mappedNext;
        }
      }

      if (!currentShift) {
        const todayStr = getUkDateString(new Date());
        const lastCompletedShift = activeRes?.lastCompleted
          ? mapApiShift(activeRes.lastCompleted)
          : null;
        const isLastCompletedToday = lastCompletedShift?.rawStartTime
          ? getUkDateString(lastCompletedShift.rawStartTime) === todayStr
          : false;

        if (isLastCompletedToday && lastCompletedShift) {
          currentShift = lastCompletedShift;
        } else {
          const completedToday = mappedList.find((s) => {
            if (!s.isCompleted && s.status !== 'Completed') return false;
            return s.rawStartTime ? getUkDateString(s.rawStartTime) === todayStr : false;
          });

          if (completedToday) {
            currentShift = completedToday;
          } else if (nextShift && !isShiftPast(nextShift)) {
            currentShift = nextShift;
          } else {
            const upcomingInList = mappedList.find((s) => {
              if (s.isCompleted || s.status === 'Completed') return false;
              return !isShiftPast(s);
            });
            currentShift = upcomingInList || null;
          }
        }
      }

      let assignedResidents: Resident[] = [];

      // 1.3 Fetch comprehensive details for current shift from API
      if (currentShift?.id) {
        try {
          const details = await makeMobileApiCall<ShiftDetailsApiResponse>(
            GET_SHIFT_DETAILS,
            undefined,
            undefined,
            { id: currentShift.id }
          );

          if (details) {
            assignedResidents = mapAssignedResidents(details.assignedResidents);
            currentShift = {
              ...currentShift,
              wardName: details.wardName || currentShift.wardName,
              tasksCompleted: details.tasksCompleted ?? currentShift.tasksCompleted,
              tasksTotal: details.tasksTotal ?? currentShift.tasksTotal,
              incidentCount: details.incidentCount ?? currentShift.incidentCount,
              shiftNotes: details.shiftNotes ?? details.notes ?? currentShift.shiftNotes ?? null,
              timeRemainingStr: normalizeShiftTimeRemaining(
                details.timeRemainingStr ?? currentShift.timeRemainingStr,
                Boolean(currentShift.isStarted),
                Boolean(currentShift.isCompleted)
              ),
              previousShiftHandover:
                details.previousShiftHandover ?? currentShift.previousShiftHandover,
              nextShiftName: details.nextShift?.name ?? currentShift.nextShiftName,
              nextShiftStartTime: details.nextShift?.startTime ?? currentShift.nextShiftStartTime,
              nextShiftHandoverPerson:
                details.nextShift?.handoverPerson ?? currentShift.nextShiftHandoverPerson,
            };

            // Enrich assigned residents with room & bed numbers from resident directory
            if (assignedResidents.length > 0) {
              const residentParams =
                user?.roleName.toLowerCase() === 'carer'
                  ? { limit: 50, shiftId: currentShift.id }
                  : { limit: 50 };
              const resList = await makeMobileApiCall<
                { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
              >(GET_RESIDENTS, undefined, residentParams).catch((err) => {
                safeLogger.warn('Failed to load assigned residents for the shift', err);
                return null;
              });
              assignedResidents = resolveAssignedResidents(
                assignedResidents,
                resList,
                user?.roleName.toLowerCase() === 'carer',
              );
            }
          }
        } catch (err) {
          safeLogger.warn(`Failed to fetch shift details for ${currentShift.id}`, err);
        }
      }

      // 1.4 Fetch real unread notifications/alerts
      let urgentAlerts: string[] = [];
      try {
        const alertsRes = await makeMobileApiCall<
          { data?: Array<{ title?: string; message?: string; priority?: string; isRead?: boolean }> } |
          Array<{ title?: string; message?: string; priority?: string; isRead?: boolean }>
        >(GET_NOTIFICATIONS, undefined, { limit: 20, isRead: false }).catch(() => null);

        const list = Array.isArray(alertsRes)
          ? alertsRes
          : Array.isArray(alertsRes?.data)
            ? alertsRes.data
            : [];

        if (list.length > 0) {
          urgentAlerts = list.map((a) => a.message || a.title || 'Notification Alert');
        }
      } catch {
        urgentAlerts = [];
      }

      return {
        shift: currentShift,
        upcomingShift:
          nextShift && !isShiftPast(nextShift)
            ? nextShift
            : currentShift && !currentShift.isStarted && !currentShift.isCompleted && !isShiftPast(currentShift)
              ? currentShift
              : null,
        shiftList: mappedList,
        assignedResidents,
        urgentAlerts,
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });

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
      const currentShift = dashboardData?.shift;
      if (!currentShift?.id) return;
      await makeMobileApiCall(
        END_SHIFT,
        {
          handoverNotes,
          tasksCompleted: currentShift.tasksCompleted,
          tasksTotal: currentShift.tasksTotal,
        },
        undefined,
        { id: currentShift.id }
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
      await makeMobileApiCall(
        UPDATE_HANDOVER_NOTES,
        { handoverNotes },
        undefined,
        { id: currentShift.id }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
  });

  const dismissAlert = useCallback((index: number) => {
    setDismissedAlertIndices((prev) => [...prev, index]);
  }, []);

  const activeAlerts = useMemo(() => {
    const rawAlerts = dashboardData?.urgentAlerts || [];
    return rawAlerts.filter((_, idx) => !dismissedAlertIndices.includes(idx));
  }, [dashboardData?.urgentAlerts, dismissedAlertIndices]);

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    shift: dashboardData?.shift ?? null,
    upcomingShift: dashboardData?.upcomingShift ?? null,
    shiftList: dashboardData?.shiftList ?? [],
    assignedResidents: dashboardData?.assignedResidents ?? [],
    isShiftStarted: Boolean(
      dashboardData?.shift?.isStarted &&
      !dashboardData?.shift?.isCompleted &&
      !isShiftPast(dashboardData?.shift)
    ),
    isShiftCompleted: Boolean(dashboardData?.shift?.isCompleted || dashboardData?.shift?.status === 'Completed'),
    urgentAlerts: activeAlerts,
    dismissAlert,
    startShift: (notes?: string) => startShiftMutation.mutateAsync(notes),
    endShift: (handoverNotes: string) => endShiftMutation.mutateAsync(handoverNotes),
    saveHandoverNotes: (notes: string) => updateNotesMutation.mutateAsync(notes),
    refreshShifts: () => refetch(),
    loading,
    error,
  };
}
