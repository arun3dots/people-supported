import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronLeft, Pill } from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { useResidentDetail } from '../../src/presentation/hooks/useResidentDetail';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';
import { ShiftNotStartedCard } from '../../src/components/common/ShiftNotStartedCard';
import { ResidentProfileHeaderCard } from '../../src/components/clinical/ResidentProfileHeaderCard';
import { ResidentMarSections } from '../../src/components/clinical/ResidentMarSections';

export default function MarScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { shift, isShiftStarted, startShift } = useShiftDashboard();
  const { user } = useAuth();
  const eligibility = useClockInEligibility(shift);
  const userRole = (user?.roleName || '').toLowerCase();
  const isPrivileged = userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin';
  const isAccessAllowed = isPrivileged || isShiftStarted;

  const { resident, loading } = useResidentDetail(id, isAccessAllowed);

  if (!isAccessAllowed) {
    return (
      <ScreenWrapper scrollable>
        <View className="flex-row items-center justify-between py-3 mb-1">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">eMAR Medication</Text>
          <View className="w-9" />
        </View>

        <ShiftNotStartedCard
          title="Shift Not Started"
          description="Medication Administration Records (eMAR) and dosage logging are accessible once your shift has started."
          shift={shift}
          eligibility={eligibility}
          onStartShift={startShift}
          onReturnHome={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
        />
      </ScreenWrapper>
    );
  }

  if (loading && !resident) {
    return (
      <ScreenWrapper key="loading-mar" scrollable>
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
          <Text className="text-xs text-muted-foreground mt-3 font-medium">Loading MAR records...</Text>
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
          <Text className="text-lg font-bold text-foreground">eMAR Medication</Text>
          <View className="w-9" />
        </View>
        <View className="items-center justify-center py-20 px-4">
          <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center mb-4">
            <Pill size={32} color="#4A706A" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            No Resident Selected
          </Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center max-w-[260px]">
            Please select a resident to view their medication schedule and administer doses.
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

  const allergies =
    resident.careProfile?.medicationAllergies?.length
      ? resident.careProfile.medicationAllergies
      : resident.careProfile?.allergies || [];

  return (
    <ScreenWrapper key={`mar-${resident.id}`} scrollable>
      {/* 1. Top Header with Centered Title & Back Chevron */}
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

      {/* 2. Resident Profile Header Card with NEWS2 Score */}
      <ResidentProfileHeaderCard resident={resident} />

      {/* 3. Medication Administration Record Sections */}
      <ResidentMarSections residentId={resident.id} allergies={allergies} />
    </ScreenWrapper>
  );
}
