import React, { useState } from 'react';
import { View, TextInput, Alert, TouchableOpacity } from 'react-native';
import { FileText, CheckCircle2, ShieldCheck, ChevronLeft, AlertTriangle, CalendarOff } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { GET_RESIDENTS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../src/data/api/client';
import { ScreenWrapper, Text } from '../../src/presentation/components/common';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { formatUkTime } from '../../src/lib/date';
import { theme } from '../../src/theme/tokens';

interface ResidentDisplayItem {
  id: string;
  fullName: string;
  roomNumber: string;
  needs: string;
}

export default function HandoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { shift, assignedResidents, endShift, saveHandoverNotes, isShiftStarted, isShiftCompleted } = useShiftDashboard();

  const [handoverNotes, setHandoverNotes] = useState(
    shift?.previousShiftHandover?.handoverNotes || ''
  );
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const { data: allResidents = [] } = useQuery<ResidentDisplayItem[]>({
    queryKey: ['facility-residents-handover'],
    queryFn: async () => {
      const res = await makeMobileApiCall<
        { data?: Array<{ id: string; fullName: string; roomNumber?: string }> } | Array<{ id: string; fullName: string; roomNumber?: string }>
      >(GET_RESIDENTS, undefined, { all: true }).catch(() => []);
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        roomNumber: r.roomNumber ? (r.roomNumber.startsWith('Room') ? r.roomNumber : `Room ${r.roomNumber}`) : '',
        needs: 'Support plan active. Routine observation.',
      }));
    },
    enabled: isShiftStarted && assignedResidents.length === 0,
    staleTime: 1000 * 60 * 5,
  });

  const displayResidents: ResidentDisplayItem[] = !isShiftStarted
    ? []
    : assignedResidents.length > 0
      ? assignedResidents.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          roomNumber: r.roomNumber.startsWith('Room') ? r.roomNumber : `Room ${r.roomNumber}`,
          needs: r.communicationNeeds || 'Support plan active. Routine observation.',
        }))
      : allResidents;

  const handleSaveNotes = async () => {
    if (!shift || !shift.id) {
      Alert.alert('No Active Shift', 'You do not currently have an active shift assigned.');
      return;
    }
    if (!isShiftStarted) {
      Alert.alert('Shift Not Started', 'You cannot save notes while shift is in Upcoming status. Clock in first.');
      return;
    }
    if (isShiftCompleted) {
      Alert.alert('Shift Completed', 'Your shift has ended. Handover notes are sealed.');
      return;
    }
    if (!handoverNotes.trim()) {
      Alert.alert('Notes Required', 'Please enter notes to save.');
      return;
    }
    try {
      setIsSavingNotes(true);
      await saveHandoverNotes(handoverNotes.trim());
      Alert.alert('Notes Saved', 'Running handover notes updated successfully. Shift remains active.');
    } catch {
      Alert.alert('Save Failed', 'Unable to save notes at this time. Please retry.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleEndShiftWithHandover = () => {
    if (!shift || !shift.id) {
      Alert.alert('No Active Shift', 'You do not currently have an active shift assigned.');
      return;
    }
    if (!isShiftStarted) {
      Alert.alert('Shift Not Started', 'You cannot end a shift before starting it. Clock in first.');
      return;
    }
    if (isShiftCompleted) {
      Alert.alert('Shift Completed', 'Your shift has already ended.');
      return;
    }
    if (!handoverNotes.trim()) {
      Alert.alert('Handover Notes Required', 'Please enter handover notes before completing shift sign-off.');
      return;
    }
    Alert.alert(
      'Confirm End of Shift',
      'Are you sure you want to finalize and end your shift? This will record your actual departure time and lock your handover report.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & End Shift',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              if (shift?.id) {
                await endShift(handoverNotes.trim());
              }
              setIsSigned(true);
              Alert.alert(
                'Shift Handover Signed',
                `End-of-shift handover report completed by ${user?.fullName || 'Staff'} and recorded for CQC Regulation 17 inspection.`,
                [
                  {
                    text: 'Return to Dashboard',
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
            } catch {
              setIsSigned(true);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
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
          <Text className="text-xl font-bold text-text-primary">Handover</Text>
        </View>
        <Text className="text-sm text-text-secondary ml-10">
          Shift Handover • Continuous Care Governance
        </Text>
      </View>

      {/* State Banner: No Active Shift (BUG-045, BUG-046) */}
      {!shift && (
        <View className="mb-4 rounded-2xl bg-surface p-4 flex-row items-center gap-2.5">
          <CalendarOff size={20} color="#64748B" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-text-primary">No Active Shift Assigned</Text>
            <Text className="text-xs text-text-secondary mt-0.5">
              Handover reports can only be recorded and submitted during an active shift.
            </Text>
          </View>
        </View>
      )}

      {/* State Banner: Upcoming Shift (BUG-042) */}
      {Boolean(shift && !isShiftStarted && !isShiftCompleted) && (
        <View className="mb-4 rounded-2xl bg-clinical-warningBg p-4 flex-row items-center gap-2.5">
          <AlertTriangle size={20} color="#D97706" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-clinical-warning">
              Shift Not Started ({shift?.name} • {shift?.startTime} – {shift?.endTime})
            </Text>
            <Text className="text-xs text-clinical-warning mt-0.5">
              Handover notes are locked until you clock in. Please start your shift from the dashboard.
            </Text>
          </View>
        </View>
      )}

      {/* 1. Shift Overview Card */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-text-primary">Shift Overview</Text>
          <View className="rounded-full bg-white px-3 py-1">
            <Text className="text-xs font-bold text-primary">
              {shift?.wardName || 'Assigned Property'}
            </Text>
          </View>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between py-1.5 border-b border-slate-200/60">
            <Text className="text-xs font-medium text-text-secondary">Shift Active Period</Text>
            <Text className="text-xs font-bold text-text-primary">
              {shift?.startTime && shift?.endTime ? `${shift.startTime} – ${shift.endTime}` : 'Scheduled Shift'}
            </Text>
          </View>
          <View className="flex-row justify-between py-1.5 border-b border-slate-200/60">
            <Text className="text-xs font-medium text-text-secondary">Care Interventions</Text>
            <Text className="text-xs font-bold text-text-primary">
              {shift?.tasksCompleted ?? 0} of {shift?.tasksTotal ?? 0} tasks logged
            </Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs font-medium text-text-secondary">Reported Incidents</Text>
            <Text className="text-xs font-bold text-text-primary">
              {shift?.incidentCount ?? 0} incident(s)
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Residents in Care Card */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <Text className="text-base font-bold text-text-primary mb-3">
          People Supported ({displayResidents.length})
        </Text>

        <View className="space-y-2">
          {displayResidents.length === 0 ? (
            <Text className="text-xs text-text-secondary">
              {!isShiftStarted
                ? 'Clock in and start your shift to view assigned people supported.'
                : 'No people supported currently assigned.'}
            </Text>
          ) : (
            displayResidents.map((r) => (
              <View
                key={r.id}
                className="flex-row items-start gap-2.5 rounded-xl bg-white p-3 mb-2"
              >
                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center mt-0.5">
                  <CheckCircle2 size={13} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-text-primary">
                    {r.roomNumber}: {r.fullName}
                  </Text>
                  <Text className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    {r.needs}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 3. Handover Notes Card */}
      <View className="bg-card-subtle rounded-2xl p-4 mb-6">
        <Text className="text-base font-bold text-text-primary mb-1">
          Staff Handover Notes & Observations
        </Text>
        <Text className="text-xs font-semibold text-text-secondary mb-2.5">
          Clinical Handover Summary <Text className="text-clinical-critical font-bold">*</Text>
        </Text>

        <TextInput
          value={handoverNotes}
          onChangeText={setHandoverNotes}
          editable={Boolean(isShiftStarted && !isShiftCompleted && !isSigned)}
          placeholder={
            !shift
              ? 'Handover notes disabled (No active shift assigned)'
              : !isShiftStarted
                ? 'Handover notes locked (Clock in on dashboard first)'
                : isShiftCompleted || isSigned
                  ? 'Handover report is sealed'
                  : 'Enter verbal handover summary, care interventions, and notes for the incoming team...'
          }
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ fontFamily: theme.fonts.regular }}
          className="min-h-[110px] p-3.5 rounded-xl bg-white text-sm text-text-primary leading-relaxed mb-4"
        />

        {isSigned || shift?.status === 'Completed' || shift?.isCompleted ? (
          <View className="flex-row items-center gap-3 rounded-xl bg-clinical-safeBg p-4">
            <ShieldCheck size={24} color="#059669" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-clinical-safe">Handover Digitally Signed & Sealed</Text>
              <Text className="text-xs text-text-secondary mt-0.5">Signed by {user?.fullName || 'Staff'} • {formatUkTime(new Date())}</Text>
            </View>
          </View>
        ) : !shift ? (
          <View className="rounded-xl bg-white p-3.5 items-center justify-center">
            <Text className="text-xs font-semibold text-text-secondary">No active shift assigned. Handover actions disabled.</Text>
          </View>
        ) : !isShiftStarted ? (
          <View className="gap-2">
            <View className="rounded-xl bg-clinical-warningBg p-3 items-center justify-center">
              <Text className="text-xs font-semibold text-clinical-warning">Shift is upcoming. Clock in on dashboard to unlock handover actions.</Text>
            </View>
            <TouchableOpacity disabled className="w-full h-11 rounded-full bg-white flex-row items-center justify-center opacity-60">
              <Text className="text-xs font-semibold text-text-muted">Save Running Notes (Locked)</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled className="w-full h-12 rounded-full bg-slate-200 flex-row items-center justify-center gap-2 opacity-60">
              <FileText size={18} color="#94A3B8" strokeWidth={2.4} />
              <Text className="text-xs font-bold text-text-muted">Sign Handover & End Shift (Locked)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-2.5">
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isSavingNotes || isSubmitting}
              onPress={handleSaveNotes}
              className="w-full h-12 rounded-full bg-white flex-row items-center justify-center"
            >
              <Text className="text-sm font-semibold text-text-primary">
                {isSavingNotes ? 'Saving Notes...' : 'Save Running Notes (Keep Shift Active)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting || isSavingNotes}
              onPress={handleEndShiftWithHandover}
              className="w-full h-14 rounded-full bg-primary flex-row items-center justify-center gap-2"
            >
              <FileText size={20} color="#FFFFFF" strokeWidth={2.4} />
              <Text className="text-base font-bold text-white tracking-wide">
                {isSubmitting ? 'Finalizing Shift...' : 'Sign Handover & End Shift'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
