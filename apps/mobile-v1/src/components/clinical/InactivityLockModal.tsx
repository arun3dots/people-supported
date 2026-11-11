import React, { useState, useEffect, useCallback } from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, Fingerprint, LogOut } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useBiometricLock } from '../../presentation/context/BiometricLockContext';
import { useAuth } from '../../presentation/context/AuthContext';
import { theme } from '../../theme';

export function InactivityLockModal() {
  const { isLocked, unlockWithBiometrics, resetLock } = useBiometricLock();
  const { user, logout } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);

  const handleDeviceUnlock = useCallback(async () => {
    if (isPrompting) return;
    setIsPrompting(true);
    try {
      await unlockWithBiometrics();
    } finally {
      setIsPrompting(false);
    }
  }, [isPrompting, unlockWithBiometrics]);

  // Automatically trigger native device lock / biometric prompt when locked
  useEffect(() => {
    if (isLocked && user) {
      void handleDeviceUnlock();
    }
  }, [isLocked, user, handleDeviceUnlock]);

  if (!isLocked || !user) return null;

  const handleFallbackLogout = async () => {
    resetLock();
    await logout();
  };

  return (
    <Modal visible={isLocked} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-[#141F1E]/95 items-center justify-center px-6">
        <View className="w-full max-w-[340px] bg-white rounded-3xl p-6 items-center">
          <View className="h-16 w-16 rounded-full bg-primary-light items-center justify-center mb-4">
            <ShieldCheck size={32} color={theme.colors.primary.DEFAULT} strokeWidth={2.2} />
          </View>

          <Text className="text-xl font-bold text-foreground text-center mb-1">
            Verify Device Identity
          </Text>
          <Text className="text-xs text-muted-foreground text-center leading-5 mb-6">
            Welcome back, {user.fullName || 'Staff Member'}. Use your device password, PIN, or biometrics to continue your session without signing in again.
          </Text>

          <TouchableOpacity
            onPress={() => void handleDeviceUnlock()}
            disabled={isPrompting}
            activeOpacity={0.85}
            className="w-full h-13 py-3.5 rounded-full bg-primary flex-row items-center justify-center gap-2.5 mb-3"
          >
            {isPrompting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Fingerprint size={20} color="#FFFFFF" />
            )}
            <Text className="text-sm font-bold text-white">
              {isPrompting ? 'Verifying...' : 'Unlock with Device Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => void handleFallbackLogout()}
            activeOpacity={0.7}
            className="flex-row items-center justify-center gap-1.5 py-2.5 px-4"
          >
            <LogOut size={15} color={theme.colors.muted.foreground} />
            <Text className="text-xs font-semibold text-muted-foreground">
              Switch Account / Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
