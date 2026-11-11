import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Checkbox } from '../../presentation/components/common';
import { News2Input } from '../../domain/clinical/news2';

interface News2ClinicalActionsProps {
  vitals: News2Input;
  updateVital: <K extends keyof News2Input>(field: K, value: News2Input[K]) => void;
}

export function News2ClinicalActions({ vitals, updateVital }: News2ClinicalActionsProps) {
  return (
    <View className="mt-2 pt-3 border-t border-slate-100">
      <Text className="text-sm font-bold text-text-primary mb-2.5">
        Clinical Actions & Escalation
      </Text>
      <View className="gap-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => updateVital('isAbnormal', !vitals.isAbnormal)}
          className="flex-row items-center p-3 rounded-xl bg-white"
        >
          <Checkbox
            checked={!!vitals.isAbnormal}
            onCheckedChange={(val) => updateVital('isAbnormal', !!val)}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-text-primary">Mark as Abnormal</Text>
            <Text className="text-xs text-text-secondary">Flag this observation as clinically abnormal</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => updateVital('notifyGP', !vitals.notifyGP)}
          className="flex-row items-center p-3 rounded-xl bg-white"
        >
          <Checkbox
            checked={!!vitals.notifyGP}
            onCheckedChange={(val) => updateVital('notifyGP', !!val)}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-text-primary">Notify GP</Text>
            <Text className="text-xs text-text-secondary">Escalate finding to resident&apos;s General Practitioner</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => updateVital('increaseMonitoring', !vitals.increaseMonitoring)}
          className="flex-row items-center p-3 rounded-xl bg-white"
        >
          <Checkbox
            checked={!!vitals.increaseMonitoring}
            onCheckedChange={(val) => updateVital('increaseMonitoring', !!val)}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-text-primary">Increase Monitoring</Text>
            <Text className="text-xs text-text-secondary">Step up observation frequency (e.g. 4-6 hourly)</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

