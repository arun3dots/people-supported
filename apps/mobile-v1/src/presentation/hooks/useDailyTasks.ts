import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UPDATE_DAILY_TASK_STATUS,
  RECORD_CARE_TASK,
} from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { isNetworkError } from '../../data/api/errors';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';
import { useAuth } from '../context/AuthContext';
import { useShiftDashboard } from './useShiftDashboard';
import { type MobileTaskItem } from './dailyTasks.utils';
import { useAssignedShiftTasks } from './useAssignedShiftTasks';
import { formatUkTime, getUkDateString } from '../../lib/date';

export type { MobileTaskItem };

export interface ResidentFilterItem {
  id: string;
  fullName: string;
  firstName: string;
}

export function useDailyTasks() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = getUkDateString(selectedDate);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { shift, assignedResidents } = useShiftDashboard();
  const {
    data: tasks = [],
    isLoading: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
    queryKey: taskQueryKey,
  } = useAssignedShiftTasks(shift, assignedResidents, user?.roleName, dateStr);

  // 2. Sign-off / Complete Task Mutation
  const completeMutation = useMutation({
    mutationFn: async ({ task, notes }: { task: MobileTaskItem; notes?: string }) => {
      if (task.source === 'care-plan') {
        try {
          await makeMobileApiCall(
            RECORD_CARE_TASK,
            { outcome: 'Done', note: notes, date: task.scheduledDate },
            undefined,
            { id: task.residentId, taskId: task.id },
          );
        } catch (err) {
          safeLogger.warn('Failed to record agreed care-plan task', err);
          throw err;
        }
        return;
      }
      const payload = { status: 'Completed' as const, notes: notes || undefined };
      try {
        await makeMobileApiCall(UPDATE_DAILY_TASK_STATUS, payload, undefined, { taskId: task.id });
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        safeLogger.warn('Network error updating task status, queueing offline mutation', err);
        await enqueueMutation(UPDATE_DAILY_TASK_STATUS, payload, { taskId: task.id });
      }
    },
    onMutate: async ({ task, notes }) => {
      const taskId = task.id;
      await queryClient.cancelQueries({
        queryKey: taskQueryKey,
      });
      const previousTasks = queryClient.getQueryData<MobileTaskItem[]>(taskQueryKey);

      const nowTimeStr = formatUkTime(new Date());

      queryClient.setQueryData<MobileTaskItem[]>(
        taskQueryKey,
        (old = []) =>
          old.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'Completed' as const,
                  rawStatus: 'Completed',
                  statusDetail: nowTimeStr,
                  completedAt: nowTimeStr,
                  notes: notes || t.notes,
                }
              : t,
          ),
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-resident-activity'] });
    },
  });

  // 3. Skip Task Mutation with mandatory skip reason
  const skipMutation = useMutation({
    mutationFn: async ({
      task,
      skipReason,
      notes,
    }: {
      task: MobileTaskItem;
      skipReason: string;
      notes?: string;
    }) => {
      if (task.source === 'care-plan') {
        const note = [skipReason, notes].filter(Boolean).join('\n');
        try {
          await makeMobileApiCall(
            RECORD_CARE_TASK,
            { outcome: 'Declined', note, date: task.scheduledDate },
            undefined,
            { id: task.residentId, taskId: task.id },
          );
        } catch (err) {
          safeLogger.warn('Failed to record declined care-plan task', err);
          throw err;
        }
        return;
      }
      const payload = { status: 'Skipped' as const, skipReason, notes: notes || undefined };
      try {
        await makeMobileApiCall(UPDATE_DAILY_TASK_STATUS, payload, undefined, { taskId: task.id });
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        safeLogger.warn('Network error skipping task, queueing offline mutation', err);
        await enqueueMutation(UPDATE_DAILY_TASK_STATUS, payload, { taskId: task.id });
      }
    },
    onMutate: async ({ task, skipReason, notes }) => {
      const taskId = task.id;
      await queryClient.cancelQueries({
        queryKey: taskQueryKey,
      });
      const previousTasks = queryClient.getQueryData<MobileTaskItem[]>(taskQueryKey);

      queryClient.setQueryData<MobileTaskItem[]>(
        taskQueryKey,
        (old = []) =>
          old.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'Skipped' as const,
                  rawStatus: 'Skipped',
                  statusDetail: 'Skipped',
                  skipReason,
                  notes: notes || t.notes,
                }
              : t,
          ),
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskQueryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKey });
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-resident-activity'] });
    },
  });

  const signOffTask = useCallback(
    async (task: MobileTaskItem, notes?: string) => {
      await completeMutation.mutateAsync({ task, notes });
    },
    [completeMutation]
  );

  const skipTask = useCallback(
    async (task: MobileTaskItem, skipReason: string, notes?: string) => {
      await skipMutation.mutateAsync({ task, skipReason, notes });
    },
    [skipMutation]
  );

  // Distinct Residents for Filtering
  const residents = useMemo<ResidentFilterItem[]>(() => {
    const map = new Map<string, ResidentFilterItem>();
    tasks.forEach((t) => {
      if (t.residentId && !map.has(t.residentId)) {
        const firstName = t.residentName.trim().split(/\s+/)[0] || t.residentName;
        map.set(t.residentId, {
          id: t.residentId,
          fullName: t.residentName,
          firstName,
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  // Counts for KPIs & Filter badges
  const totalCount = tasks.length;
  const doneCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'Completed' || t.rawStatus.toLowerCase() === 'done'
      ).length,
    [tasks]
  );
  const dueNowCount = useMemo(
    () =>
      tasks.filter((t) => {
        const s = t.rawStatus.toLowerCase();
        return (
          t.status === 'Pending' ||
          s === 'pending' ||
          s === 'due' ||
          s === 'inprogress'
        );
      }).length,
    [tasks]
  );
  const overdueCount = useMemo(() => tasks.filter((t) => t.status === 'Overdue').length, [tasks]);
  const missedCount = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status === 'Skipped' ||
          t.status === 'Overdue' ||
          t.rawStatus.toLowerCase() === 'missed'
      ).length,
    [tasks]
  );
  const refusedCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'Refused' || t.rawStatus.toLowerCase() === 'refused'
      ).length,
    [tasks]
  );
  const upcomingCount = useMemo(
    () =>
      tasks.filter((t) => {
        const s = t.rawStatus.toLowerCase();
        return (
          (s === 'pending' || s === 'scheduled') &&
          t.status !== 'Completed' &&
          t.status !== 'Overdue' &&
          t.status !== 'Skipped'
        );
      }).length,
    [tasks]
  );

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    tasks,
    residents,
    selectedDate,
    setSelectedDate,
    totalCount,
    dueNowCount,
    doneCount,
    overdueCount,
    missedCount,
    refusedCount,
    upcomingCount,
    loading,
    refreshing,
    error,
    refreshTasks: () => refetch(),
    signOffTask,
    skipTask,
    isSubmitting: completeMutation.isPending || skipMutation.isPending,
  };
}
