import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { ShiftWelcomeCard } from '../../src/components/dashboard/ShiftWelcomeCard';
import { ShiftProgressBar } from '../../src/components/dashboard/ShiftProgressBar';
import { QuickAccessCard, QuickAccessAction } from '../../src/components/dashboard/QuickAccessCard';
import { AlertCard, AlertItem } from '../../src/components/dashboard/AlertCard';
import { ResidentCard } from '../../src/components/common/ResidentCard';
import { RecentHandoverCard } from '../../src/components/dashboard/RecentHandoverCard';
import { EndShiftModal } from '../../src/components/dashboard/EndShiftModal';
import { ShiftDetailsModal } from '../../src/components/dashboard/ShiftDetailsModal';
import { ShiftResidentActivityCard } from '../../src/components/dashboard/ShiftResidentActivityCard';
import { Text } from '../../src/components/ui/text';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useShiftResidentActivity } from '../../src/presentation/hooks/useShiftResidentActivity';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';

/** Notification priorities outside the alert card's High/Medium/Low scale map to High. */
function toAlertPriority(priority?: string): AlertItem['priority'] {
  switch (priority?.toLowerCase()) {
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'High';
  }
}
import { formatNotificationTime } from '../../src/presentation/hooks/useNotifications';

export default function DashboardScreen() {
  const router = useRouter();
  const { openShiftDetails, tab } = useLocalSearchParams<{ openShiftDetails?: string; tab?: string }>();
  const { user } = useAuth();
  const {
    shift,
    assignedResidents,
    urgentAlerts,
    isShiftStarted,
    isShiftCompleted,
    startShift,
    endShift,
    refreshShifts,
    loading,
  } = useShiftDashboard();
  const eligibility = useClockInEligibility(shift);
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [isShiftDetailsModalOpen, setIsShiftDetailsModalOpen] = useState(false);
  const [shiftDetailsInitialTab, setShiftDetailsInitialTab] = useState<'today' | 'weekly'>('today');
  const activeShiftResidents =
    isShiftStarted && !isShiftCompleted ? assignedResidents : [];
  const {
    activities,
    loading: activityLoading,
    error: activityError,
    refetch: refreshActivities,
  } = useShiftResidentActivity(activeShiftResidents, user?.id);

  useEffect(() => {
    if (openShiftDetails !== 'true') return;

    if (tab === 'weekly') {
      setShiftDetailsInitialTab('weekly');
    } else {
      setShiftDetailsInitialTab('today');
    }
    setIsShiftDetailsModalOpen(true);
    router.setParams({ openShiftDetails: undefined, tab: undefined });
  }, [openShiftDetails, tab, router]);

  // Convert live unread notifications into alert cards
  const alertItems: AlertItem[] = urgentAlerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.message,
    priority: toAlertPriority(alert.priority),
    priorityLabel: alert.priority,
    timestamp: formatNotificationTime(alert.createdAt ?? undefined),
    actionUrl: alert.actionUrl,
  }));

  useFocusEffect(
    useCallback(() => {
      refreshShifts();
      void refreshActivities();
    }, [refreshActivities, refreshShifts])
  );

  const handleStartShift = async () => {
    if (!eligibility.isEligible) {
      Alert.alert(
        'Clock-In Not Eligible',
        `Clock-in for this shift opens at ${eligibility.eligibleAtStr || 'the scheduled time'} (10 minutes prior to scheduled start).`
      );
      return;
    }
    try {
      await startShift();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to start shift at this time';
      Alert.alert('Shift Error', msg);
    }
  };

  const handleEndShift = async (notes: string) => {
    try {
      await endShift(notes);
      setIsEndShiftModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to end shift at this time';
      Alert.alert('Shift Error', msg);
    }
  };

  const handleQuickAccessPress = (type: QuickAccessAction) => {
    switch (type) {
      case 'incident':
        router.push('/report-incident' as Href);
        break;
      case 'observation':
        if (!isShiftStarted) {
          Alert.alert(
            'Shift Not Started',
            'Please clock in to start your shift before recording clinical observations.'
          );
          return;
        }
        if (isShiftCompleted) {
          Alert.alert('Shift Completed', 'Your shift for today has already ended.');
          return;
        }
        router.push('/news2' as Href);
        break;
      case 'handover':
        if (!shift) {
          Alert.alert('No Active Shift', 'You do not currently have an active shift assigned.');
          return;
        }
        if (!isShiftStarted) {
          Alert.alert('Shift Not Started', 'Please clock in to start your shift before accessing Handover.');
          return;
        }
        if (isShiftCompleted) {
          Alert.alert('Shift Completed', 'Your shift for today has already ended.');
          return;
        }
        router.push('/handover' as Href);
        break;
      case 'mar':
        if (!isShiftStarted) {
          Alert.alert(
            'Shift Not Started',
            'Please clock in to start your shift before accessing eMAR medication.'
          );
          return;
        }
        if (isShiftCompleted) {
          Alert.alert('Shift Completed', 'Your shift for today has already ended.');
          return;
        }
        router.push('/mar' as Href);
        break;
    }
  };

  const nextResident = assignedResidents.length > 0 ? assignedResidents[0] : null;

  return (
    <ScreenWrapper scrollable={false} disablePadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              void Promise.all([refreshShifts(), refreshActivities()]);
            }}
            colors={['#4A706A']}
            tintColor="#4A706A"
          />
        }
      >
        {/* Shift Welcome Card or Shift Progress Bar */}
        {!isShiftStarted || !shift || isShiftCompleted ? (
          <ShiftWelcomeCard
            shift={shift}
            userName={user?.fullName || 'Sarah'}
            isShiftStarted={isShiftStarted}
            onStartShift={handleStartShift}
            onEndShift={isShiftStarted && !isShiftCompleted && Boolean(shift?.id) ? () => setIsEndShiftModalOpen(true) : undefined}
            onPress={() => {
              setShiftDetailsInitialTab(shift ? 'today' : 'weekly');
              setIsShiftDetailsModalOpen(true);
            }}
          />
        ) : (
          <ShiftProgressBar
            shiftName={shift.name}
            shiftStartTime={shift.startTime}
            shiftEndTime={shift.endTime}
            timeRemainingStr={shift.timeRemainingStr || 'Shift in progress'}
            completedTasks={shift.tasksCompleted}
            totalTasks={shift.tasksTotal}
            isCompleted={isShiftCompleted}
            onEndShift={() => setIsEndShiftModalOpen(true)}
            onPress={() => {
              setShiftDetailsInitialTab('today');
              setIsShiftDetailsModalOpen(true);
            }}
          />
        )}

        {/* Quick Access Card */}
        <QuickAccessCard
          onPressItem={handleQuickAccessPress}
          isShiftActive={isShiftStarted && !isShiftCompleted}
        />

        {/* Critical Alerts Section */}
        {alertItems.length > 0 && (
          <AlertCard
            alerts={alertItems}
            onSeeAllAlerts={() => router.push('/alerts' as Href)}
            onPressAlert={(alert) =>
              router.push((alert.actionUrl || '/alerts') as Href)
            }
          />
        )}

        {/* Recent Handover Notes Section */}
        <RecentHandoverCard
          note={
            shift?.previousShiftHandover
              ? {
                  authorName: shift.previousShiftHandover.staffName || 'Staff',
                  authorRole: 'Previous Shift Staff',
                  authorShift: String(shift.previousShiftHandover.shiftName || 'Previous Shift'),
                  content: shift.previousShiftHandover.handoverNotes,
                }
              : null
          }
          residents={activeShiftResidents}
          onPress={() => {
            if (!shift) {
              Alert.alert('No Active Shift', 'You do not currently have an active shift assigned.');
              return;
            }
            if (!isShiftStarted) {
              Alert.alert('Shift Not Started', 'Please clock in to start your shift before accessing Handover.');
              return;
            }
            router.push('/handover' as Href);
          }}
        />

        {/* Next Visit Resident Section - Only when shift is started */}
        {isShiftStarted && !isShiftCompleted && nextResident && (
          <View style={styles.nextVisitSection}>
            <Text className="text-lg font-bold text-foreground mb-2">
              Next Scheduled Care Visit
            </Text>
            <ResidentCard
              resident={nextResident}
              expanded={true}
              onPress={() =>
                router.push({
                  pathname: '/resident-details',
                  params: { id: nextResident.id },
                } as unknown as Href)
              }
            />
          </View>
        )}

        {isShiftStarted && !isShiftCompleted && (
          <ShiftResidentActivityCard
            activities={activities}
            loading={activityLoading}
            error={activityError}
            hasAssignedResidents={activeShiftResidents.length > 0}
            onRetry={() => void refreshActivities()}
          />
        )}
      </ScrollView>

      {/* End Shift Modal Dialog */}
      {shift && (
        <EndShiftModal
          visible={isEndShiftModalOpen}
          onClose={() => setIsEndShiftModalOpen(false)}
          onConfirmEndShift={handleEndShift}
          shiftName={shift.name}
          assignedResidents={assignedResidents}
          completedTasks={shift.tasksCompleted}
          totalTasks={shift.tasksTotal}
        />
      )}

      {/* Shift Details & Handover Information Modal */}
      <ShiftDetailsModal
        visible={isShiftDetailsModalOpen}
        onClose={() => setIsShiftDetailsModalOpen(false)}
        initialTab={shiftDetailsInitialTab}
        shiftName={shift?.name || 'My Shift'}
        wardName={shift?.wardName || ''}
        isShiftStarted={isShiftStarted}
        isCompleted={isShiftCompleted}
        scheduledStartTime={shift?.startTime}
        actualStartedTime={shift?.actualStartedTime}
        scheduledEndTime={shift?.endTime}
        timeRemainingStr={shift?.timeRemainingStr}
        nextShiftName={shift?.nextShiftName}
        nextShiftStartTime={shift?.nextShiftStartTime}
        nextShiftHandoverPerson={shift?.nextShiftHandoverPerson}
        incidentCount={shift?.incidentCount ?? 0}
        assignedResidents={activeShiftResidents}
        completedTasks={shift?.tasksCompleted}
        totalTasks={shift?.tasksTotal}
        shiftInstructions={shift?.shiftNotes}
        handoverNoteSnippet={shift?.previousShiftHandover?.handoverNotes}
        isEligible={eligibility.isEligible}
        clockInOpensAt={eligibility.eligibleAtStr}
        onStartShift={() => {
          setIsShiftDetailsModalOpen(false);
          void handleStartShift();
        }}
        onEndShift={() => {
          setIsShiftDetailsModalOpen(false);
          setIsEndShiftModalOpen(true);
        }}
        onEnterHandoverNote={() => {
          setIsShiftDetailsModalOpen(false);
          router.push('/handover' as Href);
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 12,
  },
  nextVisitSection: {
    marginTop: 4,
  },
});
