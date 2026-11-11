import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { safeLogger } from './safeLogger';

const ACCESS_TOKEN_KEY = 'carehome_v1_access_token';
const REFRESH_TOKEN_KEY = 'carehome_v1_refresh_token';
const QUICK_PIN_HASH_KEY = 'carehome_v1_quick_pin_hash';
const BIOMETRIC_ENABLED_KEY = 'carehome_v1_biometric_enabled';
const USER_SESSION_DATA_KEY = 'carehome_v1_user_session';

let inMemoryAccessToken: string | null = null;

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Platform-resilient storage wrapper.
 * On Native (iOS/Android): uses SecureStore (Keychain/Keystore) for hardware encryption.
 * Bound to the physical device with AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY per NHS DSPT / GDPR.
 * On Web: uses AsyncStorage (localStorage) as SecureStore is native-only.
 */
async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
}

export { storageGet as getSecureItem, storageSet as setSecureItem, storageDelete as deleteSecureItem };

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  inMemoryAccessToken = accessToken;
  await storageSet(ACCESS_TOKEN_KEY, accessToken);
  await storageSet(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const token = await storageGet(ACCESS_TOKEN_KEY);
  if (token) inMemoryAccessToken = token;
  return token;
}

export function getAccessTokenSync(): string | null {
  return inMemoryAccessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  return storageGet(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  inMemoryAccessToken = null;
  await storageDelete(ACCESS_TOKEN_KEY);
  await storageDelete(REFRESH_TOKEN_KEY);
  await storageDelete(USER_SESSION_DATA_KEY);
}

export async function saveSessionUser<T>(user: T): Promise<void> {
  try {
    await storageSet(USER_SESSION_DATA_KEY, JSON.stringify(user));
  } catch (err) {
    safeLogger.error('Failed to save session user', err);
  }
}

export async function getSessionUser<T>(): Promise<T | null> {
  try {
    const raw = await storageGet(USER_SESSION_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Saves SHA-256 hash of a 4-digit quick unlock PIN.
 * DSPT rule: Never store raw PINs in plaintext.
 */
export async function saveQuickPin(pin: string): Promise<void> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `carehome_salt_${pin}`
  );
  await storageSet(QUICK_PIN_HASH_KEY, hash);
}

export async function verifyQuickPin(pin: string): Promise<boolean> {
  const storedHash = await storageGet(QUICK_PIN_HASH_KEY);
  if (!storedHash) return false;
  const testHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `carehome_salt_${pin}`
  );
  return storedHash === testHash;
}

export async function hasQuickPin(): Promise<boolean> {
  const stored = await storageGet(QUICK_PIN_HASH_KEY);
  return !!stored;
}

export async function clearQuickPin(): Promise<void> {
  await storageDelete(QUICK_PIN_HASH_KEY);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await storageSet(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await storageGet(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}
