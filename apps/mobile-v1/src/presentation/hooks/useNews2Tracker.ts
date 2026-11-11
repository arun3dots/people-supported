import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CREATE_OBSERVATION } from '@repo/endpoints';
import { calculateNews2, News2Input, News2Result } from '../../domain/clinical/news2';
import { makeMobileApiCall } from '../../data/api/client';
import { enqueueMutation } from '../../data/api/offlineQueue';
import { safeLogger } from '../../data/security/safeLogger';

export interface SaveObservationResult {
  success: boolean;
  queuedOffline: boolean;
  score: number;
  riskLevel: string;
}

export function useNews2Tracker(residentId: string) {
  const queryClient = useQueryClient();

  const [vitals, setVitals] = useState<News2Input>({
    respirationRate: null,
    spo2: null,
    spo2Scale: 1,
    airOrOxygen: 'Air',
    systolicBp: null,
    diastolicBp: null,
    pulseRate: null,
    consciousness: 'Alert',
    temperature: null,
    isAbnormal: false,
    notifyGP: false,
    increaseMonitoring: false,
  });

  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastRecordedResult, setLastRecordedResult] = useState<News2Result | null>(null);

  const news2Result: News2Result = useMemo(() => {
    return calculateNews2(vitals);
  }, [vitals]);

  // Align with web: Auto-check abnormal and monitoring if score >= 5
  useEffect(() => {
    if (news2Result.totalScore >= 5) {
      setVitals((prev) => {
        if (!prev.isAbnormal || !prev.increaseMonitoring) {
          return {
            ...prev,
            isAbnormal: true,
            increaseMonitoring: true,
          };
        }
        return prev;
      });
    }
  }, [news2Result.totalScore]);

  const updateVital = useCallback(<K extends keyof News2Input>(field: K, value: News2Input[K]) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveObservation = useCallback(async (): Promise<SaveObservationResult> => {
    setIsSubmitting(true);
    let queuedOffline = false;

    const payload = {
      residentId,
      temp: vitals.temperature != null && !isNaN(Number(vitals.temperature)) ? Number(vitals.temperature) : null,
      pulse: vitals.pulseRate != null && !isNaN(Number(vitals.pulseRate)) ? Number(vitals.pulseRate) : null,
      bpSystolic: vitals.systolicBp != null && !isNaN(Number(vitals.systolicBp)) ? Number(vitals.systolicBp) : null,
      bpDiastolic: vitals.diastolicBp != null && !isNaN(Number(vitals.diastolicBp)) ? Number(vitals.diastolicBp) : null,
      respiration: vitals.respirationRate != null && !isNaN(Number(vitals.respirationRate)) ? Number(vitals.respirationRate) : null,
      spo2: vitals.spo2 != null && !isNaN(Number(vitals.spo2)) ? Number(vitals.spo2) : null,
      spo2Scale: vitals.spo2Scale ?? 1,
      airOrOxygen: vitals.airOrOxygen ?? 'Air',
      consciousness: vitals.consciousness ?? 'Alert',
      news2Score: news2Result.totalScore,
      isAbnormal: !!vitals.isAbnormal || news2Result.totalScore >= 5,
      notifyGP: !!vitals.notifyGP,
      increaseMonitoring: !!vitals.increaseMonitoring || news2Result.totalScore >= 5,
      notes: notes.trim() || null,
    };

    try {
      await makeMobileApiCall(CREATE_OBSERVATION, payload);
      safeLogger.info(`Successfully recorded NEWS2 observation for resident ${residentId}`);
      await queryClient.invalidateQueries({ queryKey: ['resident-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['residentTimeline'] });
      await queryClient.invalidateQueries({ queryKey: ['facility-residents-list'] });
      await queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isNetworkError =
        errMsg.toLowerCase().includes('network') ||
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('internet') ||
        errMsg.toLowerCase().includes('timeout');

      if (isNetworkError) {
        safeLogger.warn('Network error recording observation, enqueuing offline', err);
        await enqueueMutation(CREATE_OBSERVATION, payload);
        queuedOffline = true;
      } else {
        safeLogger.error('Server error recording observation', err);
        throw err;
      }
    } finally {
      setIsSubmitting(false);
      setLastRecordedResult(news2Result);
    }

    return {
      success: true,
      queuedOffline,
      score: news2Result.totalScore,
      riskLevel: news2Result.riskLevel,
    };
  }, [residentId, vitals, news2Result, notes, queryClient]);

  return {
    vitals,
    news2Result,
    notes,
    isSubmitting,
    lastRecordedResult,
    updateVital,
    setNotes,
    saveObservation,
  };
}
