import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Bed, ChevronRight, AlertTriangle, UserCheck } from 'lucide-react-native';
import type { EmergencyDirectoryItemDTO } from '@repo/schema';
import { Avatar, Text } from '../../presentation/components/common';

interface Props {
  resident: EmergencyDirectoryItemDTO;
  onPress: () => void;
}

export function EmergencyResidentRow({ resident, onPress }: Props) {
  const room = resident.roomNumber ? `Room ${resident.roomNumber}` : 'Unassigned';
  const demographics = [resident.gender, resident.age !== null ? `${resident.age} yrs` : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open emergency summary for ${resident.fullName}`}
      className="bg-surface rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-center">
        <View className="mr-3">
          <Avatar name={resident.fullName} imageUrl={resident.photoUrl} size="lg" />
        </View>

        <View className="flex-1 mr-1">
          <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
            {resident.fullName}
          </Text>
          <View className="flex-row items-center flex-wrap gap-1.5 mt-1">
            <View className="flex-row items-center bg-white px-2.5 py-0.5 rounded-full">
              <Bed size={12} color="#4A706A" />
              <Text className="text-xs font-bold text-primary ml-1">{room}</Text>
            </View>
            {demographics ? (
              <Text className="text-xs text-text-secondary">{demographics}</Text>
            ) : null}
          </View>
        </View>

        <ChevronRight size={18} color="#94A3B8" />
      </View>

      {(resident.isAssigned || resident.hasAllergies || resident.dnacpr) && (
        <View className="flex-row flex-wrap gap-1.5 pt-2.5">
          {resident.isAssigned && (
            <View className="flex-row items-center gap-1 rounded-full bg-clinical-safeBg px-2.5 py-1">
              <UserCheck size={12} color="#059669" />
              <Text className="text-xs font-semibold text-clinical-safe">Assigned to you</Text>
            </View>
          )}
          {resident.hasAllergies && (
            <View className="flex-row items-center gap-1 rounded-full bg-clinical-criticalBg px-2.5 py-1">
              <AlertTriangle size={12} color="#FF3B2F" />
              <Text className="text-xs font-semibold text-clinical-critical">Allergies</Text>
            </View>
          )}
          {resident.dnacpr && (
            <View className="rounded-full bg-purple-50 px-2.5 py-1">
              <Text className="text-xs font-semibold text-purple-700">DNACPR</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
