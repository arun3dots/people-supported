import React from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Wifi, RefreshCw, ShieldCheck, KeyRound, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/text';
import { useAuth } from '../../presentation/context/AuthContext';
import { useOfflineSync } from '../../presentation/context/OfflineSyncContext';
import { useBiometricLock } from '../../presentation/context/BiometricLockContext';

export function SettingsClinicalComplianceCard() {
  const router = useRouter();
  const { logout } = useAuth();
  const { pendingCount, isSyncing, lastSyncTime, syncNow } = useOfflineSync();
  const { lockNow } = useBiometricLock();

  const handleSyncPress = async () => {
    try {
      const res = await syncNow();
      Alert.alert(
        'Sync Complete',
        `Synchronized ${res.succeeded} queued clinical records. (${res.failed} failed)`
      );
    } catch {
      Alert.alert('Sync Failed', 'Could not sync offline records. Please check connection.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'End Shift',
      'Are you sure you want to end your clinical shift and sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-text-primary mb-2.5">
        Clinical & DSPT Compliance
      </Text>

      {/* Offline Queue Status Card */}
      <View className="bg-surface rounded-2xl p-4 mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
              <Wifi size={16} color="#059669" />
            </View>
            <View>
              <Text className="text-sm font-bold text-text-primary">Offline Queue</Text>
              <Text className="text-xs text-text-muted">
                {lastSyncTime ? `Last synced ${lastSyncTime}` : 'Encrypted on-device'}
              </Text>
            </View>
          </View>
          <View className="rounded-full bg-white px-3 py-1">
            <Text className="text-xs font-bold text-text-primary">
              {pendingCount} Pending
            </Text>
          </View>
        </View>

        <Text className="text-xs text-text-secondary mb-3 leading-relaxed">
          Records created in Wi-Fi dead-zones are safely stored in local encrypted storage and synchronized when connectivity returns.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSyncPress}
          disabled={isSyncing}
          className="bg-white rounded-full py-2.5 px-4 flex-row items-center justify-center gap-2"
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#4A706A" />
          ) : (
            <RefreshCw size={14} color="#4A706A" />
          )}
          <Text className="text-xs font-semibold text-primary">
            {isSyncing ? 'Synchronizing...' : 'Sync Offline Records Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DSPT Security Actions Card */}
      <View className="bg-surface rounded-2xl p-4">
        <View className="flex-row items-center gap-2.5 mb-3">
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            <ShieldCheck size={16} color="#4A706A" />
          </View>
          <View>
            <Text className="text-sm font-bold text-text-primary">Security Controls</Text>
            <Text className="text-xs text-text-muted">DSPT Caldicott Guardian safeguards</Text>
          </View>
        </View>

        <View className="gap-2.5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={lockNow}
            className="bg-white rounded-full py-2.5 px-4 flex-row items-center justify-center gap-2"
          >
            <KeyRound size={15} color="#4A706A" />
            <Text className="text-xs font-semibold text-text-primary">
              Lock Screen Immediately
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            className="bg-clinical-criticalBg rounded-full py-2.5 px-4 flex-row items-center justify-center gap-2"
          >
            <LogOut size={15} color="#FF3B2F" />
            <Text className="text-xs font-bold text-clinical-critical">
              End Clinical Shift & Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
