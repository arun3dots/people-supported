import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CREATE_FOOD_FLUID_LOG,
  GET_FOOD_FLUID_LOGS,
  GET_FOOD_FLUID_SUMMARY,
  UPDATE_FOOD_FLUID_LOG,
  DELETE_FOOD_FLUID_LOG,
} from '@repo/endpoints';
import type {
  FoodFluidSummaryDTO,
  CreateFoodFluidLogDTO,
  UpdateFoodFluidLogDTO,
} from '@repo/schema';
import { makeMobileApiCall } from '../../data/api/client';
import { isNetworkError } from '../../data/api/errors';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';
import {
  FluidEntry,
  BeveragePreset,
  FluidBalanceSummary,
  FoodFluidLogItem,
} from '../../domain/clinical/fluid-balance';
import { getUkDateString, formatUkTime } from '../../lib/date';

export function useFluidTracker(
  residentId: string,
  selectedDateStr?: string,
  dailyTargetMl?: number
) {
  const queryClient = useQueryClient();
  const activeDateStr = useMemo(
    () => selectedDateStr || getUkDateString(),
    [selectedDateStr]
  );

  const {
    data: rawLogs = [],
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<FoodFluidLogItem[]>({
    queryKey: ['foodFluidLogs', residentId, activeDateStr],
    queryFn: async () => {
      const res = await makeMobileApiCall<
        FoodFluidLogItem[] | { data?: FoodFluidLogItem[] }
      >(
        GET_FOOD_FLUID_LOGS,
        undefined,
        { date: activeDateStr },
        { id: residentId }
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    },
    staleTime: 30000,
    enabled: Boolean(residentId),
  });

  const logs = useMemo(
    () => rawLogs.filter((l) => !l.deletedAt),
    [rawLogs]
  );

  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<FoodFluidSummaryDTO>({
    queryKey: ['foodFluidSummary', residentId, activeDateStr],
    queryFn: async () => {
      return makeMobileApiCall<FoodFluidSummaryDTO>(
        GET_FOOD_FLUID_SUMMARY,
        undefined,
        { date: activeDateStr },
        { id: residentId }
      );
    },
    staleTime: 30000,
    enabled: Boolean(residentId),
  });

  const invalidateFluidQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['foodFluidLogs', residentId] });
    void queryClient.invalidateQueries({ queryKey: ['foodFluidSummary', residentId] });
    void queryClient.invalidateQueries({ queryKey: ['residentTimeline', residentId] });
    void queryClient.invalidateQueries({ queryKey: ['shift-resident-activity'] });
  }, [queryClient, residentId]);

  const createMutation = useMutation({
    mutationFn: async (payload: CreateFoodFluidLogDTO) => {
      try {
        return await makeMobileApiCall(
          CREATE_FOOD_FLUID_LOG,
          payload,
          undefined,
          { id: residentId }
        );
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        safeLogger.warn('Network call failed for fluid log, enqueuing offline', err);
        await enqueueMutation(CREATE_FOOD_FLUID_LOG, payload, { id: residentId });
        return { queuedOffline: true };
      }
    },
    onSuccess: invalidateFluidQueries,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ logId, data }: { logId: string; data: UpdateFoodFluidLogDTO }) => {
      return makeMobileApiCall(
        UPDATE_FOOD_FLUID_LOG,
        data,
        undefined,
        { id: residentId, logId }
      );
    },
    onSuccess: invalidateFluidQueries,
  });

  const deleteMutation = useMutation({
    mutationFn: async (logId: string) => {
      return makeMobileApiCall(
        DELETE_FOOD_FLUID_LOG,
        undefined,
        undefined,
        { id: residentId, logId }
      );
    },
    onSuccess: invalidateFluidQueries,
  });

  const entries: FluidEntry[] = useMemo(() => {
    return logs
      .filter((l) => l.type === 'Fluid')
      .map((l) => ({
        id: l.id,
        residentId,
        amountMl: l.amount,
        beverageType: l.notes || l.mealSlot || 'Hydration',
        recordedAt: formatUkTime(l.timestamp),
        staffName: 'Carer',
      }));
  }, [logs, residentId]);

  const summary: FluidBalanceSummary = useMemo(() => {
    // The summary API supplies a fixed adult baseline, not a resident's recorded target.
    const target = dailyTargetMl && dailyTargetMl > 0 ? dailyTargetMl : null;
    const fluidLogs = logs.filter((l) => l.type === 'Fluid');
    const computedTotal = fluidLogs.reduce((acc, curr) => {
      const pct =
        curr.intakePercentage !== null && curr.intakePercentage !== undefined
          ? curr.intakePercentage / 100
          : 1;
      return acc + Math.round(Number(curr.amount || 0) * pct);
    }, 0);

    const currentTotal =
      logs.length > 0 ? computedTotal : (summaryData?.totalFluidIntakeMl ?? 0);
    if (target === null) return {
      totalIntakeMl: currentTotal, dailyTargetMl: null, percentageCompleted: null,
      remainingMl: null, isDehydratedRisk: false, statusLabel: 'Clinical target not recorded',
    };
    const progressPct = Math.min(Math.round((currentTotal / target) * 100), 100);
    const remainingMl = Math.max(target - currentTotal, 0);
    const isDehydratedRisk = progressPct < 50;

    let statusLabel = summaryData?.statusLabel || 'On Track';
    if (logs.length > 0 || !summaryData?.statusLabel) {
      if (progressPct >= 100) statusLabel = 'Target Met';
      else if (progressPct >= 75) statusLabel = 'Good Progress';
      else if (progressPct < 50) statusLabel = 'Dehydration Risk';
      else statusLabel = 'On Track';
    }

    return {
      totalIntakeMl: currentTotal,
      dailyTargetMl: target,
      percentageCompleted: progressPct,
      remainingMl,
      isDehydratedRisk,
      statusLabel,
    };
  }, [logs, summaryData, dailyTargetMl]);

  const logBeverage = useCallback(
    (preset: BeveragePreset) => {
      createMutation.mutate({
        type: 'Fluid',
        amount: preset.amountMl,
        unit: 'ml',
        mealSlot: 'HydrationRound',
        intakePercentage: 100,
        notes: preset.label,
        timestamp: new Date().toISOString(),
      });
    },
    [createMutation]
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchLogs(), refetchSummary()]);
  }, [refetchLogs, refetchSummary]);

  return {
    logs,
    entries,
    summary,
    fluidCount: logs.filter((l) => l.type === 'Fluid').length,
    foodCount: logs.filter((l) => l.type === 'Food').length,
    isLoading: isLoadingLogs || isLoadingSummary,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: logsError || summaryError,
    refetch,
    logBeverage,
    createLog: createMutation.mutateAsync,
    updateLog: updateMutation.mutateAsync,
    deleteLog: deleteMutation.mutateAsync,
  };
}
