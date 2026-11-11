import React from 'react';
import { View, Modal, ScrollView, TouchableOpacity } from 'react-native';
import {
  X,
  Thermometer,
  Heart,
  Activity,
  Wind,
  Brain,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { Text, Badge } from '../../presentation/components/common';
import { formatUkDate, formatUkTime } from '../../lib/date';
import {
  scoreRespiration,
  scoreSpo2,
  scoreAirOrOxygen,
  scoreSystolicBp,
  scorePulse,
  scoreTemperature,
  scoreConsciousness,
} from '../../domain/clinical/news2';

export interface ObservationDetailData {
  id: string;
  news2Score?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulse?: number | null;
  temp?: number | null;
  spo2?: number | null;
  spo2Scale?: number | null;
  airOrOxygen?: 'Air' | 'Oxygen' | null;
  consciousness?: string | null;
  isAbnormal?: boolean | null;
  notifyGP?: boolean | null;
  increaseMonitoring?: boolean | null;
  respiration?: number | null;
  timestamp: string;
  notes?: string | null;
}

interface ObservationDetailModalProps {
  observation: ObservationDetailData | null;
  onClose: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  let bg = 'bg-emerald-500';
  if (score === 1) bg = 'bg-amber-500';
  else if (score === 2) bg = 'bg-orange-500';
  else if (score >= 3) bg = 'bg-rose-500';

  return (
    <View className={`w-6 h-6 rounded-md ${bg} items-center justify-center`}>
      <Text className="text-white text-xs font-bold">{score}</Text>
    </View>
  );
}

function ParamRow({
  icon: Icon,
  label,
  value,
  unit,
  score,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  score: number;
}) {
  return (
    <View className="flex-row items-center justify-between p-3.5 rounded-2xl bg-surface mb-2">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
          <Icon size={16} color="#4A706A" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-muted-foreground uppercase">{label}</Text>
          <Text className="text-md font-bold text-foreground">
            {value} {unit && <Text className="text-xs font-normal text-muted-foreground">{unit}</Text>}
          </Text>
        </View>
      </View>
      <ScoreBadge score={score} />
    </View>
  );
}

export function ObservationDetailModal({ observation, onClose }: ObservationDetailModalProps) {
  if (!observation) return null;

  const score = observation.news2Score ?? 0;
  const isHigh = score >= 7;
  const isMed = score >= 5 && score < 7;
  const isLow = score >= 1 && score < 5;

  const respScore = scoreRespiration(observation.respiration);
  const spo2Score = scoreSpo2(observation.spo2, (observation.spo2Scale as 1 | 2) || 1, observation.airOrOxygen || 'Air');
  const oxyScore = scoreAirOrOxygen(observation.airOrOxygen);
  const bpScore = scoreSystolicBp(observation.bpSystolic);
  const pulseScore = scorePulse(observation.pulse);
  const tempScore = scoreTemperature(observation.temp);
  const consciousScore = scoreConsciousness(observation.consciousness);

  const formattedDate = formatUkDate(observation.timestamp, { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = formatUkTime(observation.timestamp);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end sm:justify-center p-0 sm:p-4">
        <View className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[85%] w-full overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <View>
              <Text className="text-lg font-bold text-[#141F1E]">Observation Breakdown</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Clock size={12} color="#7C8B87" />
                <Text className="text-xs text-slate-500">
                  {formattedDate} at {formattedTime}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={18} color="#141F1E" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* Score Summary Banner */}
            <View
              className={`p-4 rounded-xl border mb-4 flex-row items-center justify-between ${
                isHigh
                  ? 'bg-rose-50 border-rose-200'
                  : isMed
                    ? 'bg-amber-50 border-amber-200'
                    : isLow
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <View>
                <Text className="text-xs font-semibold text-slate-600">NEWS2 Total Score</Text>
                <Text
                  className={`text-2xl font-black ${
                    isHigh
                      ? 'text-rose-700'
                      : isMed
                        ? 'text-amber-800'
                        : isLow
                          ? 'text-yellow-700'
                          : 'text-emerald-700'
                  }`}
                >
                  {score}{' '}
                  <Text className="text-xs font-bold">
                    {isHigh ? '• High Risk' : isMed ? '• Medium Risk' : isLow ? '• Low Risk' : '• Normal'}
                  </Text>
                </Text>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${
                  isHigh ? 'bg-rose-600' : isMed ? 'bg-amber-600' : isLow ? 'bg-yellow-600' : 'bg-emerald-600'
                }`}
              >
                <Text className="text-white text-xs font-bold">
                  {isHigh ? 'Urgent 999' : isMed ? 'Nurse Review' : isLow ? 'Monitor 4h' : 'Routine 12h'}
                </Text>
              </View>
            </View>

            {/* Parameter Rows */}
            <Text className="text-xs font-bold text-slate-700 mb-2 uppercase">Physiological Metrics</Text>
            <ParamRow
              icon={Thermometer}
              label="Temperature"
              value={observation.temp != null ? observation.temp : '—'}
              unit="°C"
              score={tempScore}
            />
            <ParamRow
              icon={Heart}
              label="Heart Rate (Pulse)"
              value={observation.pulse != null ? observation.pulse : '—'}
              unit="bpm"
              score={pulseScore}
            />
            <ParamRow
              icon={Activity}
              label="Blood Pressure"
              value={
                observation.bpSystolic != null
                  ? `${observation.bpSystolic} / ${observation.bpDiastolic || '—'}`
                  : '—'
              }
              unit="mmHg"
              score={bpScore}
            />
            <ParamRow
              icon={Wind}
              label="Respiration Rate"
              value={observation.respiration != null ? observation.respiration : '—'}
              unit="br/min"
              score={respScore}
            />
            <ParamRow
              icon={Activity}
              label={`Oxygen (SpO2 - Scale ${observation.spo2Scale || 1})`}
              value={observation.spo2 != null ? observation.spo2 : '—'}
              unit="%"
              score={spo2Score}
            />
            <ParamRow
              icon={Wind}
              label="Air or Supplemental O2"
              value={observation.airOrOxygen || 'Air'}
              score={oxyScore}
            />
            <ParamRow
              icon={Brain}
              label="Consciousness (ACVPU)"
              value={observation.consciousness || 'Alert'}
              score={consciousScore}
            />

            {/* Clinical Actions & Escalation */}
            <View className="mt-3 pt-3 border-t border-slate-100">
              <Text className="text-xs font-bold text-slate-700 mb-2 uppercase">Clinical Actions</Text>
              <View className="flex-row flex-wrap gap-2">
                {observation.isAbnormal && (
                  <View className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 flex-row items-center gap-1">
                    <AlertTriangle size={12} color="#E11D48" />
                    <Text className="text-xs font-bold text-rose-700">Abnormal Finding</Text>
                  </View>
                )}
                {observation.notifyGP && (
                  <View className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 flex-row items-center gap-1">
                    <AlertTriangle size={12} color="#D97706" />
                    <Text className="text-xs font-bold text-amber-800">GP Notified</Text>
                  </View>
                )}
                {observation.increaseMonitoring && (
                  <View className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 flex-row items-center gap-1">
                    <Activity size={12} color="#0284C7" />
                    <Text className="text-xs font-bold text-sky-800">Monitoring Increased</Text>
                  </View>
                )}
                {!observation.isAbnormal && !observation.notifyGP && !observation.increaseMonitoring && (
                  <View className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 flex-row items-center gap-1">
                    <CheckCircle2 size={12} color="#10B981" />
                    <Text className="text-xs font-medium text-slate-600">Standard monitoring protocol</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Contemporaneous Notes */}
            <View className="mt-3 pt-3 border-t border-slate-100 mb-6">
              <Text className="text-xs font-bold text-slate-700 mb-1.5 uppercase">Clinical Notes</Text>
              <View className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <Text className="text-xs text-slate-700 leading-relaxed">
                  {observation.notes?.trim() || 'No additional contemporaneous notes recorded.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

