import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENT_CARE_PLAN } from '@repo/endpoints';
import { makeMobileApiCall } from '../../src/data/api/client';
import { ChevronLeft, ChevronDown, ChevronUp, HeartHandshake } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { Card } from '@/components/ui';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { CarePlanGoalCard, type GoalItem } from '../../src/components/clinical/CarePlanGoalCard';
import { ResidentCareNeedsCard } from '../../src/components/clinical/ResidentCareNeedsCard';
import { CarePlanDetailResponse, CarePlanGoalRecord, CarePlanTaskItem } from '../../src/components/clinical/carePlan.types';
import { cn } from '@/lib/utils';

export default function CarePlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resident, loading: residentLoading } = useResidentDetail(id);

  const [activeTab, setActiveTab] = useState<'goals' | 'executions'>('goals');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch real Care Plan from API
  const { data: carePlanData, isLoading: carePlanLoading } = useQuery<CarePlanDetailResponse | null>({
    queryKey: ['resident-care-plan', resident?.id],
    queryFn: async (): Promise<CarePlanDetailResponse | null> => {
      if (!resident?.id) return null;
      try {
        const res = await makeMobileApiCall<CarePlanDetailResponse>(
          GET_RESIDENT_CARE_PLAN,
          undefined,
          undefined,
          { residentId: resident.id }
        );
        return (res as CarePlanDetailResponse) || null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(resident?.id),
    staleTime: 1000 * 60 * 5,
  });

  if (residentLoading && !resident) {
    return (
      <ScreenWrapper key="loading-care-plan" scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Resident Profile</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-24">
          <ActivityIndicator size="large" color="#4A706A" />
          <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading care plan...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!resident) {
    return (
      <ScreenWrapper scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Resident Care Plan</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-20 px-4">
          <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center mb-4">
            <HeartHandshake size={32} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            No Resident Selected
          </Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
            Please select a resident to view their clinical care plan and individual goals.
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate('/residents' as Href)}
            className="mt-5 px-6 py-3 bg-primary rounded-full"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-md">Select Resident</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const goals: GoalItem[] = (carePlanData?.goals || []).map((g: CarePlanGoalRecord) => ({
    id: g.id,
    title: g.title,
    category: g.category || 'General',
    target: g.target || '',
    progressPercentage: g.progressPercentage ?? (g.status === 'Completed' ? 100 : 0),
    progressLabel: `${g.progressPercentage ?? (g.status === 'Completed' ? 100 : 0)}% Complete`,
    reviewFrequency: carePlanData?.reviewSchedule || 'Monthly',
    tasksCount: g.tasks?.length || 0,
  }));

  const executions: CarePlanTaskItem[] = carePlanData?.tasks || [];
  const planTitle = carePlanData?.title || 'Master Care Plan';
  const planStatus = carePlanData?.status || 'Active';
  const planDescription =
    carePlanData?.description ||
    resident.careProfile?.routinePreferences ||
    'Comprehensive individualized care pathway and clinical risk management plan.';
  const reviewSchedule = carePlanData?.reviewSchedule || 'Monthly';
  const department = carePlanData?.department || 'Nursing';

  return (
    <ScreenWrapper key={`care-plan-${resident.id}`} scrollable>
      {/* 1. Header with Centered Title */}
      <View className="flex-row items-center justify-between py-3 mb-1">
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/residents' as Href))}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Resident Profile</Text>
        <View className="w-9" />
      </View>

      {/* 2. Top Profile Card with Nested NEWS2 Score */}
      <ResidentProfileHeaderCard resident={resident} />

      {/* 3. Care Plan Section */}
      <View className="pb-8">
        <Text className="text-lg font-bold text-foreground mb-3">Care Plan</Text>

        {/* Master Care Plan Card */}
        <Card className="p-4 mb-4">
          {/* Header Row */}
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
              <HeartHandshake size={20} color="#0284C7" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-md font-bold text-foreground">{planTitle}</Text>
              <View className="self-start bg-clinical-safeBg px-2.5 py-0.5 rounded-full mt-1">
                <Text className="text-xs font-semibold text-clinical-safe">{planStatus}</Text>
              </View>
            </View>
          </View>

          {/* Description Narrative */}
          <Text
            className="text-xs text-muted-foreground mt-3 leading-relaxed"
            numberOfLines={isDescriptionExpanded ? undefined : 3}
          >
            {planDescription}
          </Text>

          <TouchableOpacity
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 mt-1.5 mb-3"
          >
            <Text className="text-xs font-semibold text-primary">
              {isDescriptionExpanded ? 'Read less' : 'Read more'}
            </Text>
            {isDescriptionExpanded ? (
              <ChevronUp size={14} color="#4A706A" />
            ) : (
              <ChevronDown size={14} color="#4A706A" />
            )}
          </TouchableOpacity>

          {/* 2x2 Meta Grid */}
          <View className="flex-row gap-2.5 mb-2.5">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">Review Schedule</Text>
              <View className="bg-white rounded-xl p-2.5">
                <Text className="text-xs font-semibold text-foreground">{reviewSchedule}</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">Sign-off Action</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                className="border border-primary rounded-xl p-2.5 items-center justify-center bg-white"
              >
                <Text className="text-xs font-semibold text-primary">Sign-off Action</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">Medical Team</Text>
              <View className="bg-white rounded-xl p-2.5">
                <Text className="text-xs font-semibold text-foreground">
                  {resident.gpDetails?.gpName || 'Assigned per shift'}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground mb-1">Departments</Text>
              <View className="bg-white rounded-xl p-2.5 items-start justify-center">
                <Text className="text-xs font-semibold text-primary">{department}</Text>
              </View>
            </View>
          </View>
        </Card>

        <ResidentCareNeedsCard resident={resident} />

        {/* Segmented Control Tabs */}
        <View className="bg-surface rounded-full p-1 flex-row gap-1 mb-3.5">
          <TouchableOpacity
            onPress={() => setActiveTab('goals')}
            activeOpacity={0.8}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-full items-center justify-center',
              activeTab === 'goals' ? 'bg-primary' : 'bg-transparent'
            )}
          >
            <Text className={cn('text-xs font-semibold', activeTab === 'goals' ? 'text-white' : 'text-muted-foreground')}>
              Goals & Interventions ({goals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('executions')}
            activeOpacity={0.8}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-full items-center justify-center',
              activeTab === 'executions' ? 'bg-primary' : 'bg-transparent'
            )}
          >
            <Text className={cn('text-xs font-semibold', activeTab === 'executions' ? 'text-white' : 'text-muted-foreground')}>
              Today&apos;s Executions ({executions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Goals & Interventions */}
        {activeTab === 'goals' ? (
          <View>
            <Card className="p-3.5 mb-3 flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
                <HeartHandshake size={18} color="#4A706A" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">Goals & Interventions</Text>
                <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                  Tie each clinical goal to measurable targets, shift timings, and instructions.
                </Text>
              </View>
            </Card>

            {carePlanLoading && goals.length === 0 ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#4A706A" />
              </View>
            ) : goals.length > 0 ? (
              goals.map((goal) => <CarePlanGoalCard key={goal.id} goal={goal} />)
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center justify-center my-2">
                <Text className="text-md font-semibold text-foreground">No active goals found</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Goals will appear here once defined in the care plan.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Tab 2: Today's Executions */
          <View>
            {executions.length > 0 ? (
              executions.map((task: CarePlanTaskItem) => (
                <Card key={task.id} className="p-3.5 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                      <Text className="text-md font-bold text-foreground flex-1" numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      {task.priority && (
                        <View className="bg-white px-2.5 py-0.5 rounded-full">
                          <Text className="text-xs font-semibold text-primary">{task.priority}</Text>
                        </View>
                      )}
                      {task.category && (
                        <View className="bg-white px-2.5 py-0.5 rounded-full">
                          <Text className="text-xs font-medium text-muted-foreground">{task.category}</Text>
                        </View>
                      )}
                      {task.shiftSlot && (
                        <View className="bg-white px-2.5 py-0.5 rounded-full">
                          <Text className="text-xs font-medium text-muted-foreground">{task.shiftSlot}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {task.instructions && (
                    <Text className="text-xs text-muted-foreground mt-2 leading-4">
                      Instructions: {task.instructions}
                    </Text>
                  )}
                  <View className="mt-3 pt-2.5 border-t border-slate-200/60 flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">Status</Text>
                    <View className="bg-clinical-warningBg px-2.5 py-0.5 rounded-full">
                      <Text className="text-xs font-semibold text-clinical-warning">
                        {task.status || 'Scheduled'}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center justify-center my-2">
                <Text className="text-md font-semibold text-foreground">No executions scheduled today</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Scheduled care plan tasks for this resident will appear here.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
