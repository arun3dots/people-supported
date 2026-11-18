import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FileText, Calendar } from 'lucide-react-native';
import { Text } from '../ui/text';
import type { ResidentDocumentItem } from './residentDocuments.types';
import { supportPlanLabel } from '../../lib/supportPlanLabel';

interface Props {
  item: ResidentDocumentItem;
  onViewPress: () => void;
}

export function ResidentDocumentCard({ item, onViewPress }: Props) {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      {/* Top Part: PDF Icon + Title with Asterisk & Subtitle */}
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-white items-center justify-center mt-0.5">
          <FileText size={17} color="#FF3B2F" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-md font-bold text-foreground">{item.title}</Text>
            {item.isRequired && <Text className="text-md font-bold text-clinical-critical ml-0.5">*</Text>}
          </View>
          <Text className="text-xs text-muted-foreground mt-0.5 leading-4" numberOfLines={2}>
            {supportPlanLabel(item.subtitle)}
          </Text>
        </View>
      </View>

      {/* Bottom Part: Date + View Pill Button */}
      <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-200/70">
        <View className="flex-row items-center gap-1.5">
          <Calendar size={13} color="#5D5D5D" />
          <Text className="text-xs font-medium text-muted-foreground">{item.dateStr}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewPress}
          className="px-4 py-1.5 rounded-full bg-white items-center justify-center"
          accessibilityLabel={`View document ${item.title}`}
        >
          <Text className="text-xs font-bold text-primary">View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
