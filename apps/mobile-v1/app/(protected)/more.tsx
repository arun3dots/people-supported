import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  History,
  TriangleAlert,
  ClipboardCheck,
  Pill,
  HeartPulse,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenWrapper, Text, Avatar } from '../../src/presentation/components/common';
import { Badge } from '../../src/components/ui/badge';
import { ShiftDetailsModal } from '../../src/components/dashboard/ShiftDetailsModal';
import { useAuth } from '../../src/presentation/context/AuthContext';
import { useShiftDashboard } from '../../src/presentation/hooks/useShiftDashboard';
import { useClockInEligibility } from '../../src/presentation/hooks/useClockInEligibility';
import { theme } from '../../src/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    shift,
    assignedResidents,
    isShiftStarted,
    isShiftCompleted,
    startShift,
  } = useShiftDashboard();
  const eligibility = useClockInEligibility(shift);
  const [isShiftDetailsOpen, setIsShiftDetailsOpen] = useState(false);

  const userAvatarUrl =
    user?.avatarUrl ||
    user?.profilePhotoUrl ||
    user?.profilePicture ||
    user?.photoUrl ||
    null;

  const navigateTo = (route: string) => {
    router.navigate(route as unknown as Parameters<typeof router.navigate>[0]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

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

  const menuItems = [
    {
      id: 'shift',
      title: 'My Shift',
      subtitle: 'Weekly rota & shift progress',
      icon: History,
      iconBg: '#F5F8F7',
      iconColor: theme.colors.primary.DEFAULT,
      onPress: () => setIsShiftDetailsOpen(true),
    },
    // {
    //   id: 'news2',
    //   title: 'NEWS2 Vitals',
    //   subtitle: 'Vital signs & escalation',
    //   icon: HeartPulse,
    //   iconBg: '#FEE4E2',
    //   iconColor: '#D92D20',
    //   badge: 'URGENT',
    //   onPress: () => navigateTo('/news2'),
    // },
    {
      id: 'mar',
      title: 'eMAR Medication',
      subtitle: 'Medication administration',
      icon: Pill,
      iconBg: '#EFF8FF',
      iconColor: '#175CD3',
      onPress: () => navigateTo('/mar'),
    },
    {
      id: 'handover',
      title: 'Handover',
      subtitle: 'Previous carers’ handover notes',
      icon: ClipboardCheck,
      iconBg: '#FAF8EE',
      iconColor: '#8A6E24',
      onPress: () => navigateTo('/previous-handover'),
    },
    {
      id: 'alerts',
      title: 'Clinical Alerts',
      subtitle: 'High risks & notifications',
      icon: TriangleAlert,
      iconBg: '#FEF3F2',
      iconColor: '#B42318',
      onPress: () => navigateTo('/alerts'),
    },
    {
      id: 'incidents',
      title: 'Report Incident',
      subtitle: 'Near-miss & fall reporting',
      icon: TriangleAlert,
      iconBg: '#FFF4ED',
      iconColor: '#B54708',
      onPress: () => navigateTo('/report-incident'),
    },
    {
      id: 'settings',
      title: 'App Settings',
      subtitle: 'Security & offline preferences',
      icon: Settings,
      iconBg: '#F8F9FA',
      iconColor: '#475467',
      onPress: () => navigateTo('/settings'),
    },
  ];

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <View className="pt-2 pb-3">
        <Text className="text-xl font-bold text-text-primary">More</Text>
        <Text className="text-sm text-text-secondary mt-0.5">Clinical tools & settings</Text>
      </View>

      {/* User Profile Summary */}
      <View className="bg-surface rounded-2xl p-4 flex-row items-center gap-3.5 mb-4">
        <Avatar
          name={user?.fullName || 'Care Staff'}
          imageUrl={userAvatarUrl}
          size="lg"
        />
        <View className="flex-1">
          <Text className="text-base font-bold text-text-primary" numberOfLines={1}>
            {user?.fullName || 'Care Staff'}
          </Text>
          <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
            {user?.email || 'staff@cantracare.com'}
          </Text>
          {user?.organizationName && (
            <Text className="text-xs font-medium text-text-primary mt-1" numberOfLines={1}>
              {user.organizationName}
            </Text>
          )}
          {user?.organizationContactName && (
            <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
              Contact: {user.organizationContactName}
            </Text>
          )}
          <View className="mt-1.5 self-start">
            <Badge variant="clinicalSafe" size="sm">
              {user?.roleName || 'Carer'}
            </Badge>
          </View>
        </View>
      </View>

      {/* Menu List */}
      <View className="bg-surface rounded-2xl mb-6 overflow-hidden divide-y divide-slate-200/70">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.7}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  style={{ backgroundColor: item.iconBg }}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                >
                  <Icon size={20} color={item.iconColor} strokeWidth={2.2} />
                </View>
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-text-primary">{item.title}</Text>
                    {/* {item.badge && (
                      <Badge variant="clinicalCritical" size="sm">
                        {item.badge}
                      </Badge>
                    )} */}
                  </View>
                  <Text className="text-xs text-text-secondary mt-0.5" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        className="w-full h-12 rounded-full bg-clinical-criticalBg flex-row items-center justify-center gap-2 mb-10"
      >
        <LogOut size={18} color="#FF3B2F" strokeWidth={2.2} />
        <Text className="text-sm font-bold text-clinical-critical">Sign Out</Text>
      </TouchableOpacity>

      <ShiftDetailsModal
        visible={isShiftDetailsOpen}
        onClose={() => setIsShiftDetailsOpen(false)}
        initialTab="weekly"
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
        assignedResidents={isShiftStarted && !isShiftCompleted ? assignedResidents : []}
        completedTasks={shift?.tasksCompleted}
        totalTasks={shift?.tasksTotal}
        shiftInstructions={shift?.shiftNotes}
        handoverNoteSnippet={shift?.previousShiftHandover?.handoverNotes}
        isEligible={eligibility.isEligible}
        clockInOpensAt={eligibility.eligibleAtStr}
        onStartShift={() => {
          setIsShiftDetailsOpen(false);
          void handleStartShift();
        }}
        onEndShift={() => {
          setIsShiftDetailsOpen(false);
          router.navigate('/handover' as Href);
        }}
        onEnterHandoverNote={() => {
          setIsShiftDetailsOpen(false);
          router.navigate('/handover' as Href);
        }}
      />
    </ScreenWrapper>
  );
}
