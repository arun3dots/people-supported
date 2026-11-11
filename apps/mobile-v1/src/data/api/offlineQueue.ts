import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiName } from '@repo/endpoints';
import { makeMobileApiCall } from './client';
import { safeLogger } from '../security/safeLogger';
import {
  encryptedGetItem,
  encryptedSetItem,
  encryptedRemoveItem,
} from '../security/encryptedStorage';
import { getSessionUser } from '../security/secureStorage';
import type { User } from '../../domain/entities/User';

export interface QueuedMutation {
  id: string;
  apiName: ApiName;
  payload: unknown;
  substitutions?: Record<string, string | number>;
  createdAt: string;
  retryCount: number;
  userId?: string;
  tenantId?: string | null;
}

const OFFLINE_QUEUE_KEY = 'carehome_v1_offline_queue';

export async function getOfflineQueue(): Promise<QueuedMutation[]> {
  try {
    let raw = await encryptedGetItem(OFFLINE_QUEUE_KEY);
    // Backward compatibility: migrate legacy queue from SecureStore if present
    if (!raw && Platform.OS !== 'web') {
      try {
        const legacy = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
        if (legacy) {
          raw = legacy;
          await encryptedSetItem(OFFLINE_QUEUE_KEY, legacy);
          await SecureStore.deleteItemAsync(OFFLINE_QUEUE_KEY).catch(() => {});
        }
      } catch {
        // Ignore legacy SecureStore read errors
      }
    }
    if (!raw) return [];
    return JSON.parse(raw) as QueuedMutation[];
  } catch (err) {
    safeLogger.error('Failed to read encrypted offline queue', err);
    return [];
  }
}

export async function enqueueMutation(
  apiName: ApiName,
  payload: unknown,
  substitutions?: Record<string, string | number>
): Promise<QueuedMutation> {
  const queue = await getOfflineQueue();
  const sessionUser = await getSessionUser<User>();

  const newItem: QueuedMutation = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    apiName,
    payload,
    substitutions,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    userId: sessionUser?.id,
    tenantId: sessionUser?.tenantId,
  };

  queue.push(newItem);
  await encryptedSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  safeLogger.info(`Queued offline mutation [${newItem.id}] for ${apiName}`);
  return newItem;
}

export async function clearOfflineQueue(): Promise<void> {
  await encryptedRemoveItem(OFFLINE_QUEUE_KEY);
}

export async function processOfflineQueue(): Promise<{
  succeeded: number;
  failed: number;
  remaining: number;
}> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return { succeeded: 0, failed: 0, remaining: 0 };
  }

  const sessionUser = await getSessionUser<User>();
  const currentUserId = sessionUser?.id;
  const currentTenantId = sessionUser?.tenantId;

  const remainingQueue: QueuedMutation[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    // Shared shift tablet safety (GDPR Art. 5(1)(f) & Caldicott Principle 4):
    // Do not sync mutations authored by another user or tenant under current credentials
    const isTenantMismatch = Boolean(item.tenantId && currentTenantId && item.tenantId !== currentTenantId);
    const isUserMismatch = Boolean(item.userId && currentUserId && item.userId !== currentUserId);
    const isUnauthenticatedForUserItem = Boolean(item.userId && !currentUserId);

    if (isTenantMismatch || isUserMismatch || isUnauthenticatedForUserItem) {
      remainingQueue.push(item);
      continue;
    }

    try {
      await makeMobileApiCall(item.apiName, item.payload, undefined, item.substitutions);
      succeeded++;
      safeLogger.info(`Synced offline mutation [${item.id}] for ${item.apiName}`);
    } catch (err) {
      failed++;
      safeLogger.warn(`Failed to sync offline mutation [${item.id}]`, err);
      // Retain with incremented retry count if under 5 attempts
      if (item.retryCount < 5) {
        remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }
  }

  await encryptedSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  return { succeeded, failed, remaining: remainingQueue.length };
}
