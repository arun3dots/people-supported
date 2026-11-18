import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  Droplet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  Plus,
} from 'lucide-react-native';
import { Text, Card, Progress } from '../../presentation/components/common';
import {
  BEVERAGE_PRESETS,
  BeveragePreset,
  FluidBalanceSummary,
} from '../../domain/clinical/fluid-balance';

interface FluidIntakeSummaryCardProps {
  summary: FluidBalanceSummary;
  fluidCount: number;
  foodCount: number;
  totalEntries: number;
  canQuickLog: boolean;
  isSaving: boolean;
  onQuickAdd: (preset: BeveragePreset) => void;
}

export function FluidIntakeSummaryCard({
  summary,
  fluidCount,
  foodCount,
  totalEntries,
  canQuickLog,
  isSaving,
  onQuickAdd,
}: FluidIntakeSummaryCardProps) {
  const {
    totalIntakeMl,
    dailyTargetMl,
    percentageCompleted,
    remainingMl,
    isDehydratedRisk,
    statusLabel,
  } = summary;

  const progressSub = percentageCompleted === null ? 'Clinical target not recorded' : isDehydratedRisk
    ? 'Below daily target'
    : percentageCompleted >= 100
      ? 'Daily target reached'
      : `${remainingMl} ml remaining`;

  return (
    <Card className="p-4 mb-3">
      {/* 2x2 Hydration Metrics Grid (Web FluidIntakeMetricsCards parity) */}
      <View className="flex-row gap-2.5 mb-2.5">
        {/* Card 1: Total Fluid Intake */}
        <View className="flex-1 p-3 rounded-xl bg-white">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium text-muted-foreground">Total Fluid Intake</Text>
            <Droplet size={13} color="#4A706A" />
          </View>
          <Text className="text-md font-bold text-foreground">
            {totalIntakeMl.toLocaleString()} ml
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Target: {dailyTargetMl === null ? 'Not recorded' : `${dailyTargetMl.toLocaleString()} ml`}
          </Text>
        </View>

        {/* Card 2: Target Progress */}
        <View className="flex-1 p-3 rounded-xl bg-white">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium text-muted-foreground">Target Progress</Text>
            <TrendingUp size={13} color="#4A706A" />
          </View>
          <Text className="text-md font-bold text-foreground">{percentageCompleted === null ? 'Not recorded' : `${percentageCompleted}%`}</Text>
          <Text
            className={`text-xs font-medium mt-0.5 ${
              isDehydratedRisk ? 'text-clinical-critical' : 'text-primary'
            }`}
            numberOfLines={1}
          >
            {progressSub}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2.5 mb-3">
        {/* Card 3: Hydration Status */}
        <View className="flex-1 p-3 rounded-xl bg-white">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium text-muted-foreground">Hydration Status</Text>
            {isDehydratedRisk ? (
              <AlertTriangle size={13} color="#FF3B2F" />
            ) : (
              <CheckCircle2 size={13} color="#4A706A" />
            )}
          </View>
          <Text
            className={`text-sm font-bold ${
              isDehydratedRisk ? 'text-clinical-critical' : 'text-foreground'
            }`}
            numberOfLines={1}
          >
            {statusLabel}
          </Text>
          <Text
            className={`text-xs font-medium mt-0.5 ${
              isDehydratedRisk ? 'text-clinical-critical' : 'text-primary'
            }`}
          >
            {percentageCompleted === null ? 'Review the recorded support plan' : isDehydratedRisk ? 'Below recorded target' : 'Intake recorded'}
          </Text>
        </View>

        {/* Card 4: Entries Logged */}
        <View className="flex-1 p-3 rounded-xl bg-white">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium text-muted-foreground">Entries Logged</Text>
            <Utensils size={13} color="#5D5D5D" />
          </View>
          <Text className="text-md font-bold text-foreground">{totalEntries}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {fluidCount} fluid · {foodCount} food
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {percentageCompleted !== null && <Progress
        value={percentageCompleted}
        indicatorClassName={isDehydratedRisk ? 'bg-clinical-critical' : 'bg-primary'}
        className="h-2 bg-white"
      />}

      {isDehydratedRisk && (
        <View className="flex-row items-center gap-1.5 rounded-xl bg-clinical-warningBg px-3 py-2 mt-2.5">
          <AlertTriangle size={13} color="#C38C0B" />
          <Text className="text-xs font-semibold text-clinical-warning flex-1">
            Dehydration risk: Prompt person supported with preferred fluids (NICE CG32).
          </Text>
        </View>
      )}

      {/* Quick Point-of-Care Fluid Presets (Today only) */}
      {canQuickLog && (
        <View className="pt-3 mt-3 border-t border-slate-200/70">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Quick Point-of-Care Logging
          </Text>
          <View className="flex-row gap-1.5">
            {BEVERAGE_PRESETS.slice(0, 4).map((preset) => (
              <TouchableOpacity
                key={preset.id}
                disabled={isSaving}
                onPress={() => onQuickAdd(preset)}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center rounded-xl bg-white py-2 px-1"
              >
                <View className="flex-row items-center gap-0.5">
                  <Plus size={11} color="#4A706A" strokeWidth={2.5} />
                  <Text className="text-xs font-bold text-foreground">{preset.amountMl}ml</Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                  {preset.shortLabel || preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

