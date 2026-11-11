import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { encrypt, decrypt } from '@repo/db';
import { AuditEvent } from './audit.types';

const REDIS_DEAD_LETTER_KEY = 'cqc:audit:dead-letter:v1';
const MAX_IN_MEMORY_FALLBACK = 500;

interface DeadLetterEnvelope {
  timestamp: string;
  error: string;
  event: AuditEvent;
}

let redisClient: Redis | null = null;
const inMemoryEncryptedBuffer: string[] = [];

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  if (!redisUrl && !redisHost) return null;

  try {
    redisClient = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        })
      : new Redis({
          host: redisHost || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });
    redisClient.on('error', () => {
      // Suppress unhandled error events; callers fall back to encrypted memory buffer
    });
    return redisClient;
  } catch {
    return null;
  }
}

/**
 * Stores failed audit events in an AES-256-GCM encrypted Redis queue (or
 * bounded encrypted memory buffer if Redis is unreachable) for automatic
 * replay into the tamper-evident hash chain.
 *
 * Satisfies C-03 & E-18: Never writes plaintext personal data to disk/repo.
 */
export async function writeDeadLetterLog(
  event: AuditEvent,
  error: Error,
  logger?: Logger,
): Promise<void> {
  const envelope: DeadLetterEnvelope = {
    timestamp: new Date().toISOString(),
    error: error.message,
    event,
  };

  try {
    const serialized = JSON.stringify(envelope);
    const ciphertext = encrypt(serialized);
    if (!ciphertext) return;

    const client = getRedisClient();
    if (client) {
      try {
        await client.rpush(REDIS_DEAD_LETTER_KEY, ciphertext);
        return;
      } catch {
        // Fall through to in-memory encrypted buffer
      }
    }

    if (inMemoryEncryptedBuffer.length >= MAX_IN_MEMORY_FALLBACK) {
      inMemoryEncryptedBuffer.shift();
    }
    inMemoryEncryptedBuffer.push(ciphertext);
  } catch (err: unknown) {
    logger?.error(
      `Failed to enqueue encrypted audit dead-letter event: ${(err as Error).message}`,
    );
  }
}

/**
 * Drains and decrypts queued dead-letter audit events and replays them into
 * the HMAC hash chain via the supplied callback.
 */
export async function drainDeadLetterQueue(
  replayFn: (event: AuditEvent) => Promise<void>,
  logger?: Logger,
): Promise<number> {
  let replayed = 0;

  // 1. Drain in-memory encrypted buffer first
  const memoryBatch = inMemoryEncryptedBuffer.splice(
    0,
    inMemoryEncryptedBuffer.length,
  );
  for (const ciphertext of memoryBatch) {
    const ok = await replaySingleCiphertext(ciphertext, replayFn, logger);
    if (ok) {
      replayed++;
    } else {
      inMemoryEncryptedBuffer.push(ciphertext);
    }
  }

  // 2. Drain Redis encrypted list if available
  const client = getRedisClient();
  if (client) {
    for (let i = 0; i < 100; i++) {
      let ciphertext: string | null = null;
      try {
        ciphertext = await client.lpop(REDIS_DEAD_LETTER_KEY);
      } catch {
        break;
      }
      if (!ciphertext) break;

      const ok = await replaySingleCiphertext(ciphertext, replayFn, logger);
      if (ok) {
        replayed++;
      } else {
        try {
          await client.rpush(REDIS_DEAD_LETTER_KEY, ciphertext);
        } catch {
          inMemoryEncryptedBuffer.push(ciphertext);
        }
        break;
      }
    }
  }

  return replayed;
}

async function replaySingleCiphertext(
  ciphertext: string,
  replayFn: (event: AuditEvent) => Promise<void>,
  logger?: Logger,
): Promise<boolean> {
  try {
    const plaintext = decrypt(ciphertext);
    if (!plaintext) return false;
    const parsed = JSON.parse(plaintext) as DeadLetterEnvelope;
    await replayFn(parsed.event);
    return true;
  } catch (err: unknown) {
    logger?.warn(
      `Dead-letter replay attempt failed (will retry): ${(err as Error).message}`,
    );
    return false;
  }
}
