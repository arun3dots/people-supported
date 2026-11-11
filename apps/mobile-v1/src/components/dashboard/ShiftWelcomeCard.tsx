import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Play, Power, CalendarOff, CheckCircle2, ListChecks, Clock } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { getUkHour, formatUkTime } from '../../lib/date';
import { useClockInEligibility } from '../../presentation/hooks/useClockInEligibility';
import { isShiftPast } from '../../presentation/hooks/shiftDashboard.utils';
import { theme } from '../../theme';

export interface ShiftWelcomeCardProps {
  shift: {
    id?: string;
    name: string;
    startTime?: string;
    endTime?: string;
    rawStartTime?: string | Date;
    rawEndTime?: string | Date;
    tasksCompleted?: number;
    tasksTotal?: number;
    status?: string;
    isStarted?: boolean;
    isCompleted?: boolean;
  } | null;
  userName: string;
  careHomeName?: string;
  isShiftStarted: boolean;
  onStartShift: () => void;
  onEndShift?: () => void;
  onPress?: () => void;
}

export function ShiftWelcomeCard({
  shift,
  userName,
  careHomeName = 'Supported Living',
  isShiftStarted,
  onStartShift,
  onEndShift,
  onPress,
}: ShiftWelcomeCardProps) {
  const firstName = userName ? userName.trim().split(' ')[0] : 'Staff';
  const eligibility = useClockInEligibility(shift);

  const getTimeOfDayGreeting = () => {
    const hour = getUkHour();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCompleted = shift?.status === 'Completed' || Boolean(shift?.isCompleted);
  const isPast = isShiftPast(shift);
  const hasShift = Boolean(shift && shift.id && (isCompleted || !isPast));

  const completedTasks = shift?.tasksCompleted ?? 0;
  const totalTasks = shift?.tasksTotal ?? 0;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const formattedCompleted = completedTasks < 10 ? `0${completedTasks}` : `${completedTasks}`;
  const formattedTotal = totalTasks < 10 ? `0${totalTasks}` : `${totalTasks}`;

  const startTimeStr = shift?.startTime
    ? formatUkTime(shift.startTime)
    : shift?.rawStartTime
      ? formatUkTime(shift.rawStartTime)
      : '';
  const endTimeStr = shift?.endTime
    ? formatUkTime(shift.endTime)
    : shift?.rawEndTime
      ? formatUkTime(shift.rawEndTime)
      : '';
  const hasTimes = Boolean(startTimeStr && endTimeStr);

  return (
    <View className="bg-surface rounded-2xl p-4 my-1 w-full gap-3">
      {/* Top Meta Row */}
      <View className="flex-row items-center justify-between gap-1.5 flex-wrap">
        <View className="flex-row items-center gap-1.5 shrink">
          <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
            {hasShift ? (shift?.name || 'Shift') : 'No Upcoming Shift'}
          </Text>
          {hasShift && hasTimes && (
            <View className="bg-white px-2 py-0.5 rounded-full border border-border/50 flex-row items-center gap-1">
              <Clock size={11} color="#4A706A" />
              <Text className="text-[11px] font-bold text-primary">
                {startTimeStr} - {endTimeStr}
              </Text>
            </View>
          )}
          <Text className="text-xs text-muted-foreground shrink" numberOfLines={1}>
            | {careHomeName}
          </Text>
        </View>
        {hasShift && !isShiftStarted && !isCompleted ? (
          <Text className="text-[11px] text-muted-foreground shrink-0" numberOfLines={1}>
            Not started yet
          </Text>
        ) : null}
      </View>

      {/* Main Greeting & Action Row */}
      <View className="flex-row items-center justify-between gap-3">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={onPress ? 0.75 : 1}
          onPress={onPress}
        >
          <Text className="text-lg font-bold text-foreground mb-1">
            {getTimeOfDayGreeting()}, {firstName} 👏
          </Text>

          {hasShift && hasTimes && (
            <View className="flex-row items-center gap-1 mb-1">
              <Clock size={12} color="#4A706A" />
              <Text className="text-xs font-semibold text-primary">
                Assigned: {startTimeStr} – {endTimeStr}
              </Text>
            </View>
          )}

          <Text className="text-xs text-muted-foreground leading-4">
            {!hasShift ? (
              'No upcoming shift assigned. Check your roster or contact your manager.'
            ) : isCompleted ? (
              'Shift completed for today. Thank you for your dedicated care!'
            ) : isShiftStarted ? (
              hasTimes
                ? `Shift active (${startTimeStr} - ${endTimeStr}). Tap to view details.`
                : 'Shift active. Tap to view details.'
            ) : !eligibility.isEligible ? (
              `Upcoming shift (${startTimeStr} - ${endTimeStr}). Clock-in opens at ${eligibility.eligibleAtStr} (10m prior).`
            ) : (
              'Every moment of care makes a difference. Let’s make today a great one.'
            )}
          </Text>
        </TouchableOpacity>

        {/* Right Action Area */}
        <View className="items-end justify-center shrink-0">
          {!hasShift ? (
            <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full">
              <CalendarOff size={14} color="#8E8E93" />
              <Text className="text-xs font-semibold text-muted-foreground ml-1.5">
                No Shift
              </Text>
            </View>
          ) : isCompleted ? (
            <View className="flex-row items-center bg-clinical-safeBg px-3 py-1.5 rounded-full">
              <CheckCircle2 size={14} color={theme.colors.clinical.safe} />
              <Text className="text-xs font-semibold text-clinical-safe ml-1.5">
                Completed
              </Text>
            </View>
          ) : !isShiftStarted ? (
            !eligibility.isEligible ? (
              <View className="items-end">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                  className="opacity-60 bg-slate-200"
                  leftIcon={<Play size={13} color="#64748B" />}
                >
                  Start Shift
                </Button>
                <Text className="text-xs text-muted-foreground font-medium mt-1 text-right">
                  {eligibility.minutesUntilEligible > 0 && eligibility.minutesUntilEligible <= 60
                    ? `Opens in ${eligibility.minutesUntilEligible}m`
                    : `Opens at ${eligibility.eligibleAtStr}`}
                </Text>
              </View>
            ) : (
              <Button
                size="sm"
                variant="default"
                onPress={onStartShift}
                leftIcon={
                  <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
                    <Play
                      size={10}
                      color={theme.colors.primary.DEFAULT}
                      fill={theme.colors.primary.DEFAULT}
                    />
                  </View>
                }
              >
                Start Shift
              </Button>
            )
          ) : (
            onEndShift && (
              <Button
                size="sm"
                variant="softDestructive"
                onPress={onEndShift}
                leftIcon={
                  <View className="w-5 h-5 rounded-full bg-clinical-critical items-center justify-center">
                    <Power size={11} color="#FFFFFF" />
                  </View>
                }
              >
                End Shift
              </Button>
            )
          )}
        </View>
      </View>

      {/* Bottom Task Counter & Track (shown when shift exists) */}
      {hasShift && (
        <View className="gap-2 pt-1">
          <View className="flex-row items-center gap-2.5">
            <View className="w-7 h-7 rounded-lg bg-primary items-center justify-center">
              <ListChecks size={15} color="#FFFFFF" />
            </View>
            <Text className="text-sm font-medium text-foreground">
              {formattedCompleted}/{formattedTotal} Tasks Completed
            </Text>
          </View>
          <View className="h-2 bg-white rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
