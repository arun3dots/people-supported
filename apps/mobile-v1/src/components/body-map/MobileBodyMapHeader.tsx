import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, User, Plus, X } from 'lucide-react-native';
import { Text } from '../ui/text';
import type { ResidentDetailData } from '../../presentation/hooks/useResidentDetail';
import type { BodyMapViewType } from '@repo/schema';

interface Props {
  resident: ResidentDetailData;
  view?: BodyMapViewType;
  onViewChange?: (view: BodyMapViewType) => void;
  onBack: () => void;
  isAddMode?: boolean;
  onToggleAddMode?: () => void;
  onResetSelection?: () => void;
}

/**
 * Clean clinical header bar for Full View Body Map
 * displaying Back Arrow, Resident Photo & Name, and Add Finding / Cancel toggle button
 */
export function MobileBodyMapHeader({
  resident,
  onBack,
  isAddMode = false,
  onToggleAddMode,
}: Props) {
  const roomNumber = resident.bed?.room?.roomNumber;
  const bedLabel = resident.bed?.bedLabel || resident.bed?.number;
  const roomMeta = roomNumber ? `Room ${roomNumber}${bedLabel ? ` · Bed ${bedLabel}` : ''}` : 'Person Supported';

  return (
    <View className="flex-row items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200/90 shadow-2xs">
      {/* 1. Back Arrow & Resident Avatar + Meta */}
      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center -ml-1 rounded-full bg-slate-100/90"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Circular Resident Photo Avatar */}
        <View className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-[#4A706A]/30 items-center justify-center">
          {resident.photoUrl ? (
            <Image
              source={{ uri: resident.photoUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <User size={20} color="#4A706A" />
          )}
        </View>

        {/* Resident Full Name & Room Info */}
        <View className="flex-1 justify-center">
          <Text className="text-sm font-bold text-[#141F1E]" numberOfLines={1}>
            {resident.fullName}
          </Text>
          <Text className="text-[11px] text-slate-500 font-medium" numberOfLines={1}>
            {roomMeta}
          </Text>
        </View>
      </View>

      {/* 2. Add Finding Mode Trigger Button */}
      <View className="flex-row items-center gap-1.5">
        {onToggleAddMode && (
          <TouchableOpacity
            onPress={onToggleAddMode}
            activeOpacity={0.8}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              isAddMode
                ? 'bg-rose-50 border border-rose-200'
                : 'bg-[#4A706A] shadow-xs'
            }`}
          >
            {isAddMode ? (
              <>
                <X size={14} color="#E11D48" />
                <Text className="text-xs font-bold text-rose-600">Cancel</Text>
              </>
            ) : (
              <>
                <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
                <Text className="text-xs font-bold text-white">Add Finding</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
