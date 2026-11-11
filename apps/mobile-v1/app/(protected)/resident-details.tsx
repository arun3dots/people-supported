import React, { useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  ChevronLeft,
  Activity,
  Users,
  Pill,
  History,
  Upload,
  FileText,
  Accessibility,
  ShieldAlert,
  FileEdit,
} from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { ResidentDetailSections } from '../../src/components/clinical/ResidentDetailSections';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';

export default function ResidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    resident,
    timeline,
    loading,
    activityError,
    refetch,
  } = useResidentDetail(id);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (loading && !resident) {
    return (
      <ScreenWrapper key="loading-screen" scrollable withTopInset>
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
        <View key="loading-spinner" className="items-center justify-center py-24">
          <ActivityIndicator size="large" color="#4A706A" />
          <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading resident profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!resident) {
    return null;
  }

  return (
    <ScreenWrapper key={`resident-profile-${resident.id}`} scrollable withTopInset>
      {/* 1. Header with Centered Title */}
      <View className="flex-row items-center justify-between py-3 mb-2">
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

      {/* 3. Quick Actions Grid (Uniform 3x3 Grid) */}
      <View className="mb-5">
        <Text className="text-lg font-bold text-foreground mb-3">Quick Actions</Text>

        {/* Row 1 */}
        <View className="flex-row gap-2.5 mb-2.5">
          {/* Action 1: Observation */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/news2', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Activity size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Observation</Text>
          </TouchableOpacity>

          {/* Action 2: Care Plan */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/care-plan', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Users size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Care Plan</Text>
          </TouchableOpacity>

          {/* Action 3: MAR */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/mar', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Pill size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">MAR</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View className="flex-row gap-2.5 mb-2.5">
          {/* Action 4: Body Map */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/body-map', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Accessibility size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Body Map</Text>
          </TouchableOpacity>

          {/* Action 5: Task History */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/task-history', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <History size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Task History</Text>
          </TouchableOpacity>

          {/* Action 6: Documents */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/documents', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Upload size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View className="flex-row gap-2.5">
          {/* Action 7: Risk Assessment */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/risk-assessment', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <ShieldAlert size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Risk Assessment</Text>
          </TouchableOpacity>

          {/* Action 8: My Care Notes */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/care-notes', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <FileEdit size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">My Care Notes</Text>
          </TouchableOpacity>

          {/* Action 9: Accident / Incident Notes */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate('/report-incident' as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <FileText size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center" numberOfLines={2}>
              Report Incident
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Lower Clinical Details Sections */}
      <ResidentDetailSections
        resident={resident}
        timeline={timeline}
        activityError={activityError}
        onRetryActivities={() => void refetch()}
      />
    </ScreenWrapper>
  );
}
