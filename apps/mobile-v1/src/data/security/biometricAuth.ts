import * as LocalAuthentication from 'expo-local-authentication';
import { safeLogger } from './safeLogger';

export async function isBiometricSupported(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    return hasHardware;
  } catch (err) {
    safeLogger.error('Biometric hardware check error', err);
    return false;
  }
}

export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch (err) {
    safeLogger.error('Biometric enrollment check error', err);
    return false;
  }
}

export async function getSupportedBiometricTypes(): Promise<string[]> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const result: string[] = [];
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      result.push('Face ID');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      result.push('Fingerprint');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      result.push('Iris');
    }
    return result;
  } catch {
    return [];
  }
}

export async function authenticateWithBiometrics(
  promptMessage = 'Unlock with your device password or biometrics'
): Promise<boolean> {
  try {
    const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
    // If the device has no lock screen (no PIN, pattern, password, or biometrics) configured,
    // allow immediate unlock so the user is never trapped.
    if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (err) {
    safeLogger.error('Device authentication error', err);
    return false;
  }
}
