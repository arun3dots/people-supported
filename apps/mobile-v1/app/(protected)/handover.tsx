import React, { useEffect, useRef, useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronLeft, CheckCircle2, FileText, Users } from 'lucide-react-native';
import { Button, Card, Input, ScreenWrapper, Text } from '../../src/presentation/components/common';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { theme } from '../../src/theme';

export default function HandoverScreen() {
  const router = useRouter();
  const {
    shift,
    assignedResidents,
    endShift,
    saveHandoverNotes,
    isShiftStarted,
    isShiftCompleted,
    refreshShifts,
  } = useShiftDashboard();
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initializedShiftId = useRef<string | null>(null);

  useEffect(() => {
    if (shift && initializedShiftId.current !== shift.id) {
      initializedShiftId.current = shift.id;
      setHandoverNotes(shift.handoverNotes ?? '');
    }
  }, [shift?.id, shift?.handoverNotes]);

  const returnToDashboard = () => router.navigate('/' as Href);
  const canEdit = Boolean(shift && isShiftStarted && !isShiftCompleted);
  const busy = isSubmitting || isSaving;

  const handleSave = async () => {
    if (!canEdit || !handoverNotes.trim() || busy) return;
    setIsSaving(true);
    try {
      await saveHandoverNotes(handoverNotes.trim());
      Alert.alert('Notes Saved', 'Your draft handover is saved. Your shift remains active.');
    } catch (error) {
      Alert.alert('Unable to Save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const finishShift = async () => {
    setIsSubmitting(true);
    try {
      await endShift(handoverNotes.trim());
      Alert.alert('Shift Ended', 'Your handover has been recorded for the incoming care team.', [
        { text: 'Return to Dashboard', onPress: returnToDashboard },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to End Shift',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEndShift = () => {
    if (!canEdit || busy) return;
    if (!handoverNotes.trim()) {
      Alert.alert('Handover Notes Required', 'Enter your handover notes before ending your shift.');
      return;
    }
    Alert.alert(
      'End Shift & Sign Handover',
      'Your notes will be saved for the incoming team and your shift will end.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Off & End Shift', style: 'destructive', onPress: () => void finishShift() },
      ],
    );
  };

  const progressText = shift?.taskProgressLoading
    ? 'Loading tasks...'
    : shift?.taskProgressError
      ? 'Unable to load task count'
      : `${shift?.tasksCompleted ?? 0}/${shift?.tasksTotal ?? 0} Tasks Completed`;

  return (
    <ScreenWrapper scrollable>
      <View className="flex-row items-center gap-3 pt-3 pb-4">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : returnToDashboard())}
        >
          <ChevronLeft size={24} color={theme.colors.foreground} />
        </Button>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">End Shift & Handover</Text>
          <Text className="text-md text-muted-foreground mt-1">
            Your update for the incoming care team
          </Text>
        </View>
      </View>

      <Card className="rounded-2xl bg-surface border-0 p-5 mb-4">
        <Text className="text-lg font-bold text-foreground">{shift?.name ?? 'My Shift'}</Text>
        <Text className="text-base text-muted-foreground mt-1">
          {shift ? `${shift.startTime} - ${shift.endTime}` : 'No shift assigned'}
        </Text>
        <View className="flex-row flex-wrap gap-3 mt-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={20} color={theme.colors.primary.DEFAULT} />
            <Text className="text-md font-semibold text-primary">{progressText}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Users size={20} color={theme.colors.primary.DEFAULT} />
            <Text className="text-md text-foreground">
              {assignedResidents.length} People Supported
            </Text>
          </View>
        </View>
        {shift?.taskProgressError && (
          <Button variant="outline" className="mt-3" onPress={() => void refreshShifts()}>
            Retry task count
          </Button>
        )}
      </Card>

      {assignedResidents.length > 0 && (
        <Card className="rounded-2xl border-0 bg-surface p-5 mb-4">
          <Text className="text-base font-bold text-foreground mb-2">
            People Supported This Shift
          </Text>
          {assignedResidents.map((resident) => (
            <Text key={resident.id} className="text-base text-foreground py-1">
              {resident.fullName}
              {resident.roomNumber ? ` - Room ${resident.roomNumber}` : ''}
            </Text>
          ))}
        </Card>
      )}

      <Card className="rounded-2xl bg-card-subtle border-0 p-5 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <FileText size={22} color={theme.colors.primary.DEFAULT} />
          <Text className="text-lg font-bold text-foreground">Your Handover Notes</Text>
        </View>
        <Text className="text-md text-muted-foreground leading-6 mb-4">
          Include updates for people supported, concerns and outstanding actions for the next shift.
        </Text>
        {!canEdit && (
          <Text className="text-base font-medium text-primary mb-3">
            {isShiftCompleted
              ? 'Your shift has ended. This handover is read-only.'
              : 'Start your assigned shift to write your handover.'}
          </Text>
        )}
        <Input
          value={handoverNotes}
          onChangeText={setHandoverNotes}
          editable={canEdit && !busy}
          accessibilityLabel="Your handover notes for the next shift"
          placeholder="Enter your handover notes..."
          multiline
          textAlignVertical="top"
          className="h-48 bg-white text-base text-foreground p-4"
          style={{ color: theme.colors.foreground }}
        />
      </Card>

      {canEdit ? (
        <View className="gap-3 mb-6">
          <Button
            variant="outline"
            onPress={() => void handleSave()}
            loading={isSaving}
            disabled={busy || !handoverNotes.trim()}
          >
            Save Draft & Keep Shift Active
          </Button>
          <Button
            size="lg"
            onPress={confirmEndShift}
            loading={isSubmitting}
            disabled={
              busy ||
              !handoverNotes.trim() ||
              shift?.taskProgressLoading ||
              shift?.taskProgressError
            }
          >
            Sign Handover & End Shift
          </Button>
        </View>
      ) : (
        <Button className="mb-6" variant="outline" onPress={returnToDashboard}>
          Return to Dashboard
        </Button>
      )}
    </ScreenWrapper>
  );
}
