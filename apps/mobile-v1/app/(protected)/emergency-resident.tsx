import React, { useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, type Href } from 'expo-router';
import {
  ChevronLeft,
  ShieldAlert,
  Activity,
  Users,
  Pill,
  History,
  Upload,
  FileText,
  Accessibility,
  FileEdit,
} from 'lucide-react-native';
import { Button, ScreenWrapper, Text } from '../../src/presentation/components/common';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { useEmergencyResidentSummary } from '../../src/presentation/hooks/useEmergencyDirectory';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { ResidentDetailSections } from '../../src/components/clinical/ResidentDetailSections';

export default function EmergencyResidentScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  // Audit emergency access per NHS DSPT & CQC regulations
  useEmergencyResidentSummary(id);

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

  const goBack = () =>
    router.canGoBack() ? router.back() : router.navigate('/emergency-directory' as Href);

  if (loading && !resident) {
    return (
      <ScreenWrapper scrollable withTopInset>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Resident Profile</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-24">
          <ActivityIndicator size="large" color="#4A706A" />
          <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading resident profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!resident) {
    return (
      <ScreenWrapper scrollable withTopInset>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Resident Profile</Text>
          <View className="w-9" />
        </View>
        <View className="items-center py-16 px-4">
          <Text className="text-base font-bold text-foreground text-center mb-1">
            Could not open resident profile
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            Unable to locate resident record. Please try again.
          </Text>
          <Button variant="outline" onPress={() => void refetch()}>
            Retry
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable withTopInset>
      {/* 1. Header with Back Button */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Resident Profile</Text>
        <View className="w-9" />
      </View>

      {/* Emergency Audit Notice Banner */}
      <View className="flex-row items-center gap-2 rounded-2xl bg-clinical-warningBg p-3.5 mb-3 border border-clinical-warningBorder">
        <ShieldAlert size={18} color="#C38C0B" />
        <Text className="text-xs font-bold text-clinical-warning flex-1">
          Emergency Access Mode • Viewed under emergency protocol (Logged)
        </Text>
      </View>

      {/* 2. Top Profile Card with Real-time NEWS2 Score */}
      <ResidentProfileHeaderCard resident={resident} />

      {/* 3. Quick Actions Grid (Uniform 3x3 Grid) */}
      <View className="mb-5">
        <Text className="text-lg font-bold text-foreground mb-3">Quick Actions</Text>

        {/* Row 1 */}
        <View className="flex-row gap-2.5 mb-2.5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/news2', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Activity size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Observation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/care-plan', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Users size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Care Plan</Text>
          </TouchableOpacity>

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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/body-map', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <Accessibility size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Body Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/task-history', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <History size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Task History</Text>
          </TouchableOpacity>

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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/risk-assessment', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <ShieldAlert size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">Risk Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate({ pathname: '/care-notes', params: { id: resident.id } } as Href)}
            className="flex-1 h-20 bg-surface rounded-2xl items-center justify-center p-2"
          >
            <FileEdit size={22} color="#4A706A" strokeWidth={2} />
            <Text className="text-xs font-semibold text-foreground mt-1.5 text-center">My Care Notes</Text>
          </TouchableOpacity>

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
