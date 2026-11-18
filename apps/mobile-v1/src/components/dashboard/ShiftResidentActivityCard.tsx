import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ClipboardCheck, ChevronRight, Pill } from 'lucide-react-native';
import { Button, Card, Text } from '../../presentation/components/common';
import { theme } from '../../theme';
import { formatUkRelativeDayAndTime } from '../../lib/date';
import type { ShiftResidentActivity } from '../../presentation/hooks/useShiftResidentActivity';

interface Props {
  activities: ShiftResidentActivity[];
  loading: boolean;
  error: string | null;
  hasAssignedResidents: boolean;
  onRetry: () => void;
}

export function ShiftResidentActivityCard({
  activities,
  loading,
  error,
  hasAssignedResidents,
  onRetry,
}: Props) {
  const router = useRouter();

  return (
    <View className="mt-2">
      <View className="mb-3">
        <Text className="text-lg font-bold text-foreground">Recent Support Activity</Text>
        <Text className="text-md text-muted-foreground mt-1">
          Medication and task updates for your assigned people supported
        </Text>
      </View>

      <Card className="p-4">
        {loading ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
            <Text className="text-md text-muted-foreground mt-2">Loading activity...</Text>
          </View>
        ) : error ? (
          <View>
            <Text className="text-md text-amber-800">
              Could not load recent medication and task activity.
            </Text>
            <Button onPress={onRetry} variant="outline" className="mt-3">
              Retry
            </Button>
          </View>
        ) : activities.length > 0 ? (
          activities.slice(0, 5).map((activity, index) => {
            const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(activity.timestamp);
            const isMedication = activity.activityKind === 'medication';

            return (
              <TouchableOpacity
                key={`${activity.id}-${index}`}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/resident-details',
                    params: { id: activity.residentId },
                  } as Href)
                }
                className="flex-row items-start py-2.5 border-b border-slate-200/60 last:border-b-0"
              >
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                    isMedication ? 'bg-clinical-safeBg' : 'bg-primary-light'
                  }`}
                >
                  {isMedication ? (
                    <Pill size={17} color={theme.colors.clinical.safe} />
                  ) : (
                    <ClipboardCheck size={17} color={theme.colors.primary.DEFAULT} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-md font-semibold text-foreground">{activity.title}</Text>
                  <Text className="text-md text-muted-foreground mt-0.5">
                    {activity.residentName} · {activity.summary}
                  </Text>
                  <Text className="text-md text-muted-foreground mt-1">
                    {activity.carer?.fullName || 'Staff'} · {dateLabel}, {timeLabel}
                  </Text>
                </View>
                <ChevronRight size={16} color={theme.colors.muted.foreground} />
              </TouchableOpacity>
            );
          })
        ) : (
          <Text className="text-md text-muted-foreground py-2">
            {hasAssignedResidents
              ? 'No recent medication or task activity is recorded for your assigned people supported.'
              : 'No people supported are assigned to your current shift.'}
          </Text>
        )}
      </Card>
    </View>
  );
}
