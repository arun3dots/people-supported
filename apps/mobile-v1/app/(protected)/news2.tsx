import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { ChevronLeft, ChevronDown, Check } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENTS, GET_RESIDENT } from '@repo/endpoints';
import { makeMobileApiCall } from '../../src/data/api/client';
import { ScreenWrapper, Text } from '../../src/presentation/components/common';
import { useSheetBottomPadding } from '../../src/presentation/hooks/useSheetBottomPadding';
import { News2ScoreCard } from '../../src/components/clinical/News2ScoreCard';
import { News2VitalsCard } from '../../src/components/clinical/News2VitalsCard';
import { ResidentFluidIntakeSection } from '../../src/components/clinical/ResidentFluidIntakeSection';
import type { ResidentDetailData } from '../../src/presentation/hooks/useResidentDetail';
import { useNews2Tracker } from '../../src/presentation/hooks/useNews2Tracker';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';
import { ShiftNotStartedCard } from '../../src/components/common/ShiftNotStartedCard';
import { theme } from '../../src/theme';

interface ResidentItem {
  id: string;
  fullName: string;
  roomNumber: string;
}

export default function News2ObservationScreen() {
  const sheetBottomPadding = useSheetBottomPadding(20);
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ id?: string; residentId?: string }>();
  const targetResidentId = searchParams.residentId || searchParams.id;

  const { shift, assignedResidents, isShiftStarted, startShift } = useShiftDashboard();
  const { user } = useAuth();
  const eligibility = useClockInEligibility(shift);
  const userRole = (user?.roleName || '').toLowerCase();
  const isPrivileged = userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin';
  const isAccessAllowed = isPrivileged || isShiftStarted;

  const [selectedResidentIndex, setSelectedResidentIndex] = useState(0);
  const [isResidentPickerOpen, setIsResidentPickerOpen] = useState(false);

  const { data: allResidents = [] } = useQuery<ResidentItem[]>({
    queryKey: ['facility-residents-list'],
    queryFn: async () => {
      const res = await makeMobileApiCall<
        { data?: Array<{ id: string; fullName: string; roomNumber?: string }> } | Array<{ id: string; fullName: string; roomNumber?: string }>
      >(GET_RESIDENTS, undefined, { all: true }).catch(() => []);
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        roomNumber: r.roomNumber ? `Room ${r.roomNumber}` : '',
      }));
    },
    enabled: isAccessAllowed && assignedResidents.length === 0,
    staleTime: 1000 * 60 * 5,
  });

  const baseResidentsList: ResidentItem[] = useMemo(() => {
    if (!isAccessAllowed) return [];
    if (assignedResidents.length > 0) {
      return assignedResidents.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        roomNumber: r.roomNumber.startsWith('Room') ? r.roomNumber : `Room ${r.roomNumber}`,
      }));
    }
    return allResidents;
  }, [isAccessAllowed, assignedResidents, allResidents]);

  // If a specific resident ID is requested via route params but not in the assigned/all list, fetch it directly
  const { data: specificResident } = useQuery<ResidentItem | null>({
    queryKey: ['target-news2-resident', targetResidentId],
    queryFn: async () => {
      if (!targetResidentId) return null;
      const res = await makeMobileApiCall<{
        id: string;
        fullName: string;
        bed?: { room?: { roomNumber?: string } };
      }>(GET_RESIDENT, undefined, undefined, { id: targetResidentId }).catch(() => null);

      if (!res?.id) return null;
      const room = res.bed?.room?.roomNumber ? `Room ${res.bed.room.roomNumber}` : '';
      return {
        id: res.id,
        fullName: res.fullName,
        roomNumber: room,
      };
    },
    enabled: isAccessAllowed && !!targetResidentId && !baseResidentsList.some((r) => r.id === targetResidentId),
  });

  const residentsList = useMemo(() => {
    if (specificResident && !baseResidentsList.some((r) => r.id === specificResident.id)) {
      return [specificResident, ...baseResidentsList];
    }
    return baseResidentsList;
  }, [specificResident, baseResidentsList]);

  // Synchronize selected index when targetResidentId arrives
  useEffect(() => {
    if (targetResidentId && residentsList.length > 0) {
      const idx = residentsList.findIndex((r) => r.id === targetResidentId);
      if (idx !== -1) {
        setSelectedResidentIndex(idx);
      }
    }
  }, [targetResidentId, residentsList]);

  const currentResident = residentsList[selectedResidentIndex] || residentsList[0] || null;

  const {
    vitals,
    news2Result,
    notes,
    isSubmitting,
    updateVital,
    setNotes,
    saveObservation,
  } = useNews2Tracker(currentResident?.id || '');

  const handleSave = async () => {
    if (!currentResident) {
      Alert.alert('No Person Selected', 'Please select a person supported to record observations.');
      return;
    }
    try {
      const res = await saveObservation();
      const offlineNotice = res.queuedOffline
        ? '\n\n(Offline Mode: Observation saved locally and queued for automatic sync once online.)'
        : '';
      Alert.alert(
        'Observation Recorded',
        `NEWS2 score of ${news2Result.totalScore} recorded contemporaneously for ${currentResident?.fullName || 'Person Supported'}.${offlineNotice}`,
        [
          {
            text: 'Return to Profile',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('/' as Href);
              }
            },
          },
        ]
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to record observation. Please verify entered values and retry.';
      Alert.alert('Save Failed', message);
    }
  };

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <View className="pt-2 pb-4">
        <View className="flex-row items-center gap-2 mb-0.5">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-surface items-center justify-center -ml-1"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={20} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Record Observation</Text>
        </View>
        <Text className="text-xs text-muted-foreground ml-10">
          NEWS2 Clinical Assessment · Early Warning Score
        </Text>
      </View>

      {/* Shift Not Started Gate Card */}
      {!isAccessAllowed ? (
        <ShiftNotStartedCard
          title="Shift Not Started"
          description="Point-of-care clinical observations (NEWS2) and vitals are accessible once your shift has started."
          shift={shift}
          eligibility={eligibility}
          onStartShift={startShift}
          onReturnHome={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
        />
      ) : (
        <>
          {/* No Residents Banner if empty */}
          {residentsList.length === 0 && (
            <View className="bg-clinical-warningBg rounded-2xl p-3.5 mb-4">
              <Text className="text-xs font-semibold text-clinical-warning">
                No people supported found. Please select a person supported from the directory or refresh.
              </Text>
            </View>
          )}

          {/* Resident Selector */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-1.5">
              Person Supported <Text className="text-clinical-critical font-bold">*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsResidentPickerOpen(true)}
              className="h-12 px-4 rounded-xl bg-surface flex-row items-center justify-between"
            >
              <Text className="text-md font-medium text-foreground">
                {currentResident
                  ? `${currentResident.fullName}${currentResident.roomNumber ? ` (${currentResident.roomNumber})` : ''}`
                  : 'Select Person'}
              </Text>
              <ChevronDown size={18} color="#5D5D5D" />
            </TouchableOpacity>
          </View>

          {/* Real-time NEWS2 Result Card */}
          <View className="mb-4">
            <News2ScoreCard result={news2Result} residentName={currentResident?.fullName || 'Person Supported'} />
          </View>

          {/* Physiological Parameters Form */}
          <News2VitalsCard vitals={vitals} updateVital={updateVital} />

          {/* Contemporaneous Clinical Notes */}
          <View className="bg-surface rounded-2xl p-4 mb-5">
            <Text className="text-lg font-bold text-foreground mb-2">
              Contemporaneous Clinical Notes
            </Text>
            <Text className="text-xs font-medium text-muted-foreground mb-2">
              Clinical Observations & Escalation Summary
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Document presentation, complaints of pain, or GP escalation..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ fontFamily: theme.fonts.regular }}
              className="min-h-[88px] p-3.5 rounded-xl bg-white text-md text-foreground leading-5"
            />
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={handleSave}
            className="w-full h-14 rounded-xl bg-primary flex-row items-center justify-center gap-2 mb-6"
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2.4} />
            <Text className="text-md font-bold text-white">
              {isSubmitting ? 'Recording...' : 'Record Contemporaneous Observation'}
            </Text>
          </TouchableOpacity>

          {/* Fluid & Nutrition Monitoring Section at Bottom of Observation Screen */}
          {currentResident && (
            <View className="mb-8">
              <ResidentFluidIntakeSection
                resident={
                  {
                    id: currentResident.id,
                    fullName: currentResident.fullName,
                    status: 'Active',
                  } as unknown as ResidentDetailData
                }
              />
            </View>
          )}

          {/* Resident Picker Modal */}
          <Modal
            visible={isResidentPickerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsResidentPickerOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsResidentPickerOpen(false)}
              className="flex-1 bg-black/50 justify-end"
            >
              <View
                className="bg-white rounded-t-3xl px-5 pt-5 max-h-[60%]"
                style={{ paddingBottom: sheetBottomPadding }}
              >
                <Text className="text-lg font-bold text-foreground mb-3">Select Person Supported</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {residentsList.map((r, i) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        setSelectedResidentIndex(i);
                        setIsResidentPickerOpen(false);
                      }}
                      className="py-3.5 px-2 border-b border-slate-100 flex-row items-center justify-between"
                    >
                      <Text className="text-md font-semibold text-foreground">
                        {r.fullName} {r.roomNumber ? `(${r.roomNumber})` : ''}
                      </Text>
                      {selectedResidentIndex === i && <Check size={18} color="#4A706A" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
    </ScreenWrapper>
  );
}
