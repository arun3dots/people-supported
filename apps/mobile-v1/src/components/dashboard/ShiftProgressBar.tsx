import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ListChecks, Power, CheckCircle2 } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { theme } from '../../theme';

export interface ShiftProgressBarProps {
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  timeRemainingStr?: string;
  completedTasks: number;
  totalTasks: number;
  loadingTasks?: boolean;
  taskError?: boolean;
  isCompleted?: boolean;
  isContinuing?: boolean;
  onEndShift?: () => void;
  onPress?: () => void;
}

export function ShiftProgressBar({
  shiftName = 'Shift',
  shiftStartTime,
  shiftEndTime,
  timeRemainingStr = 'In progress',
  completedTasks,
  totalTasks,
  loadingTasks = false,
  taskError = false,
  isCompleted = false,
  isContinuing = false,
  onEndShift,
  onPress,
}: ShiftProgressBarProps) {
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const formattedCompleted = completedTasks < 10 ? `0${completedTasks}` : `${completedTasks}`;
  const formattedTotal = totalTasks < 10 ? `0${totalTasks}` : `${totalTasks}`;
  const progressText = loadingTasks ? 'Loading tasks...'
    : taskError ? 'Unable to load task count'
      : `${formattedCompleted}/${formattedTotal} Tasks Completed`;
  const isShiftEnded = isCompleted;
  const timeHoursLabel = shiftStartTime && shiftEndTime ? ` (${shiftStartTime} - ${shiftEndTime})` : '';

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      className="bg-surface rounded-2xl p-4 my-1 w-full gap-3"
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
    >
      {/* Top Header Row */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-foreground">
            Your Shift Progress
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {shiftName}{timeHoursLabel} |{' '}
            <Text
              className={`text-xs font-medium ${
                isContinuing && !isCompleted ? 'text-clinical-warning font-semibold' : 'text-muted-foreground'
              }`}
            >
              {timeRemainingStr}
            </Text>
          </Text>
        </View>

        {/* End Shift Soft Rose Pill or Completed Badge */}
        {isShiftEnded ? (
          <View className="flex-row items-center bg-clinical-safeBg px-3 py-1.5 rounded-full">
            <CheckCircle2 size={13} color={theme.colors.clinical.safe} />
            <Text className="text-xs font-semibold text-clinical-safe ml-1.5">Completed</Text>
          </View>
        ) : onEndShift ? (
          <Button
            size="sm"
            variant="softDestructive"
            onPress={(event) => {
              event.stopPropagation();
              onEndShift();
            }}
            leftIcon={
              <View className="w-5 h-5 rounded-full bg-clinical-critical items-center justify-center">
                <Power size={11} color="#FFFFFF" />
              </View>
            }
          >
            End Shift
          </Button>
        ) : null}
      </View>

      {/* Task Completion Counter Row */}
      <View className="flex-row items-center gap-2.5">
        <View className="w-7 h-7 rounded-lg bg-primary items-center justify-center">
          <ListChecks size={15} color="#FFFFFF" />
        </View>
        <Text className="text-sm font-medium text-foreground">
          {progressText}
        </Text>
      </View>

      {/* Progress Bar Track */}
      <View className="h-2 bg-white rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </View>
    </CardWrapper>
  );
}
