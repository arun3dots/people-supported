import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar, ChevronDown, AlertCircle, Clock, Play } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import { Card } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';
import {
  useDailyTasks,
  type MobileTaskItem,
} from '../../src/presentation/hooks/useDailyTasks';
import { TaskCard } from '../../src/components/clinical/TaskCard';
import {
  TaskSignOffModal,
  type LogTaskModalSubmitData,
} from '../../src/components/clinical/TaskSignOffModal';
import {
  TaskFilterTabs,
  type TaskFilterType,
} from '../../src/components/clinical/TaskFilterTabs';
import { formatUkDate } from '../../src/lib/date';
import { theme } from '../../src/theme';

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id || (user as { userId?: string })?.userId;
  const { shift, isShiftStarted, startShift } = useShiftDashboard();
  const eligibility = useClockInEligibility(shift);

  const userRole = (user?.roleName || '').toLowerCase();
  const isPrivileged = userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin';
  const isAccessAllowed = isPrivileged || isShiftStarted;

  const {
    tasks,
    residents,
    totalCount,
    dueNowCount,
    doneCount,
    missedCount,
    refusedCount,
    upcomingCount,
    loading,
    refreshing,
    error,
    refreshTasks,
    signOffTask,
    skipTask,
    isSubmitting,
  } = useDailyTasks();

  const [activeFilter, setActiveFilter] = useState<TaskFilterType>('all');
  const [selectedResidentId, setSelectedResidentId] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<MobileTaskItem | null>(null);

  // Filter tasks by status and resident (matching Web logic)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Resident filter
      if (selectedResidentId !== 'all' && t.residentId !== selectedResidentId) {
        return false;
      }

      // 2. Status filter
      const s = (t.rawStatus || t.status || '').toLowerCase();
      const isCompleted = s === 'completed' || s === 'done';
      const isSkipped = s === 'skipped' || s === 'missed';
      const isRefused = s === 'refused';
      const isPending = s === 'pending' || s === 'due' || s === 'inprogress';

      if (activeFilter === 'open') {
        if (!isPending) return false;
      } else if (activeFilter === 'upcoming') {
        if (isCompleted || isSkipped || isRefused) return false;
        if (s !== 'pending' && s !== 'scheduled') return false;
      } else if (activeFilter === 'done') {
        if (!isCompleted) return false;
      } else if (activeFilter === 'missed') {
        if (!isSkipped && t.status !== 'Overdue') return false;
      } else if (activeFilter === 'refused') {
        if (!isRefused && !t.skipReason?.toLowerCase().includes('refus')) return false;
      }

      return true;
    });
  }, [tasks, selectedResidentId, activeFilter]);

  const handleSaveRecord = async (data: LogTaskModalSubmitData) => {
    if (!selectedTask) return;
    if (data.status === 'Completed') {
      await signOffTask(selectedTask, data.notes);
    } else {
      await skipTask(
        selectedTask,
        data.skipReason || 'Skipped by carer',
        data.notes
      );
    }
    setSelectedTask(null);
  };

  return (
    <ScreenWrapper
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void refreshTasks();
          }}
          colors={[theme.colors.primary.DEFAULT]}
          tintColor={theme.colors.primary.DEFAULT}
        />
      }
      contentContainerStyle={{ paddingBottom: 130 }}
    >
      {/* 1. Header */}
      <View className="pt-2 pb-1">
        <Text className="text-xl font-bold text-foreground">
          Tasks
        </Text>
        <Text className="text-sm text-muted-foreground mt-0.5">
          {isAccessAllowed
            ? 'Your assigned tasks for the day'
            : 'Point-of-care task schedule (active shift required).'}
        </Text>
      </View>

      {!isAccessAllowed ? (
        <View className="items-center justify-center pt-8 pb-12 px-2">
          <Card className="w-full p-6 items-center text-center">
            <View className="h-16 w-16 rounded-full bg-white items-center justify-center mb-4">
              <Clock size={32} color={theme.colors.primary.DEFAULT} />
            </View>

            <Text className="text-lg font-bold text-foreground text-center mb-1.5">
              Shift Not Started
            </Text>

            <Text className="text-xs text-muted-foreground text-center leading-5 mb-5 max-w-[280px]">
              Daily clinical tasks and support routines are accessible once your shift has started.
            </Text>

            {shift ? (
              <Button
                variant={eligibility.isEligible ? 'default' : 'secondary'}
                size="default"
                disabled={!eligibility.isEligible}
                className={`w-full mb-2.5 ${
                  eligibility.isEligible ? '' : 'opacity-60 bg-slate-200'
                }`}
                leftIcon={
                  <Play
                    size={16}
                    color={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
                    fill={eligibility.isEligible ? '#FFFFFF' : '#64748B'}
                  />
                }
                onPress={async () => {
                  if (eligibility.isEligible) {
                    await startShift();
                  }
                }}
              >
                {eligibility.isEligible
                  ? `Start Shift (${shift.name || 'Shift'})`
                  : `Clock-in opens at ${eligibility.eligibleAtStr || 'scheduled time'}`}
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.navigate('/' as Href)}
            >
              Return to Home
            </Button>
          </Card>
        </View>
      ) : (
        <>
          {/* 2. Date Selector & Sync Status */}
          <View className="flex-row items-center justify-between mt-2.5 mb-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={refreshTasks}
              className="flex-row items-center gap-2 py-1"
            >
              <View className="w-8 h-8 rounded-lg bg-surface items-center justify-center">
                <Calendar size={16} color={theme.colors.foreground} strokeWidth={2} />
              </View>
              <Text className="text-md font-semibold text-foreground">
                Today ({formatUkDate(new Date(), { day: 'numeric', month: 'short' })})
              </Text>
              <ChevronDown size={15} color={theme.colors.muted.foreground} strokeWidth={2.2} />
            </TouchableOpacity>

            {loading && !refreshing && (
              <View className="flex-row items-center gap-1.5 bg-surface px-3 py-1 rounded-full">
                <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
                <Text className="text-xs font-medium text-primary">Syncing...</Text>
              </View>
            )}
          </View>

          {/* Offline / Error Alert */}
          {error && (
            <View className="flex-row items-center gap-2 bg-clinical-warningBg px-3.5 py-2.5 rounded-xl mb-3">
              <AlertCircle size={15} color={theme.colors.clinical.warning} />
              <Text className="text-xs text-clinical-warning font-medium flex-1">
                {tasks.length > 0
                  ? 'Could not refresh tasks. Showing the last loaded tasks.'
                  : 'Could not load assigned tasks. Check your connection and try again.'}
              </Text>
            </View>
          )}

          {/* 3. Filter Bar (Status & Dynamic Resident Pills) */}
          <TaskFilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            selectedResidentId={selectedResidentId}
            onResidentChange={setSelectedResidentId}
            residents={residents}
            totalCount={totalCount}
            dueNowCount={dueNowCount}
            upcomingCount={upcomingCount}
            doneCount={doneCount}
            missedCount={missedCount}
            refusedCount={refusedCount}
          />

          {/* 4. Task Cards List */}
          <View className="pt-1">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onPress={() => setSelectedTask(task)}
              />
            ))}

            {filteredTasks.length === 0 && (
              <View className="py-12 items-center justify-center bg-surface rounded-2xl">
                <Text className="text-md font-semibold text-muted-foreground">
                  No tasks found for this filter
                </Text>
              </View>
            )}
          </View>

          {/* 5. Log Task Activity Modal */}
          <TaskSignOffModal
            task={selectedTask}
            isOpen={Boolean(selectedTask)}
            onClose={() => setSelectedTask(null)}
            onSubmit={handleSaveRecord}
            isPending={isSubmitting}
          />
        </>
      )}
    </ScreenWrapper>
  );
}
