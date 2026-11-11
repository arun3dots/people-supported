import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Clock, Pill, ShieldAlert } from 'lucide-react-native';
import { Text } from '../ui/text';
import type {
  ScheduledMedication,
  PrnMedication,
  RecentMedicationAdmin,
} from './residentMar.types';

export function ResidentScheduledMedCard({
  item,
  onAction,
}: {
  item: ScheduledMedication;
  onAction: (item: ScheduledMedication) => void;
}) {
  return (
    <View className="bg-white rounded-xl p-3.5 mb-2.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2 flex-wrap">
          <Text className="text-sm font-bold text-text-primary">{item.drugName}</Text>
          <View
            className={`px-2.5 py-0.5 rounded-full ${
              item.status === 'Due'
                ? 'bg-clinical-safeBg'
                : item.status === 'Administered'
                  ? 'bg-teal-50'
                  : 'bg-clinical-criticalBg'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                item.status === 'Due'
                  ? 'text-clinical-safe'
                  : item.status === 'Administered'
                    ? 'text-teal-700'
                    : 'text-clinical-critical'
              }`}
            >
              {item.status}
            </Text>
          </View>
          {item.isControlledDrug && (
            <View className="bg-clinical-warningBg px-2 py-0.5 rounded-full flex-row items-center gap-1">
              <ShieldAlert size={11} color="#D97706" />
              <Text className="text-xs font-bold text-clinical-warning">CD</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAction(item)}
          className="bg-surface rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
        >
          <Clock size={12} color="#4A706A" />
          <Text className="text-xs font-semibold text-primary">{item.scheduledTime}</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xs text-text-secondary mb-2.5">
        {item.dose} | {item.route} | {item.frequency}
      </Text>

      <View className="flex-row border-t border-slate-100 pt-2">
        <View className="flex-1 pr-1">
          <Text className="text-xs text-text-muted">Prescribed by</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5" numberOfLines={1}>
            {item.prescribedBy}
          </Text>
        </View>
        <View className="flex-1 px-1">
          <Text className="text-xs text-text-muted">Start Date</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5" numberOfLines={1}>
            {item.startDate}
          </Text>
        </View>
        <View className="flex-1 pl-1">
          <Text className="text-xs text-text-muted">Notes</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5" numberOfLines={1}>
            {item.notes}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ResidentPrnMedCard({
  item,
  onAction,
}: {
  item: PrnMedication;
  onAction?: (item: PrnMedication) => void;
}) {
  return (
    <View className="bg-white rounded-xl p-3.5 mb-2.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2 flex-wrap">
          <Text className="text-sm font-bold text-text-primary">{item.drugName}</Text>
          <View className="bg-sky-50 px-2.5 py-0.5 rounded-full">
            <Text className="text-xs font-semibold text-sky-700">PRN</Text>
          </View>
          {item.isControlledDrug && (
            <View className="bg-clinical-warningBg px-2 py-0.5 rounded-full flex-row items-center gap-1">
              <ShieldAlert size={11} color="#D97706" />
              <Text className="text-xs font-bold text-clinical-warning">CD</Text>
            </View>
          )}
        </View>

        {onAction && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onAction(item)}
            className="bg-primary rounded-full px-3 py-1.5 flex-row items-center gap-1"
          >
            <Pill size={12} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Administer</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-xs text-text-secondary mb-2.5">
        {item.dose} | {item.route} | As Needed
      </Text>

      <View className="flex-row border-t border-slate-100 pt-2">
        <View className="flex-1 pr-2">
          <Text className="text-xs text-text-muted">Indication</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5">{item.indication}</Text>
        </View>
        <View className="flex-1 pl-2">
          <Text className="text-xs text-text-muted">Max Dose</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5">{item.maxDose}</Text>
        </View>
      </View>
    </View>
  );
}

export function ResidentRecentMedCard({ item }: { item: RecentMedicationAdmin }) {
  return (
    <View className="bg-white rounded-xl p-3.5 mb-2.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <Text className="text-sm font-bold text-text-primary">{item.drugName}</Text>
          <View className="bg-clinical-safeBg px-2.5 py-0.5 rounded-full">
            <Text className="text-xs font-semibold text-clinical-safe">Administered</Text>
          </View>
        </View>
        <View className="bg-surface rounded-full px-2.5 py-1 flex-row items-center gap-1.5">
          <Clock size={12} color="#64748B" />
          <Text className="text-xs font-semibold text-text-primary">{item.time}</Text>
        </View>
      </View>

      <Text className="text-xs text-text-secondary mb-2.5">
        {item.dateStr} | {item.time} | {item.dose} | {item.route}
      </Text>

      <View className="flex-row border-t border-slate-100 pt-2">
        <View className="flex-1">
          <Text className="text-xs text-text-muted">Administered by</Text>
          <Text className="text-xs font-medium text-text-primary mt-0.5">{item.administeredBy}</Text>
        </View>
      </View>
    </View>
  );
}
