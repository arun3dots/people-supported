import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { GET_MEDICATION_PRESCRIPTIONS } from '@repo/endpoints';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { makeMobileApiCall } from '../../data/api/client';

const formatUkDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export interface MobileMedicationPrescription {
  id: string;
  drugName: string;
  dose: string;
  form: string;
  times: string[];
  startDate: string;
  endDate: string;
  status: 'Active' | 'Stopped' | 'Superseded';
  stopReason: string | null;
  pauses: { id: string; pauseFrom: string; resumeOn: string; reason: string }[];
  rounds: Array<Record<string, unknown>>;
}

export function useResidentPrescriptions(residentId?: string) {
  return useQuery<MobileMedicationPrescription[]>({
    queryKey: ['resident-medication-prescriptions', residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const res = await makeMobileApiCall<MobileMedicationPrescription[]>(
        GET_MEDICATION_PRESCRIPTIONS,
        undefined,
        undefined,
        { id: residentId }
      ).catch(() => []);
      return Array.isArray(res) ? res : [];
    },
    enabled: Boolean(residentId),
    staleTime: 1000 * 60 * 3,
  });
}

interface Props {
  residentId?: string;
}

const STATUS_CLASS: Record<MobileMedicationPrescription['status'], string> = {
  Active: 'text-clinical-safe bg-clinical-safeBg',
  Stopped: 'text-clinical-critical bg-clinical-criticalBg',
  Superseded: 'text-text-secondary bg-surface',
};

export function ResidentPrescriptionsCard({ residentId }: Props) {
  const { data: prescriptions = [], isLoading } = useResidentPrescriptions(residentId);

  return (
    <Card className="p-4 mb-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-7 h-7 rounded-full bg-white items-center justify-center">
          <FileText size={14} color="#059669" />
        </View>
        <Text className="text-base font-bold text-text-primary">Prescriptions</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#4A706A" />
      ) : prescriptions.length === 0 ? (
        <Text className="text-xs text-text-muted py-3 text-center">No prescriptions recorded</Text>
      ) : (
        prescriptions.map((rx) => (
          <View key={rx.id} className="bg-white rounded-xl p-3 mb-2">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-sm font-semibold text-text-primary flex-1">
                {rx.drugName} · {rx.dose}
              </Text>
              <Text className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_CLASS[rx.status]}`}>
                {rx.status}
              </Text>
            </View>
            <Text className="text-xs text-text-secondary mt-1">
              {rx.form} · {rx.times.join(', ')} · {formatUkDate(rx.startDate)} – {formatUkDate(rx.endDate)}
            </Text>
            {rx.pauses.map((p) => (
              <Text key={p.id} className="text-xs text-clinical-warning mt-0.5">
                Paused {formatUkDate(p.pauseFrom)} → {formatUkDate(p.resumeOn)}: {p.reason}
              </Text>
            ))}
            {rx.stopReason && (
              <Text className="text-xs text-text-secondary mt-0.5">{rx.stopReason}</Text>
            )}
          </View>
        ))
      )}
    </Card>
  );
}
