import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Stethoscope, Plus, ChevronRight, AlertTriangle, Activity } from 'lucide-react-native';
import { Text, Card } from '../../presentation/components/common';
import type { ResidentDetailData } from '../../presentation/hooks/useResidentDetail';
import { ObservationDetailModal, ObservationDetailData } from './ObservationDetailModal';
import { formatUkDate, formatUkTime } from '../../lib/date';

interface ResidentObservationsSectionProps {
  resident: ResidentDetailData;
}

export function ResidentObservationsSection({ resident }: ResidentObservationsSectionProps) {
  const router = useRouter();
  const [selectedObs, setSelectedObs] = useState<ObservationDetailData | null>(null);

  const observations = resident.observations || [];

  const getScoreBadge = (score: number | null | undefined) => {
    const val = score ?? 0;
    if (val === 0) {
      return (
        <View className="px-2.5 py-0.5 rounded-full bg-clinical-safeBg">
          <Text className="text-xs font-semibold text-clinical-safe">0 · Normal</Text>
        </View>
      );
    }
    if (val <= 4) {
      return (
        <View className="px-2.5 py-0.5 rounded-full bg-clinical-warningBg">
          <Text className="text-xs font-semibold text-clinical-warning">{val} · Low Risk</Text>
        </View>
      );
    }
    if (val <= 6) {
      return (
        <View className="px-2.5 py-0.5 rounded-full bg-clinical-warningBg">
          <Text className="text-xs font-semibold text-clinical-warning">{val} · Medium</Text>
        </View>
      );
    }
    return (
      <View className="px-2.5 py-0.5 rounded-full bg-clinical-criticalBg">
        <Text className="text-xs font-semibold text-clinical-critical">{val} · High Risk</Text>
      </View>
    );
  };

  const handleRecordObs = () => {
    router.navigate({ pathname: '/news2', params: { id: resident.id } } as Href);
  };

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-primary-light items-center justify-center">
            <Stethoscope size={14} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground">Clinical Observations</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRecordObs}
          className="flex-row items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-xs font-semibold text-white">Record Obs</Text>
        </TouchableOpacity>
      </View>

      {/* Observations List or Empty State */}
      {observations.length === 0 ? (
        <Card className="p-5 items-center justify-center">
          <Activity size={24} color="#8E8E93" className="mb-2" />
          <Text className="text-sm font-semibold text-foreground mb-1">No observations recorded yet</Text>
          <Text className="text-xs text-muted-foreground text-center mb-3">
            Take clinical observations (NEWS2) to track vital signs and clinical deterioration.
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRecordObs}
            className="px-4 py-2 rounded-full bg-white"
          >
            <Text className="text-xs font-bold text-primary">Record First Observation</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <View className="gap-2.5">
          {observations.slice(0, 5).map((obs) => {
            const dateStr = formatUkDate(obs.timestamp, { day: '2-digit', month: 'short' });
            const timeStr = formatUkTime(obs.timestamp);

            return (
              <TouchableOpacity
                key={obs.id}
                activeOpacity={0.75}
                onPress={() => setSelectedObs(obs as ObservationDetailData)}
              >
                <Card className="p-3.5">
                  {/* Top: Date & Score Badge */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-bold text-foreground">
                      {dateStr} <Text className="text-muted-foreground font-normal">at {timeStr}</Text>
                    </Text>
                    {getScoreBadge(obs.news2Score)}
                  </View>

                  {/* Vitals Summary Pills */}
                  <View className="flex-row flex-wrap gap-1.5 mb-2">
                    {obs.bpSystolic != null && (
                      <View className="px-2.5 py-1 rounded-lg bg-white">
                        <Text className="text-xs text-muted-foreground font-medium">
                          BP: <Text className="font-bold text-foreground">{obs.bpSystolic}/{obs.bpDiastolic || '—'}</Text>
                        </Text>
                      </View>
                    )}
                    {obs.pulse != null && (
                      <View className="px-2.5 py-1 rounded-lg bg-white">
                        <Text className="text-xs text-muted-foreground font-medium">
                          Pulse: <Text className="font-bold text-foreground">{obs.pulse}</Text> bpm
                        </Text>
                      </View>
                    )}
                    {obs.temp != null && (
                      <View className="px-2.5 py-1 rounded-lg bg-white">
                        <Text className="text-xs text-muted-foreground font-medium">
                          Temp: <Text className="font-bold text-foreground">{obs.temp}</Text> °C
                        </Text>
                      </View>
                    )}
                    {obs.spo2 != null && (
                      <View className="px-2.5 py-1 rounded-lg bg-white">
                        <Text className="text-xs text-muted-foreground font-medium">
                          SpO2: <Text className="font-bold text-foreground">{obs.spo2}%</Text> ({obs.airOrOxygen || 'Air'})
                        </Text>
                      </View>
                    )}
                    {obs.respiration != null && (
                      <View className="px-2.5 py-1 rounded-lg bg-white">
                        <Text className="text-xs text-muted-foreground font-medium">
                          Resp: <Text className="font-bold text-foreground">{obs.respiration}</Text> br/m
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Flags & Notes */}
                  <View className="flex-row items-center justify-between pt-1.5 border-t border-slate-200/60">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      {obs.isAbnormal && (
                        <View className="flex-row items-center gap-1">
                          <AlertTriangle size={11} color="#FF3B2F" />
                          <Text className="text-xs font-bold text-clinical-critical">Abnormal</Text>
                        </View>
                      )}
                      {obs.notifyGP && (
                        <Text className="text-xs font-bold text-clinical-warning">· GP Notified</Text>
                      )}
                      {obs.increaseMonitoring && (
                        <Text className="text-xs font-bold text-clinical-info">· Increased Mon.</Text>
                      )}
                      {obs.notes && (
                        <Text className="text-xs text-muted-foreground italic flex-1" numberOfLines={1}>
                          {obs.notes}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={14} color="#8E8E93" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Detail Modal */}
      <ObservationDetailModal observation={selectedObs} onClose={() => setSelectedObs(null)} />
    </View>
  );
}

