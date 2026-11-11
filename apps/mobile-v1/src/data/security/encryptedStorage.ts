import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  AESEncryptionKey,
  AESSealedData,
  aesEncryptAsync,
  aesDecryptAsync,
  AESKeySize,
} from 'expo-crypto';
import { safeLogger } from './safeLogger';

const MASTER_KEY_STORAGE_KEY = 'carehome_v1_storage_master_key';
const ENCRYPTED_PREFIX = '__ENC_V1__:';

let cachedKey: AESEncryptionKey | null = null;
let masterKeyPromise: Promise<AESEncryptionKey> | null = null;

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/**
 * Converts a UTF-8 string to base64.
 * Uses TextEncoder and standard base64 encoding safe across React Native Hermes and Web.
 */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 string back to a UTF-8 string.
 */
function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Retrieves the hardware-secured AES-256 master key from SecureStore (Android Keystore / iOS Keychain),
 * or generates a new one on first run and persists it securely.
 * Protected by a Promise mutex to eliminate async race conditions on cold start.
 */
export async function getOrCreateMasterKey(): Promise<AESEncryptionKey> {
  if (cachedKey) {
    return cachedKey;
  }

  if (masterKeyPromise) {
    return masterKeyPromise;
  }

  masterKeyPromise = (async () => {
    let base64Key: string | null = null;
    if (Platform.OS === 'web') {
      base64Key = await AsyncStorage.getItem(MASTER_KEY_STORAGE_KEY);
    } else {
      try {
        base64Key = await SecureStore.getItemAsync(MASTER_KEY_STORAGE_KEY, SECURE_STORE_OPTIONS);
      } catch (err) {
        safeLogger.warn('SecureStore master key read warning', err);
      }
    }

    if (base64Key) {
      try {
        cachedKey = (await AESEncryptionKey.import(base64Key, 'base64')) as AESEncryptionKey;
        return cachedKey;
      } catch (err) {
        // GDPR Art. 32(1)(c) Compliance:
        // NEVER overwrite or regenerate the key on import failure! Overwriting the master key
        // permanently destroys access to all previously encrypted clinical records on the device.
        safeLogger.error('Failed to import existing master key. Halting to safeguard existing data.', err);
        throw new Error('Master key corrupted or inaccessible in secure storage');
      }
    }

    // Generate a hardware-quality 256-bit AES key
    const newKey = (await AESEncryptionKey.generate(AESKeySize.AES256)) as AESEncryptionKey;
    const exportedBase64 = await newKey.encoded('base64');

    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(MASTER_KEY_STORAGE_KEY, exportedBase64);
    } else {
      await SecureStore.setItemAsync(MASTER_KEY_STORAGE_KEY, exportedBase64, SECURE_STORE_OPTIONS);
    }

    cachedKey = newKey;
    return cachedKey;
  })()
    .catch((err: unknown) => {
      // Reset the mutex on failure so subsequent attempts can retry cleanly
      masterKeyPromise = null;
      throw err;
    });

  return masterKeyPromise;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output is formatted as "__ENC_V1__:<combined_base64_data>".
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = await getOrCreateMasterKey();
    const base64Input = toBase64(plaintext);
    const sealed = await aesEncryptAsync(base64Input, key);
    const combinedBase64 = (await sealed.combined('base64')) as string;
    return `${ENCRYPTED_PREFIX}${combinedBase64}`;
  } catch (err) {
    safeLogger.error('AES-256-GCM encryption failed', err);
    throw new Error('Failed to encrypt sensitive clinical data');
  }
}

/**
 * Decrypts a stored string.
 * If the string does not start with "__ENC_V1__:", it returns the raw string directly
 * to provide seamless backward-compatibility and migration for existing unencrypted data.
 */
export async function decryptData(storedValue: string): Promise<string> {
  if (!storedValue.startsWith(ENCRYPTED_PREFIX)) {
    // Unencrypted legacy value
    return storedValue;
  }

  try {
    const key = await getOrCreateMasterKey();
    const combinedBase64 = storedValue.substring(ENCRYPTED_PREFIX.length);
    const sealedData = AESSealedData.fromCombined(combinedBase64);
    const decryptedBase64 = (await aesDecryptAsync(sealedData, key, { output: 'base64' })) as string;
    return fromBase64(decryptedBase64);
  } catch (err) {
    safeLogger.error('AES-256-GCM decryption failed', err);
    throw new Error('Failed to decrypt sensitive clinical data');
  }
}

/**
 * Encrypted setItem for AsyncStorage: Encrypts data with AES-256-GCM before writing to disk.
 */
export async function encryptedSetItem(key: string, value: string): Promise<void> {
  const encrypted = await encryptData(value);
  await AsyncStorage.setItem(key, encrypted);
}

/**
 * Encrypted getItem for AsyncStorage: Reads and decrypts AES-256-GCM ciphertext.
 * Seamlessly handles legacy plaintext values if present.
 */
export async function encryptedGetItem(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return decryptData(raw);
}

/**
 * Removes an encrypted key from AsyncStorage.
 */
export async function encryptedRemoveItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * Resets cached in-memory key state (useful for test suites).
 */
export function clearMasterKeyCacheForTesting(): void {
  cachedKey = null;
  masterKeyPromise = null;
}
