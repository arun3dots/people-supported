import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AlertCircle, History, ListFilter } from 'lucide-react-native';
import { Text } from '../ui/text';

interface Props {
  openFindingsCount: number;
  assessmentsCount: number;
  onOpenFindings: () => void;
  onOpenHistory: () => void;
  onOpenSelector: () => void;
  isAddMode?: boolean;
}

/**
 * Floating bottom dock on Full View Body Map.
 * When in Add Mode: ONLY shows Body Regions quick selector.
 * When in View Mode: Shows Active Findings and Assessment History.
 */
export function MobileBodyMapDock({
  openFindingsCount,
  assessmentsCount,
  onOpenFindings,
  onOpenHistory,
  onOpenSelector,
  isAddMode = false,
}: Props) {
  if (isAddMode) {
    return (
      <View className="absolute bottom-4 left-3 right-3 z-20 flex-row items-center justify-center pointer-events-box-none">
        <TouchableOpacity
          onPress={onOpenSelector}
          activeOpacity={0.8}
          className="flex-row items-center gap-2 px-4 py-2.5 bg-white/95 rounded-xl border border-[#4A706A]/30 shadow-md"
        >
          <ListFilter size={16} color="#4A706A" />
          <Text className="text-xs font-bold text-[#4A706A]">Select Body Region</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="absolute bottom-4 left-3 right-3 z-20 flex-row items-center justify-between pointer-events-box-none">
      {/* 1. Active Findings Pill */}
      <TouchableOpacity
        onPress={onOpenFindings}
        activeOpacity={0.8}
        className="flex-row items-center gap-1.5 px-3 py-2 bg-white/95 rounded-xl border border-slate-200/90 shadow-md"
      >
        <AlertCircle size={15} color={openFindingsCount > 0 ? '#EF4444' : '#4A706A'} />
        <Text className="text-xs font-semibold text-slate-800">
          Findings {openFindingsCount > 0 ? `(${openFindingsCount})` : ''}
        </Text>
      </TouchableOpacity>

      {/* 2. History Pill */}
      <TouchableOpacity
        onPress={onOpenHistory}
        activeOpacity={0.8}
        className="flex-row items-center gap-1.5 px-3 py-2 bg-white/95 rounded-xl border border-slate-200/90 shadow-md"
      >
        <History size={15} color="#475569" />
        <Text className="text-xs font-semibold text-slate-700">
          History {assessmentsCount > 0 ? `(${assessmentsCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
