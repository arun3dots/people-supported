import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle2,
  BellRing,
  CheckCheck,
} from 'lucide-react-native';
import { ScreenWrapper } from '../../src/components/common/ScreenWrapper';
import { Text } from '../../src/components/ui/text';
import {
  useNotifications,
  type MobileNotificationItem,
} from '../../src/presentation/hooks/useNotifications';
import { NotificationCard } from '../../src/components/common/NotificationCard';
import { notificationDestination } from '../../src/lib/notificationDestination';

export type AlertFilter = 'all' | 'unread' | 'urgent';

export default function AlertsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    urgentCount,
    loading,
    refreshing,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter === 'urgent') {
      return item.priority === 'Urgent' || item.priority === 'High';
    }
    return true;
  });

  const handleTakeAction = (item: MobileNotificationItem) => {
    // Automatically mark notification as read upon taking action
    if (!item.isRead) {
      void markAsRead(item.id);
    }

    router.navigate(notificationDestination(item));
  };

  return (
    <ScreenWrapper scrollable={false} disablePadding>
      {/* 1. Header Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/' as Href))}
            activeOpacity={0.7}
            className="w-9 h-9 items-center justify-center -ml-1 rounded-full bg-surface"
          >
            <ChevronLeft size={22} color="#141F1E" strokeWidth={2.4} />
          </TouchableOpacity>

          <View>
            <Text className="text-xl font-bold text-text-primary">Notifications</Text>
            <Text className="text-xs text-text-secondary">
              {loading ? 'Loading notifications...' : error ? 'Notifications unavailable' : unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications up to date'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => void markAllAsRead()}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-clinical-safeBg"
          >
            <CheckCheck size={14} color="#059669" />
            <Text className="text-xs font-bold text-clinical-safe">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Filter Tabs */}
      <View className="px-4 py-2 bg-white">
        <View className="flex-row items-center gap-1 bg-surface p-1 rounded-full self-start">
          {([
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread' },
            { key: 'urgent', label: urgentCount > 0 ? `Critical (${urgentCount})` : 'Critical' },
          ] as const).map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.8}
                className={`px-3.5 py-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}
              >
                <Text
                  className={`text-xs ${
                    isActive ? 'text-white font-bold' : 'text-text-secondary font-medium'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Notification Cards List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshNotifications();
            }}
            colors={['#4A706A']}
            tintColor="#4A706A"
          />
        }
      >
        {loading && !refreshing && (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#4A706A" />
            <Text className="text-xs text-text-secondary font-medium mt-3">
              Loading notifications...
            </Text>
          </View>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <View className="py-16 px-6 items-center justify-center bg-surface rounded-2xl my-4">
            <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-3">
              {activeFilter === 'unread' ? (
                <CheckCircle2 size={32} color="#4A706A" />
              ) : (
                <BellRing size={32} color="#4A706A" />
              )}
            </View>
            <Text className="text-base font-bold text-text-primary text-center">
              {activeFilter === 'unread'
                ? 'All Caught Up!'
                : activeFilter === 'urgent'
                  ? 'No Critical Alerts'
                  : 'No Notifications Yet'}
            </Text>
            <Text className="text-xs text-text-secondary text-center mt-1.5 max-w-[260px] leading-relaxed">
              {activeFilter === 'unread'
                ? 'You have addressed all urgent clinical and task notifications.'
                : activeFilter === 'urgent'
                  ? 'There are currently no overdue tasks, vital signs escalations, or emergency alerts.'
                  : 'Task reminders, medication alerts, and handover updates will appear here in real time.'}
            </Text>
          </View>
        )}

        {error && <View className="p-5 gap-3">
          <Text className="text-base font-bold text-foreground">Unable to load notifications</Text>
          <Text className="text-base text-muted-foreground">{error}</Text>
          <TouchableOpacity onPress={() => { void refreshNotifications(); }}>
            <Text className="text-base font-bold text-primary">Retry</Text>
          </TouchableOpacity>
        </View>}

        {filteredNotifications.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onTakeAction={handleTakeAction}
            onMarkAsRead={(id) => void markAsRead(id)}
          />
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}
