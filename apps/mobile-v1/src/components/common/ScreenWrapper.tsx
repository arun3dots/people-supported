import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, RefreshCw, X } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useOfflineSync } from '../../presentation/context/OfflineSyncContext';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  className?: string;
  disablePadding?: boolean;
  withTopInset?: boolean;
  refreshControl?: React.ReactElement;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  contentContainerStyle,
  className,
  disablePadding = false,
  withTopInset = false,
  refreshControl,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const { pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [isDismissed, setIsDismissed] = useState(false);

  // Re-show banner if new pending entries are queued
  useEffect(() => {
    if (pendingCount > 0) {
      setIsDismissed(false);
    }
  }, [pendingCount]);

  return (
    <View
      className={`flex-1 bg-background ${className || ''}`}
      style={{
        paddingTop: withTopInset ? insets.top : 0,
      }}
    >
      {/* Offline Dead-Zone Pending Sync Notification Banner */}
      {pendingCount > 0 && !isDismissed && (
        <View className="flex-row items-center justify-between bg-amber-50 border-b border-amber-200 px-3.5 py-2 shrink-0 z-20">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <WifiOff size={15} color="#b45309" />
            <Text className="text-xs font-semibold text-amber-900 flex-1" numberOfLines={1}>
              {pendingCount} offline clinical {pendingCount === 1 ? 'entry' : 'entries'} queued
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {isSyncing ? (
              <View className="flex-row items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-md">
                <RefreshCw size={11} color="#b45309" className="animate-spin" />
                <Text className="text-xs text-amber-900 font-medium">Syncing...</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => void syncNow()}
                className="bg-amber-600 px-2.5 py-0.5 rounded-md"
                accessibilityRole="button"
                accessibilityLabel="Sync offline records now"
              >
                <Text className="text-xs text-white font-bold">Sync</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDismissed(true)}
              className="w-5 h-5 items-center justify-center rounded-full bg-amber-100"
              accessibilityRole="button"
              accessibilityLabel="Dismiss offline notification"
            >
              <X size={12} color="#b45309" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              {
                paddingBottom: insets.bottom + 80,
                paddingHorizontal: disablePadding ? 0 : 16,
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            className={`flex-1 ${disablePadding ? '' : 'px-4'}`}
            style={[
              { paddingBottom: disablePadding ? 0 : insets.bottom + 16 },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
