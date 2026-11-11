import * as React from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Text } from '../ui/text';
import { ResidentAllergy } from '../../domain/entities/Resident';

export interface ResidentAllergyBadgeProps {
  allergies?: ResidentAllergy[];
  className?: string;
}

export function ResidentAllergyBadge({ allergies = [], className }: ResidentAllergyBadgeProps) {
  if (!allergies || allergies.length === 0) {
    return (
      <View className={`flex-row items-center rounded-md bg-[#F1FCF3] px-2.5 py-1 border border-[#1D5E2E]/20 ${className || ''}`}>
        <Text className="text-xs font-medium text-[#1D5E2E]">No Known Drug Allergies (NKDA)</Text>
      </View>
    );
  }

  const allergyListStr = allergies.map((a) => a.allergen).join(', ');

  return (
    <View className={`flex-row items-center gap-1.5 rounded-md bg-[#FFF2F1] px-2.5 py-1 border border-[#FF3B2F]/30 ${className || ''}`}>
      <AlertTriangle size={14} color="#FF3B2F" strokeWidth={2.5} />
      <Text className="text-xs font-bold text-[#FF3B2F]">
        ALLERGY: <Text className="font-semibold text-[#FF3B2F]">{allergyListStr}</Text>
      </Text>
    </View>
  );
}
