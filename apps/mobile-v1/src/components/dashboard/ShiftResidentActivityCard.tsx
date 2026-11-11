import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Activity, ChevronRight, Eye, Pill } from 'lucide-react-native';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { formatUkRelativeDayAndTime } from '../../lib/date';
import type { ShiftResidentActivity } from '../../presentation/hooks/useShiftResidentActivity';

interface Props {
  activities: ShiftResidentActivity[];
  loading: boolean;
  error: string | null;
  hasAssignedResidents: boolean;
  onRetry: () => void;
}

function getActivityTitle(eventType: string): string {
  if (eventType === 'RESIDENT_RECORD_VIEWED') return 'Resident profile viewed';
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-foreground">Recent Resident Activity</Text>
      </View>

      <Card className="p-4">
        {loading ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#4A706A" />
            <Text className="text-xs text-muted-foreground mt-2">Loading activity...</Text>
          </View>
        ) : error ? (
          <View>
            <Text className="text-xs text-amber-800">
              Could not load recent resident activity. {error}
            </Text>
            <TouchableOpacity onPress={onRetry} activeOpacity={0.7} className="mt-2">
              <Text className="text-xs font-bold text-amber-900">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activities.length > 0 ? (
          activities.slice(0, 5).map((activity, index) => {
            const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(activity.timestamp);
            const isAccessEvent = activity.eventType === 'RESIDENT_RECORD_VIEWED';
            const isMedication = activity.eventType.toLowerCase().includes('med');

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
                    isMedication || isAccessEvent ? 'bg-clinical-safeBg' : 'bg-white'
                  }`}
                >
                  {isAccessEvent ? (
                    <Eye size={17} color="#0284C7" />
                  ) : isMedication ? (
                    <Pill size={17} color="#1D5E2E" />
                  ) : (
                    <Activity size={17} color="#0284C7" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-md font-semibold text-foreground">
                    {getActivityTitle(activity.eventType)}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {activity.residentName} · {activity.summary}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {activity.carer?.fullName || 'Staff'} · {dateLabel}, {timeLabel}
                  </Text>
                </View>
                <ChevronRight size={16} color="#64748B" />
              </TouchableOpacity>
            );
          })
        ) : (
          <Text className="text-xs text-muted-foreground py-2">
            {hasAssignedResidents
              ? 'You have no recent activity recorded for your assigned residents.'
              : 'No residents are assigned to your current shift.'}
          </Text>
        )}
      </Card>
    </View>
  );
}
