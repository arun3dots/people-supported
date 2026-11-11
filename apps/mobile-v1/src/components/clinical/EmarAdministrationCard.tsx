import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ShieldAlert, Clock, Check, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Text } from '../ui/text';
import { MedicationRoundItem } from '../../domain/entities/MedicationRound';

export interface EmarAdministrationCardProps {
  item: MedicationRoundItem;
  hasAllergyWarning?: boolean;
  onAdminister: (item: MedicationRoundItem) => void;
  onRefuse: (item: MedicationRoundItem) => void;
  onOmit: (item: MedicationRoundItem) => void;
  className?: string;
}

export function EmarAdministrationCard({
  item,
  hasAllergyWarning = false,
  onAdminister,
  onRefuse,
  onOmit,
  className,
}: EmarAdministrationCardProps) {
  const isGiven = item.status === 'Given';
  const isRefused = item.status === 'Refused';
  const isOmitted = item.status === 'Omitted';
  const isActioned = isGiven || isRefused || isOmitted;

  return (
    <View
      className={`bg-white rounded-md p-4 sm:p-5 border mb-3.5 ${
        hasAllergyWarning ? 'border-red-300 bg-red-50/20' : 'border-slate-100'
      } ${className || ''}`}
    >
      {/* Top Meta Row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5 bg-[#F4F8F7] px-2.5 py-1 rounded-full border border-[#4A706A]/20">
            <Clock size={13} color="#4A706A" />
            <Text className="text-xs font-bold text-[#4A706A]">{item.scheduledTime}</Text>
          </View>
          <Text className="text-xs font-medium text-slate-500">Room {item.roomNumber}</Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {item.isControlledDrug && (
            <View className="flex-row items-center gap-1 bg-[#FEF3F2] px-2.5 py-1 rounded-full border border-[#FECDCA]">
              <ShieldAlert size={12} color="#D92D20" />
              <Text className="text-[10px] font-bold text-[#D92D20]">Controlled Drug</Text>
            </View>
          )}

          <View
            className={`px-2.5 py-1 rounded-full border ${
              isGiven
                ? 'bg-[#F1FCF3] border-[#1D5E2E]/30'
                : isRefused
                ? 'bg-[#FEF3F2] border-[#FECDCA]'
                : isOmitted
                ? 'bg-[#FDFBE9] border-[#C38C0B]/30'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isGiven
                  ? 'text-[#1D5E2E]'
                  : isRefused
                  ? 'text-[#D92D20]'
                  : isOmitted
                  ? 'text-[#C38C0B]'
                  : 'text-slate-600'
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Medication & Dose Info */}
      <View className="mb-2">
        <View className="flex-row flex-wrap items-baseline gap-2">
          <Text className="text-base sm:text-lg font-bold text-[#141F1E]">
            {item.drugName}
          </Text>
          <Text className="text-sm font-bold text-[#4A706A]">{item.dose}</Text>
        </View>
        <Text className="text-xs text-slate-500 mt-0.5">
          Resident: <Text className="font-semibold text-slate-800">{item.residentName}</Text> • Route:{' '}
          <Text className="font-medium text-slate-700">{item.route}</Text> ({item.form})
        </Text>
      </View>

      {/* Instructions */}
      {item.instructions && (
        <View className="rounded-md bg-slate-50 p-3 border border-slate-100 mb-2.5">
          <Text className="text-xs text-slate-600 leading-relaxed">
            <Text className="font-bold text-slate-700">Instructions: </Text>
            {item.instructions}
          </Text>
        </View>
      )}

      {/* Allergy Warning */}
      {hasAllergyWarning && (
        <View className="rounded-md bg-[#FFF2F1] p-3 border border-[#FF3B2F]/30 mb-2.5 flex-row items-center gap-2">
          <AlertCircle size={16} color="#FF3B2F" />
          <Text className="text-xs font-bold text-[#FF3B2F] flex-1 leading-tight">
            ALLERGY WARNING: Check resident allergies before administration!
          </Text>
        </View>
      )}

      {/* Action Footer */}
      {!isActioned ? (
        <View className="flex-row gap-2 pt-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onAdminister(item)}
            className="flex-1 h-12 rounded-md bg-[#4A706A] flex-row items-center justify-center gap-1.5"
          >
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-xs font-bold text-white tracking-wide">Administer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onRefuse(item)}
            className="h-12 px-4 rounded-md border border-slate-200 bg-white items-center justify-center"
          >
            <Text className="text-xs font-semibold text-slate-700">Refused</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onOmit(item)}
            className="h-12 px-3.5 rounded-md border border-slate-200 bg-white items-center justify-center"
          >
            <Text className="text-xs font-semibold text-slate-500">Omit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="rounded-md bg-[#F4F8F7] p-3 border border-[#4A706A]/20 flex-row items-center gap-2 mt-1">
          <CheckCircle2 size={16} color="#4A706A" />
          <Text className="text-xs text-[#141F1E] font-medium flex-1">
            Signed by <Text className="font-bold">{item.administeredByStaffName || 'Staff'}</Text> at{' '}
            {item.administeredAt || 'today'}
            {item.witnessStaffName && ` • Witness: ${item.witnessStaffName}`}
          </Text>
        </View>
      )}
    </View>
  );
}
