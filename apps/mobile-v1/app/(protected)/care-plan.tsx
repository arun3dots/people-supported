import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LIST_NEED_CARE_PLANS, LIST_CARE_TASK_DEFINITIONS } from '@repo/endpoints';
import type { CareTaskDefinitionDTO, NeedCarePlanRecordDTO } from '@repo/schema';
import { makeMobileApiCall } from '../../src/data/api/client';
import { ScreenWrapper, Text, Button } from '../../src/presentation/components/common';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { RecordedSupportPlanCard } from '../../src/components/clinical/RecordedSupportPlanCard';

export default function CarePlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    resident,
    loading,
    error: residentError,
    refetch: refetchResident,
  } = useResidentDetail(id);
  const plans = useQuery({
    queryKey: ['resident-need-care-plans', id],
    queryFn: () =>
      makeMobileApiCall<NeedCarePlanRecordDTO[]>(LIST_NEED_CARE_PLANS, undefined, undefined, {
        id,
      }),
    enabled: Boolean(resident?.id),
  });
  const tasks = useQuery({
    queryKey: ['resident-care-task-definitions', id],
    queryFn: () =>
      makeMobileApiCall<CareTaskDefinitionDTO[]>(LIST_CARE_TASK_DEFINITIONS, undefined, undefined, {
        id,
      }),
    enabled: Boolean(resident?.id),
  });
  const error = residentError || plans.error?.message || tasks.error?.message;
  return (
    <ScreenWrapper scrollable>
      <View className="flex-row items-center justify-between py-3 mb-3">
        <Button
          variant="ghost"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents'))}
        >
          Back
        </Button>
        <Text className="text-lg font-bold text-foreground">Support Plans</Text>
      </View>
      {loading || plans.isLoading || tasks.isLoading ? (
        <View className="items-center py-16">
          <ActivityIndicator size="large" />
          <Text className="text-base text-muted-foreground mt-3">
            Loading recorded support plans...
          </Text>
        </View>
      ) : error ? (
        <View className="bg-surface rounded-2xl p-5 gap-3">
          <Text className="text-base font-bold text-foreground">Unable to load support plans</Text>
          <Text className="text-base text-muted-foreground">{error}</Text>
          <Button
            onPress={() => {
              void refetchResident();
              void plans.refetch();
              void tasks.refetch();
            }}
          >
            Retry
          </Button>
        </View>
      ) : !resident ? (
        <View className="gap-3 p-4">
          <Text className="text-base text-foreground">
            Select a person supported to view their support plans.
          </Text>
          <Button onPress={() => router.navigate('/residents')}>Select person</Button>
        </View>
      ) : (
        <View className="pb-8">
          <ResidentProfileHeaderCard resident={resident} />
          {(plans.data?.length ?? 0) === 0 ? (
            <Text className="text-base text-muted-foreground p-4">No support plans recorded.</Text>
          ) : (
            plans.data?.map((plan) => (
              <RecordedSupportPlanCard key={plan.id} plan={plan} tasks={tasks.data ?? []} />
            ))
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}
