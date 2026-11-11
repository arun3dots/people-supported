import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Text } from '../../presentation/components/common';
import {
  News2Input,
  scoreRespiration,
  scoreSpo2,
  scoreAirOrOxygen,
  scoreSystolicBp,
  scorePulse,
  scoreTemperature,
  scoreConsciousness,
} from '../../domain/clinical/news2';
import { News2ClinicalActions } from './News2ClinicalActions';
import { theme } from '../../theme';

interface News2VitalsCardProps {
  vitals: News2Input;
  updateVital: <K extends keyof News2Input>(field: K, value: News2Input[K]) => void;
}

const ACVPU_OPTIONS: Array<{ key: News2Input['consciousness']; label: string; short: string }> = [
  { key: 'Alert', label: 'Alert', short: 'A' },
  { key: 'Confusion', label: 'Confusion', short: 'C' },
  { key: 'Voice', label: 'Voice', short: 'V' },
  { key: 'Pain', label: 'Pain', short: 'P' },
  { key: 'Unresponsive', label: 'Unresponsive', short: 'U' },
];

function ScoreBadge({ score }: { score: number }) {
  let bg = 'bg-clinical-safeBg';
  let text = 'text-clinical-safe';
  if (score === 1 || score === 2) {
    bg = 'bg-clinical-warningBg';
    text = 'text-clinical-warning';
  } else if (score >= 3) {
    bg = 'bg-clinical-criticalBg';
    text = 'text-clinical-critical';
  }

  return (
    <View className={`px-2 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>Score: {score}</Text>
    </View>
  );
}

export function News2VitalsCard({ vitals, updateVital }: News2VitalsCardProps) {
  const respScore = scoreRespiration(vitals.respirationRate);
  const spo2Score = scoreSpo2(vitals.spo2, vitals.spo2Scale || 1, vitals.airOrOxygen || 'Air');
  const oxyScore = scoreAirOrOxygen(vitals.airOrOxygen);
  const bpScore = scoreSystolicBp(vitals.systolicBp);
  const pulseScore = scorePulse(vitals.pulseRate);
  const tempScore = scoreTemperature(vitals.temperature);
  const consciousScore = scoreConsciousness(vitals.consciousness);
  const [consciousnessOpen, setConsciousnessOpen] = useState(false);
  const selectedConsciousness = ACVPU_OPTIONS.find((opt) => opt.key === vitals.consciousness);
  const inputFont = { fontFamily: theme.fonts.medium };

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-lg font-bold text-foreground mb-3">Physiological Parameters</Text>

      {/* Row 1: Respiration (bpm) & Oxygen Saturation (%) */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              Respiration (bpm) <Text className="text-clinical-critical font-bold">*</Text>
            </Text>
            <ScoreBadge score={respScore} />
          </View>
          <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
            <TextInput
              value={vitals.respirationRate?.toString() || ''}
              onChangeText={(v) => updateVital('respirationRate', v ? parseInt(v, 10) : null)}
              keyboardType="numeric"
              placeholder="16"
              placeholderTextColor="#8E8E93"
              style={inputFont}
              className="flex-1 text-md text-foreground p-0"
            />
            <Text className="text-xs font-medium text-muted-foreground">bpm</Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              Oxygen Saturation <Text className="text-clinical-critical font-bold">*</Text>
            </Text>
            <ScoreBadge score={spo2Score} />
          </View>
          <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
            <TextInput
              value={vitals.spo2?.toString() || ''}
              onChangeText={(v) => updateVital('spo2', v ? parseInt(v, 10) : null)}
              keyboardType="numeric"
              placeholder="98"
              placeholderTextColor="#8E8E93"
              style={inputFont}
              className="flex-1 text-md text-foreground p-0"
            />
            <Text className="text-xs font-medium text-muted-foreground">%</Text>
          </View>
        </View>
      </View>

      {/* Row 2: SpO2 Scale */}
      <View className="mb-3">
        <Text className="text-xs font-semibold text-muted-foreground mb-1.5">SpO2 Scale</Text>
        <View className="h-11 bg-white p-1 rounded-full flex-row items-center gap-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => updateVital('spo2Scale', 1)}
            className={`flex-1 h-full rounded-full items-center justify-center ${
              (vitals.spo2Scale ?? 1) === 1 ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                (vitals.spo2Scale ?? 1) === 1 ? 'font-bold text-white' : 'font-medium text-muted-foreground'
              }`}
            >
              Scale 1 (Normal)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => updateVital('spo2Scale', 2)}
            className={`flex-1 h-full rounded-full items-center justify-center ${
              vitals.spo2Scale === 2 ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                vitals.spo2Scale === 2 ? 'font-bold text-white' : 'font-medium text-muted-foreground'
              }`}
            >
              Scale 2 (COPD)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 3: Air or Oxygen? */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-muted-foreground">
            Air or Oxygen? <Text className="text-clinical-critical font-bold">*</Text>
          </Text>
          <ScoreBadge score={oxyScore} />
        </View>
        <View className="h-11 bg-white p-1 rounded-full flex-row items-center gap-1">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => updateVital('airOrOxygen', 'Air')}
            className={`flex-1 h-full rounded-full items-center justify-center ${
              vitals.airOrOxygen === 'Air' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                vitals.airOrOxygen === 'Air' ? 'font-bold text-white' : 'font-medium text-muted-foreground'
              }`}
            >
              Air
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => updateVital('airOrOxygen', 'Oxygen')}
            className={`flex-1 h-full rounded-full items-center justify-center ${
              vitals.airOrOxygen === 'Oxygen' ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                vitals.airOrOxygen === 'Oxygen' ? 'font-bold text-white' : 'font-medium text-muted-foreground'
              }`}
            >
              Oxygen
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 4: Blood Pressure (mmHg) */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-muted-foreground">
            Blood Pressure (mmHg) <Text className="text-clinical-critical font-bold">*</Text>
          </Text>
          <ScoreBadge score={bpScore} />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
              <TextInput
                value={vitals.systolicBp?.toString() || ''}
                onChangeText={(v) => updateVital('systolicBp', v ? parseInt(v, 10) : null)}
                keyboardType="numeric"
                placeholder="Systolic (120)"
                placeholderTextColor="#8E8E93"
                style={inputFont}
                className="flex-1 text-md text-foreground p-0"
              />
              <Text className="text-xs font-medium text-muted-foreground">Sys</Text>
            </View>
          </View>
          <View className="flex-1">
            <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
              <TextInput
                value={vitals.diastolicBp?.toString() || ''}
                onChangeText={(v) => updateVital('diastolicBp', v ? parseInt(v, 10) : null)}
                keyboardType="numeric"
                placeholder="Diastolic (80)"
                placeholderTextColor="#8E8E93"
                style={inputFont}
                className="flex-1 text-md text-foreground p-0"
              />
              <Text className="text-xs font-medium text-muted-foreground">Dia</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Row 5: Pulse (bpm) & Temperature (°C) */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              Pulse (bpm) <Text className="text-clinical-critical font-bold">*</Text>
            </Text>
            <ScoreBadge score={pulseScore} />
          </View>
          <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
            <TextInput
              value={vitals.pulseRate?.toString() || ''}
              onChangeText={(v) => updateVital('pulseRate', v ? parseInt(v, 10) : null)}
              keyboardType="numeric"
              placeholder="72"
              placeholderTextColor="#8E8E93"
              style={inputFont}
              className="flex-1 text-md text-foreground p-0"
            />
            <Text className="text-xs font-medium text-muted-foreground">bpm</Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              Temperature (°C) <Text className="text-clinical-critical font-bold">*</Text>
            </Text>
            <ScoreBadge score={tempScore} />
          </View>
          <View className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between">
            <TextInput
              value={vitals.temperature?.toString() || ''}
              onChangeText={(v) => updateVital('temperature', v ? parseFloat(v) : null)}
              keyboardType="decimal-pad"
              placeholder="36.5"
              placeholderTextColor="#8E8E93"
              style={inputFont}
              className="flex-1 text-md text-foreground p-0"
            />
            <Text className="text-xs font-medium text-muted-foreground">°C</Text>
          </View>
        </View>
      </View>

      {/* Row 6: Consciousness (ACVPU) */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-semibold text-muted-foreground">
            Consciousness (ACVPU) <Text className="text-clinical-critical font-bold">*</Text>
          </Text>
          <ScoreBadge score={consciousScore} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setConsciousnessOpen((open) => !open)}
          className="h-12 px-3.5 rounded-xl bg-white flex-row items-center justify-between"
        >
          <Text className="text-md font-medium text-foreground">
            {selectedConsciousness
              ? `${selectedConsciousness.short} — ${selectedConsciousness.label}`
              : 'Select consciousness'}
          </Text>
          {consciousnessOpen ? (
            <ChevronUp size={18} color="#5D5D5D" />
          ) : (
            <ChevronDown size={18} color="#5D5D5D" />
          )}
        </TouchableOpacity>
        {consciousnessOpen && (
          <View className="mt-1.5 rounded-xl bg-white overflow-hidden">
            {ACVPU_OPTIONS.map((opt, index) => {
              const isSelected = vitals.consciousness === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateVital('consciousness', opt.key);
                    setConsciousnessOpen(false);
                  }}
                  className={`h-12 px-3.5 flex-row items-center justify-between ${
                    index > 0 ? 'border-t border-slate-100' : ''
                  } ${isSelected ? 'bg-primary-light' : 'bg-white'}`}
                >
                  <Text
                    className={`text-md ${
                      isSelected ? 'font-bold text-primary' : 'font-medium text-foreground'
                    }`}
                  >
                    {opt.short} — {opt.label}
                  </Text>
                  {isSelected && <Check size={16} color="#4A706A" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Row 7: Clinical Actions & Escalation */}
      <News2ClinicalActions vitals={vitals} updateVital={updateVital} />
    </View>
  );
}
