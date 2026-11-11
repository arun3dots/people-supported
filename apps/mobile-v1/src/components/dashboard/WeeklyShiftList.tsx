import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Coffee,
  RotateCcw,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { theme } from '../../theme';
import {
  useWeeklyShifts,
  WeeklyShiftDay,
  calculateShiftDurationHours,
} from '../../presentation/hooks/useWeeklyShifts';
import { ShiftInfo } from '../../presentation/hooks/shiftDashboard.utils';

export interface WeeklyShiftListProps {
  onSelectShift?: (shift: ShiftInfo) => void;
}

export function WeeklyShiftList({ onSelectShift }: WeeklyShiftListProps) {
  const {
    weekRangeLabel,
    isCurrentWeek,
    days,
    totalWeeklyHours,
    totalWeeklyShifts,
    totalDaysOff,
    isLoading,
    error,
    refetch,
    goToPrevWeek,
    goToNextWeek,
    goToThisWeek,
  } = useWeeklyShifts();

  const contractedHoursTarget = 40;
  const hoursProgressPct = Math.min(100, Math.round((totalWeeklyHours / contractedHoursTarget) * 100));
  const isWtrCompliant = totalWeeklyHours <= 48;

  return (
    <View className="flex-1">
      {/* 1. Week Selector Header */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-1">
        Selected Rota Period
      </Text>
      <View className="bg-surface rounded-2xl p-3 mb-2.5 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={goToPrevWeek}
          accessibilityLabel="Previous week"
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={theme.colors.foreground} />
        </TouchableOpacity>

        <View className="items-center flex-1 px-2">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={14} color={theme.colors.primary.DEFAULT} />
            <Text className="text-sm font-bold text-foreground">Week of {weekRangeLabel}</Text>
          </View>
          {!isCurrentWeek ? (
            <TouchableOpacity
              onPress={goToThisWeek}
              className="flex-row items-center gap-1 mt-1 bg-white px-2.5 py-0.5 rounded-full"
              activeOpacity={0.7}
            >
              <RotateCcw size={11} color={theme.colors.primary.DEFAULT} />
              <Text className="text-xs font-semibold text-primary">Return to Current Week</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-xs text-muted-foreground mt-0.5">Current CQC Duty Roster</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={goToNextWeek}
          accessibilityLabel="Next week"
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color={theme.colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* 2. Weekly Rota Overview KPIs (Matches ShiftTodayView 3-Card Pattern) */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-2">
        Weekly Rota Overview
      </Text>
      <View className="flex-row gap-2.5 mb-2.5">
        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View className="w-8 h-8 rounded-full bg-clinical-safeBg justify-center items-center mb-1">
            <Clock size={16} color={theme.colors.clinical.safe} />
          </View>
          <Text className="text-lg font-bold text-foreground">{totalWeeklyHours}h</Text>
          <Text className="text-xs font-medium text-muted-foreground">Total Hours</Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View className="w-8 h-8 rounded-full bg-clinical-infoBg justify-center items-center mb-1">
            <Calendar size={16} color={theme.colors.clinical.info} />
          </View>
          <Text className="text-lg font-bold text-foreground">{totalWeeklyShifts}</Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {totalWeeklyShifts === 1 ? 'Shift' : 'Shifts'}
          </Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3.5 items-center">
          <View className="w-8 h-8 rounded-full bg-white justify-center items-center mb-1">
            <Coffee size={16} color={theme.colors.primary.DEFAULT} />
          </View>
          <Text className="text-lg font-bold text-foreground">{totalDaysOff}</Text>
          <Text className="text-xs font-medium text-muted-foreground">Rest Days</Text>
        </View>
      </View>

      {/* 3. Loading & Error States */}
      {isLoading && (
        <View className="bg-surface rounded-2xl p-5 mb-2.5 items-center justify-center">
          <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
          <Text className="text-xs text-muted-foreground mt-2">Loading weekly shift schedule...</Text>
        </View>
      )}

      {error ? (
        <View className="bg-clinical-criticalBg p-3.5 rounded-2xl mb-2.5 flex-row items-center justify-between">
          <Text className="text-xs font-medium text-clinical-critical flex-1 mr-2">
            Unable to load shifts for this week.
          </Text>
          <TouchableOpacity
            onPress={() => void refetch()}
            className="bg-white px-3 py-1.5 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-xs font-bold text-clinical-critical">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 4. 7-Day Schedule Cards */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-2">
        7-Day Shift Schedule
      </Text>
      <View className="gap-2.5">
        {days.map((day: WeeklyShiftDay) => {
          const hasShifts = day.shifts.length > 0;
          return (
            <View
              key={day.dateIso}
              className={`rounded-2xl p-3.5 ${
                day.isToday
                  ? 'bg-primary-light border border-border'
                  : 'bg-surface'
              }`}
            >
              {/* Day Header Row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center ${
                      day.isToday ? 'bg-primary' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        day.isToday
                          ? 'text-white'
                          : hasShifts
                            ? 'text-primary'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {day.dayName}
                    </Text>
                    <Text
                      className={`text-sm font-bold ${
                        day.isToday
                          ? 'text-white'
                          : hasShifts
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {day.dayNumber}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-foreground">
                        {day.dayName}, {day.dayNumber} {day.monthName}
                      </Text>
                      {day.isToday && (
                        <Badge variant="clinicalSafe" size="sm">
                          <Text className="text-[10px] font-bold text-clinical-safe">Today</Text>
                        </Badge>
                      )}
                    </View>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {hasShifts
                        ? `${day.shifts.length} ${day.shifts.length === 1 ? 'shift' : 'shifts'} • ${day.totalHours}h scheduled`
                        : 'Rest day — no shifts assigned'}
                    </Text>
                  </View>
                </View>

                {!hasShifts && (
                  <Badge variant="outline" size="sm">
                    <Text className="text-xs font-medium text-muted-foreground">Off</Text>
                  </Badge>
                )}
              </View>

              {/* Shift Cards inside the Day */}
              {hasShifts && (
                <View className="gap-2 mt-3">
                  {day.shifts.map((shift: ShiftInfo) => {
                    const durationHours = calculateShiftDurationHours(shift);
                    const isActiveOrDone = Boolean(shift.isCompleted || shift.isStarted);
                    return (
                      <TouchableOpacity
                        key={shift.id}
                        activeOpacity={onSelectShift ? 0.75 : 1}
                        onPress={onSelectShift ? () => onSelectShift(shift) : undefined}
                        className="bg-white rounded-xl p-3 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-3 flex-1 pr-2">
                          <View className="w-9 h-9 rounded-xl bg-primary-light items-center justify-center">
                            <Clock size={16} color={theme.colors.primary.DEFAULT} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                              {shift.name}
                            </Text>
                            <View className="flex-row items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                              <Text className="text-xs font-semibold text-primary">
                                {shift.startTime} – {shift.endTime}
                                {durationHours > 0 ? ` (${durationHours}h)` : ''}
                              </Text>
                              {shift.wardName ? (
                                <View className="flex-row items-center gap-1">
                                  <MapPin size={11} color={theme.colors.muted.foreground} />
                                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                                    {shift.wardName}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>

                        <Badge
                          variant={isActiveOrDone ? 'clinicalSafe' : 'outline'}
                          size="sm"
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              isActiveOrDone ? 'text-clinical-safe' : 'text-muted-foreground'
                            }`}
                          >
                            {shift.isCompleted
                              ? 'Completed'
                              : shift.isStarted
                                ? 'Active Shift'
                                : shift.status === 'Ended'
                                  ? 'Ended'
                                  : 'Scheduled'}
                          </Text>
                        </Badge>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 5. Bottom Hours & Working Time Compliance Card (Matches Web RotaBottomCards & ShiftTodayView) */}
      <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-2 mt-3.5">
        Hours & Compliance
      </Text>
      <View className="bg-card-subtle rounded-2xl p-4 mb-2">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <ShieldCheck
              size={16}
              color={isWtrCompliant ? theme.colors.clinical.safe : theme.colors.clinical.warning}
            />
            <Text className="text-sm font-bold text-foreground">Working Time Directive</Text>
          </View>
          <Badge variant={isWtrCompliant ? 'clinicalSafe' : 'clinicalWarning'} size="sm">
            <Text
              className={`text-xs font-semibold ${
                isWtrCompliant ? 'text-clinical-safe' : 'text-clinical-warning'
              }`}
            >
              {isWtrCompliant ? 'WTR Compliant' : 'Over 48h Limit'}
            </Text>
          </Badge>
        </View>

        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs text-muted-foreground">Weekly Scheduled Hours</Text>
          <Text className="text-xs font-bold text-foreground">
            {totalWeeklyHours}h / {contractedHoursTarget}h standard
          </Text>
        </View>

        <View className="h-2 bg-white rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${hoursProgressPct}%` }}
          />
        </View>
      </View>
    </View>
  );
}
