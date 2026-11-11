import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`rounded-full px-3.5 py-2 ${
        active ? 'bg-primary' : 'bg-surface'
      }`}
    >
      <Text
        className={`text-xs ${
          active ? 'text-white font-semibold' : 'text-muted-foreground font-medium'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
