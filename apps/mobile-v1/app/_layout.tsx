import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import {
  ActivityIndicator,
  View,
  AppState,
  type AppStateStatus,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '../src/presentation/context/AuthContext';
import {
  BiometricLockProvider,
  useBiometricLock,
} from '../src/presentation/context/BiometricLockContext';
import { OfflineSyncProvider } from '../src/presentation/context/OfflineSyncContext';
import { InactivityLockModal } from '../src/components/clinical/InactivityLockModal';
import { OTAUpdateModal } from '../src/presentation/components/common';
import { WebAlertProvider } from '../src/presentation/components/common/WebAlertProvider';
import { queryClient } from '../src/data/api/queryClient';
import { theme } from '../src/theme';
import '../global.css';

// 1. Connect TanStack Query to NetInfo for automatic online/offline state handling
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

export { queryClient };

function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (loading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    const timer = setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        router.replace('/(protected)');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [user, loading, segments, router, rootNavigationState?.key]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('dark-content', true);
    }
  }, [segments]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('dark-content', true);
    }
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
      if (Platform.OS === 'android' && status === 'active') {
        RNStatusBar.setBarStyle('dark-content', true);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <View className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-background z-50">
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
        </View>
      )}
      <InactivityLockModal />
      <OTAUpdateModal />
      <PortalHost />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BiometricLockProvider>
          <OfflineSyncProvider>
            <WebAlertProvider>
              <StatusBar style="dark" />
              <NavigationGuard />
            </WebAlertProvider>
          </OfflineSyncProvider>
        </BiometricLockProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
