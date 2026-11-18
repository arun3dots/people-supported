import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ClipboardCheck, Pill } from 'lucide-react-native';
import { Button, Card, Text } from '../../presentation/components/common';
import { formatUkRelativeDayAndTime } from '../../lib/date';
import { supportPlanLabel } from '../../lib/supportPlanLabel';
import { theme } from '../../theme';
import { useShiftDashboard } from '../../presentation/hooks/useShiftDashboard';
import { residentSupportActivities } from '../../presentation/hooks/shiftResidentActivity.query';
import type {
  ResidentDetailData,
  ResidentTimelineItem,
} from '../../presentation/hooks/useResidentDetail';

interface Props {
  resident: ResidentDetailData;
  timeline: ResidentTimelineItem[];
  activityError?: string | null;
  onRetry?: () => void;
}

export function ResidentActivitiesTimeline({ resident, timeline, activityError, onRetry }: Props) {
  const { assignedResidents, isShiftStarted, loading, error, refreshShifts } = useShiftDashboard();
  const activeResidents = isShiftStarted ? assignedResidents : [];
  const isAssigned = activeResidents.some((assigned) => assigned.id === resident.id);
  const activities = residentSupportActivities(resident, timeline, activeResidents);

  return (
    <View className="pb-6">
      <Text className="text-lg font-bold text-foreground mb-1">Recent Activities</Text>
      <Text className="text-md text-muted-foreground mb-3">
        Medication and task updates for this person supported
      </Text>
      <Card className="p-5">
        {loading ? (
          <View className="items-center py-5 gap-2">
            <ActivityIndicator color={theme.colors.primary.DEFAULT} />
            <Text className="text-md text-muted-foreground">Loading activity...</Text>
          </View>
        ) : error ? (
          <View className="gap-3">
            <Text className="text-md text-muted-foreground">
              Unable to verify your shift assignments.
            </Text>
            <Button variant="outline" onPress={() => void refreshShifts()}>
              Retry
            </Button>
          </View>
        ) : !isAssigned ? (
          <Text className="text-md text-muted-foreground text-center py-4">
            {isShiftStarted
              ? 'Activity is available only for people supported assigned to your current shift.'
              : 'Start your assigned shift to view medication and task activity.'}
          </Text>
        ) : activityError ? (
          <View className="gap-3">
            <Text className="text-md text-amber-800">Activity history could not be refreshed.</Text>
            {onRetry && (
              <Button variant="outline" onPress={onRetry}>
                Retry
              </Button>
            )}
          </View>
        ) : activities.length === 0 ? (
          <Text className="text-md text-muted-foreground text-center py-4">
            No recent medication or task activity recorded.
          </Text>
        ) : (
          activities.map((activity, index) => {
            const { dateLabel, timeLabel } = formatUkRelativeDayAndTime(activity.timestamp);
            const isMedication = activity.activityKind === 'medication';
            const isLast = index === activities.length - 1;
            return (
              <View key={activity.id} className="flex-row items-start">
                <View className="items-center mr-3">
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${isMedication ? 'bg-clinical-safeBg' : 'bg-primary-light'}`}
                  >
                    {isMedication ? (
                      <Pill size={18} color={theme.colors.clinical.safe} />
                    ) : (
                      <ClipboardCheck size={18} color={theme.colors.primary.DEFAULT} />
                    )}
                  </View>
                  {!isLast && <View className="w-px h-12 bg-border-light my-2" />}
                </View>
                <View className={`flex-1 ${isLast ? 'pb-1' : 'pb-6'}`}>
                  <Text className="text-base font-bold text-foreground leading-6">
                    {supportPlanLabel(activity.title)}
                  </Text>
                  <Text className="text-md text-muted-foreground mt-1 leading-6">
                    {activity.summary}
                  </Text>
                  <Text className="text-md font-semibold text-primary mt-1">
                    {activity.carer?.fullName}
                  </Text>
                </View>
                <View className="items-end pl-2 pt-1">
                  <Text className="text-md text-muted-foreground">{dateLabel}</Text>
                  <Text className="text-md text-muted-foreground mt-1">{timeLabel}</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}
