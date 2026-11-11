import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Crosshair, Plus, RotateCcw } from 'lucide-react-native';
import { Text } from '../ui/text';
import type { ExactPointDTO } from '@repo/schema';

interface Props {
  selectedAnatomyId: string | null;
  selectedLabel: string | null;
  mode?: 'navigate' | 'mark-exact';
  isZoomed: boolean;
  exactPoint: ExactPointDTO | null;
  onSelectExactPoint: (pt: ExactPointDTO | null) => void;
  onOpenAddFinding?: (anatomyId: string, label: string) => void;
  onResetZoom: () => void;
}

/**
 * Top contextual action bar for the Body Map canvas matching the app's #4A706A theme.
 */
export function BodyMapTopBar({
  selectedAnatomyId,
  selectedLabel,
  isZoomed,
  exactPoint,
  onSelectExactPoint,
  onOpenAddFinding,
  onResetZoom,
}: Props) {
  if (selectedAnatomyId && selectedLabel) {
    return (
      <View className="w-full flex-row items-center justify-between bg-white rounded-xl border border-[#4A706A]/30 p-2.5 mb-2 shadow-xs">
        {/* Left: Icon & Area Details */}
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-8 h-8 rounded-lg bg-[#4A706A]/10 items-center justify-center border border-[#4A706A]/20">
            <Crosshair size={16} color="#4A706A" strokeWidth={2.4} />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-xs font-bold text-[#141F1E]">
              {selectedLabel}
            </Text>
            <Text className="text-[10px] text-slate-500">
              Drag pin to pinpoint · Drag map to pan
            </Text>
          </View>
        </View>

        {/* Right: Quick Action Buttons */}
        <View className="flex-row items-center gap-1.5">
          {onOpenAddFinding && (
            <TouchableOpacity
              onPress={() => onOpenAddFinding(selectedAnatomyId, selectedLabel)}
              activeOpacity={0.7}
              className="bg-[#4A706A] px-2.5 py-1.5 rounded-lg flex-row items-center gap-1 shadow-xs"
            >
              <Plus size={12} color="#FFFFFF" strokeWidth={2.4} />
              <Text className="text-[11px] font-bold text-white">Add Finding</Text>
            </TouchableOpacity>
          )}

          {isZoomed && (
            <TouchableOpacity
              onPress={onResetZoom}
              activeOpacity={0.7}
              className="bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200"
            >
              <Text className="text-[10px] font-semibold text-slate-700">Full Body</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full flex-row items-center justify-between px-2 mb-2">
      <View className="flex-row items-center gap-1.5">
        <View className="w-2 h-2 rounded-full bg-[#4A706A]" />
        <Text className="text-[11px] font-semibold text-slate-700">
          Tap any body area to inspect · Pinch or drag to pan
        </Text>
      </View>

      {exactPoint && (
        <TouchableOpacity
          onPress={() => onSelectExactPoint(null)}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 bg-slate-100 px-2 py-1 rounded-md border border-slate-200"
        >
          <RotateCcw size={12} color="#64748B" />
          <Text className="text-[10px] font-medium text-slate-600">Clear Pin</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
