import React from 'react';
import { View, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronLeft, FileText, LockKeyhole, Clock } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  ScreenWrapper,
  Text,
} from '../../src/presentation/components/common';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { resolveHandoverResidentNames } from '../../src/components/dashboard/RecentHandoverCard';
import { formatUkDate, formatUkTime } from '../../src/lib/date';
import { theme } from '../../src/theme';

export default function PreviousHandoverScreen() {
  const router = useRouter();
  const { shift, assignedResidents, loading, error, refreshShifts } = useShiftDashboard();
  const notes = shift?.previousShiftHandovers?.length
    ? shift.previousShiftHandovers
    : shift?.previousShiftHandover
      ? [shift.previousShiftHandover]
      : [];

  return (
    <ScreenWrapper
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refreshShifts()}
          tintColor={theme.colors.primary.DEFAULT}
          colors={[theme.colors.primary.DEFAULT]}
        />
      }
    >
      <View className="flex-row items-center gap-3 pt-3 pb-4">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
        >
          <ChevronLeft size={24} color={theme.colors.foreground} />
        </Button>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Previous Handovers</Text>
          <Text className="text-md text-muted-foreground mt-1">
            Notes from the previous care team
          </Text>
        </View>
      </View>

      <View className="rounded-2xl bg-primary/10 p-4 mb-4 flex-row items-start gap-3">
        <LockKeyhole size={22} color={theme.colors.primary.DEFAULT} />
        <View className="flex-1">
          <Text className="text-base font-bold text-primary">Read-only handover notes</Text>
          <Text className="text-md text-foreground leading-6 mt-1">
            Signed notes for your assigned people supported or property. To write your own handover,
            select End Shift on the dashboard.
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
      ) : error ? (
        <Card className="p-5 gap-3">
          <Text className="text-base text-foreground">Unable to load handover notes.</Text>
          <Button variant="outline" onPress={() => void refreshShifts()}>
            Try again
          </Button>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="rounded-2xl bg-surface border-0 p-6 items-center gap-3">
          <FileText size={32} color={theme.colors.primary.DEFAULT} />
          <Text className="text-lg font-bold text-foreground text-center">
            No Previous Handover Notes
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-6">
            {shift
              ? 'The previous team has not recorded any completed handovers for your assignment yet.'
              : 'An assigned shift is needed to show handover notes from the previous team.'}
          </Text>
        </Card>
      ) : (
        notes.map((note, index) => (
          <Card
            key={note.id ?? `${note.staffName}-${index}`}
            className="rounded-2xl bg-surface border-0 p-5 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <Avatar
                name={note.staffName ?? 'Staff'}
                imageUrl={note.staffAvatarUrl ?? undefined}
                size="lg"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">
                  {note.staffName ?? 'Previous Shift Staff'}
                </Text>
                <Text className="text-md text-muted-foreground mt-1">
                  {note.staffRole ?? 'Care team'} - {note.shiftName ?? 'Previous Shift'}
                </Text>
              </View>
            </View>
            {note.endTime && (
              <View className="flex-row items-center gap-2 mt-4">
                <Clock size={16} color={theme.colors.primary.DEFAULT} />
                <Text className="text-md text-muted-foreground">
                  Signed off {formatUkDate(note.endTime)} at {formatUkTime(note.endTime)}
                </Text>
              </View>
            )}
            <View className="mt-4 pt-4 border-t border-border-light">
              <Text className="text-md font-semibold text-primary mb-2">Handover notes</Text>
              <Text selectable className="text-base text-foreground leading-6">
                {resolveHandoverResidentNames(note.handoverNotes, assignedResidents)}
              </Text>
            </View>
          </Card>
        ))
      )}
    </ScreenWrapper>
  );
}
