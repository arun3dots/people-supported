import React from 'react';
import { View } from 'react-native';
import { ShieldAlert, Wrench } from 'lucide-react-native';
import { Text } from '../ui/text';

interface Props {
  dueCount: number;
  administeredCount: number;
  missedCount: number;
  prnCount: number;
  onHoldCount: number;
}

export function ResidentMarStatsRow({
  dueCount,
  administeredCount,
  missedCount,
  prnCount,
  onHoldCount,
}: Props) {
  return (
    <View className="flex-row gap-1.5 mb-4">
      {/* Due Today */}
      <View className="flex-1 bg-surface rounded-2xl p-2.5 items-center justify-between min-h-[76px]">
        <View className="px-2 py-0.5 rounded-full bg-clinical-safeBg">
          <Text className="text-xs font-bold text-clinical-safe">Rx</Text>
        </View>
        <Text className="text-xs font-medium text-text-secondary text-center" numberOfLines={1}>
          Due
        </Text>
        <Text className="text-lg font-bold text-text-primary">{dueCount}</Text>
      </View>

      {/* Administered */}
      <View className="flex-1 bg-surface rounded-2xl p-2.5 items-center justify-between min-h-[76px]">
        <View className="px-2 py-0.5 rounded-full bg-teal-50">
          <Text className="text-xs font-bold text-teal-600">2h</Text>
        </View>
        <Text className="text-xs font-medium text-text-secondary text-center" numberOfLines={1}>
          Given
        </Text>
        <Text className="text-lg font-bold text-text-primary">{administeredCount}</Text>
      </View>

      {/* Missed */}
      <View className="flex-1 bg-surface rounded-2xl p-2.5 items-center justify-between min-h-[76px]">
        <View className="px-2 py-1 rounded-full bg-clinical-criticalBg">
          <ShieldAlert size={12} color="#FF3B2F" />
        </View>
        <Text className="text-xs font-medium text-text-secondary text-center" numberOfLines={1}>
          Missed
        </Text>
        <Text className="text-lg font-bold text-text-primary">{missedCount}</Text>
      </View>

      {/* PRN Available */}
      <View className="flex-1 bg-surface rounded-2xl p-2.5 items-center justify-between min-h-[76px]">
        <View className="px-2 py-0.5 rounded-full bg-sky-50">
          <Text className="text-xs font-bold text-sky-600">PRN</Text>
        </View>
        <Text className="text-xs font-medium text-text-secondary text-center" numberOfLines={1}>
          PRN
        </Text>
        <Text className="text-lg font-bold text-text-primary">{prnCount}</Text>
      </View>

      {/* On Hold */}
      <View className="flex-1 bg-surface rounded-2xl p-2.5 items-center justify-between min-h-[76px]">
        <View className="px-2 py-1 rounded-full bg-clinical-warningBg">
          <Wrench size={12} color="#D97706" />
        </View>
        <Text className="text-xs font-medium text-text-secondary text-center" numberOfLines={1}>
          Hold
        </Text>
        <Text className="text-lg font-bold text-text-primary">{onHoldCount}</Text>
      </View>
    </View>
  );
}
