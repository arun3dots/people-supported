import React from 'react';
import { View } from 'react-native';
import { HeartHandshake } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import type { ResidentDetailData } from '../../presentation/hooks/useResidentDetail';

interface Props {
  resident: ResidentDetailData;
}

function NeedDetail({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-white rounded-xl p-3">
      <Text className="text-xs text-text-muted mb-1">{label}</Text>
      <Text className="text-sm font-medium text-text-primary">{value || 'Not recorded'}</Text>
    </View>
  );
}

export function ResidentCareNeedsCard({ resident }: Props) {
  const careProfile = resident.careProfile;
  const linkedRiskFlag = careProfile?.chronicConditions?.[0];
  const needs = [
    { label: 'Care domain', value: careProfile?.careCategory },
    { label: 'Assessed need', value: careProfile?.primaryDiagnosis },
    { label: 'Support required', value: careProfile?.feedingAssistanceNeed },
    { label: 'Linked risk flag', value: linkedRiskFlag },
  ].filter(
    (need): need is { label: string; value: string } =>
      typeof need.value === 'string' && need.value.trim().length > 0,
  );

  return (
    <Card className="p-4 mb-4">
      <View className="flex-row items-center gap-2.5 mb-3">
        <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
          <HeartHandshake size={18} color="#4A706A" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-text-primary">
            {careProfile?.primaryCareNeed || 'Assessed Care Needs'}
          </Text>
        </View>
      </View>

      {needs.length > 0 ? (
        <View className="flex-row flex-wrap gap-2.5">
          {needs.map((need) => (
            <NeedDetail key={need.label} label={need.label} value={need.value} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-text-secondary">No assessed care needs recorded.</Text>
      )}
    </Card>
  );
}
