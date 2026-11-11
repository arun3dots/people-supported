import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { REGISTER_DEVICE_TOKEN } from '@repo/endpoints';
import type { RegisterDeviceTokenDTO } from '@repo/schema';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { getSecureItem, setSecureItem } from '../../data/security/secureStorage';
import { useAuth } from '../context/AuthContext';

const DEVICE_TOKEN_KEY = 'carehome_v1_device_token';

/**
 * Ensures the device is registered with the backend notification service
 * upon authentication, allowing push/critical alerts to be routed to this device.
 */
export function useDeviceTokenRegistration(): void {
  const { user } = useAuth();
  const registeredUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      registeredUserRef.current = null;
      return;
    }

    if (registeredUserRef.current === user.id) {
      return;
    }

    let isMounted = true;

    async function registerDevice() {
      try {
        let token = await getSecureItem(DEVICE_TOKEN_KEY);
        if (!token) {
          token = `mobile_${Platform.OS}_${Crypto.randomUUID()}`;
          await setSecureItem(DEVICE_TOKEN_KEY, token);
        }

        const platform: RegisterDeviceTokenDTO['platform'] =
          Platform.OS === 'ios'
            ? 'ios'
            : Platform.OS === 'android'
              ? 'android'
              : 'expo';

        const deviceName =
          Constants.deviceName ||
          `${Platform.OS === 'ios' ? 'iOS' : 'Android'} Device (${Constants.expoConfig?.version || '1.0'})`;

        const payload: RegisterDeviceTokenDTO = {
          token,
          platform,
          deviceName,
        };

        await makeMobileApiCall(REGISTER_DEVICE_TOKEN, payload);

        if (isMounted) {
          registeredUserRef.current = user?.id ?? null;
          safeLogger.info(`Device registered for user ${user?.id} (${platform})`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        safeLogger.warn('Failed to register device token with backend', message);
      }
    }

    registerDevice();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);
}
