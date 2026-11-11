import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Pill, Activity, Droplets, Calendar, MoreVertical, Clock } from 'lucide-react-native';
import { Text } from '../ui/text';
import type { ResidentTaskHistoryItem } from './residentTaskHistory.types';

interface Props {
  item: ResidentTaskHistoryItem;
  onMorePress?: () => void;
}

export function ResidentTaskHistoryCard({ item, onMorePress }: Props) {
  const isCompleted = item.status === 'Completed';
  const isOverdue = item.status === 'Over Due';

  return (
    <View className="bg-surface rounded-2xl p-4 mb-2.5">
      {/* Top Row: Icon + Title & Subtitle + More button */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            {item.taskType === 'medication' ? (
              <Pill size={16} color="#059669" />
            ) : item.taskType === 'observation' ? (
              <Activity size={16} color="#0284C7" />
            ) : item.taskType === 'fluid' ? (
              <Droplets size={16} color="#0D9488" />
            ) : (
              <Clock size={16} color="#64748B" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-text-primary">
              {item.title}
            </Text>
            <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>
        </View>

        {onMorePress ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onMorePress}
            className="w-7 h-7 items-center justify-center -mr-1"
            accessibilityLabel="More options"
          >
            <MoreVertical size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bottom Metadata & Status Row */}
      <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-200/70">
        <View className="flex-col gap-1.5 flex-1 mr-2">
          {/* Date */}
          <View className="flex-row items-center gap-1.5">
            <Calendar size={13} color="#64748B" />
            <Text className="text-xs font-medium text-text-primary">{item.dateStr}</Text>
          </View>

          {/* Assigned Staff */}
          <View className="flex-row items-center gap-1.5">
            {item.assignedStaffAvatar ? (
              <Image
                source={{ uri: item.assignedStaffAvatar }}
                className="w-5 h-5 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                <Text className="text-xs font-bold text-primary">
                  {item.assignedStaffName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text className="text-xs font-medium text-text-secondary">{item.assignedStaffName}</Text>
          </View>
        </View>

        {/* Status Pill Badge */}
        <View
          className={`px-3 py-1 rounded-full ${
            isCompleted
              ? 'bg-clinical-safeBg'
              : isOverdue
                ? 'bg-clinical-criticalBg'
                : 'bg-clinical-warningBg'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isCompleted
                ? 'text-clinical-safe'
                : isOverdue
                  ? 'text-clinical-critical'
                  : 'text-clinical-warning'
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );
}
