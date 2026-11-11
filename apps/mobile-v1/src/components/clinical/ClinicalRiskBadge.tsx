import * as React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';

export interface ClinicalRiskBadgeProps {
  type: 'Fall' | 'Pressure' | 'Choking' | 'DNACPR';
  level?: 'Low' | 'Medium' | 'High';
  className?: string;
}

export function ClinicalRiskBadge({ type, level = 'Low', className }: ClinicalRiskBadgeProps) {
  if (type === 'DNACPR') {
    return (
      <View className={`rounded-md bg-purple-100 border border-purple-300 px-2 py-0.5 ${className || ''}`}>
        <Text className="text-[11px] font-bold text-purple-800">ReSPECT / DNACPR</Text>
      </View>
    );
  }

  const isHigh = level === 'High';
  const isMed = level === 'Medium';

  const bgClass = isHigh ? 'bg-[#FFF2F1] border-[#FF3B2F]/30' : isMed ? 'bg-[#FDFBE9] border-[#C38C0B]/30' : 'bg-[#F1FCF3] border-[#1D5E2E]/20';
  const textClass = isHigh ? 'text-[#FF3B2F]' : isMed ? 'text-[#C38C0B]' : 'text-[#1D5E2E]';

  return (
    <View className={`rounded-md border px-2 py-0.5 ${bgClass} ${className || ''}`}>
      <Text className={`text-[11px] font-semibold ${textClass}`}>
        {type}: {level}
      </Text>
    </View>
  );
}
