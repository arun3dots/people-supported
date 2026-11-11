import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  TriangleAlert,
  ClipboardCheck,
  Pill,
  ShieldAlert,
  Bell,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { theme } from '../../theme';
import type { MobileNotificationItem } from '../../presentation/hooks/useNotifications';

export interface NotificationCardProps {
  item: MobileNotificationItem;
  onTakeAction: (item: MobileNotificationItem) => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationCard({
  item,
  onTakeAction,
  onMarkAsRead,
}: NotificationCardProps) {
  const isUrgent = item.priority === 'Urgent' || item.priority === 'High';
  const categoryUpper = item.category?.toUpperCase() || 'SYSTEM';

  return (
    <View
      className={`rounded-2xl p-4 mb-3 ${
        !item.isRead ? 'bg-primary-light' : 'bg-surface'
      }`}
    >
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
            {categoryUpper === 'MEDICATION' ? (
              <Pill size={19} color="#175CD3" />
            ) : categoryUpper === 'TASK' ? (
              <ClipboardCheck size={19} color="#059669" />
            ) : categoryUpper === 'CLINICAL' ? (
              <TriangleAlert size={19} color="#FF3B2F" />
            ) : categoryUpper === 'INCIDENT' ? (
              <ShieldAlert size={19} color="#D97706" />
            ) : (
              <Bell size={19} color="#4A706A" />
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              {/* Category Pill */}
              <View className="bg-white px-2.5 py-0.5 rounded-full">
                <Text className="text-xs font-bold text-text-secondary tracking-wider">
                  {categoryUpper}
                </Text>
              </View>

              {/* Priority Pill */}
              <View
                className={`px-2.5 py-0.5 rounded-full ${
                  isUrgent
                    ? 'bg-clinical-criticalBg'
                    : item.priority === 'Medium'
                      ? 'bg-clinical-warningBg'
                      : 'bg-white'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isUrgent
                      ? 'text-clinical-critical'
                      : item.priority === 'Medium'
                        ? 'text-clinical-warning'
                        : 'text-text-secondary'
                  }`}
                >
                  {item.priority || 'Normal'}
                </Text>
              </View>

              {/* Unread Indicator */}
              {!item.isRead && (
                <View className="w-2 h-2 rounded-full bg-primary ml-0.5" />
              )}
            </View>

            <Text className="text-xs text-text-muted mt-1 font-medium">
              {item.formattedTime}
            </Text>
          </View>
        </View>

        {/* Dismiss / Mark Read Icon Button */}
        {!item.isRead && (
          <TouchableOpacity
            onPress={() => onMarkAsRead(item.id)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 bg-white px-2.5 py-1 rounded-full"
          >
            <Check size={13} color="#4A706A" />
            <Text className="text-xs font-semibold text-primary">Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Title & Body */}
      <Text className="text-base font-bold text-text-primary leading-snug">
        {item.title}
      </Text>
      <Text className="text-sm text-text-secondary mt-1 leading-relaxed">
        {item.message}
      </Text>

      {/* Action CTA */}
      <View className="flex-row items-center justify-end mt-3 pt-2.5 border-t border-slate-200/70">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          rightIcon={
            <ArrowRight
              size={14}
              color={theme.colors.primary.DEFAULT}
              strokeWidth={2.2}
            />
          }
          onPress={() => onTakeAction(item)}
        >
          Take Action
        </Button>
      </View>
    </View>
  );
}

