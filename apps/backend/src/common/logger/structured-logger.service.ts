import { Injectable, LoggerService } from '@nestjs/common';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'mfasecret',
  'apikey',
  'nhsnumber',
  'ninumber',
  'dbsnumber',
  'creditcard',
  'pan',
  'cvv',
  'sharecode',
]);

const NHS_REGEX = /\b\d{3}\s?\d{3}\s?\d{4}\b/g;
const NI_REGEX = /\b[A-Za-z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Za-z]{1}\b/g;
const JWT_REGEX =
  /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g;

/**
 * E-09 / Caldicott Principle 2 & 3:
 * Recursively deep-redacts sensitive keys and PII patterns from log payloads.
 */
export function redactPii(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .replace(JWT_REGEX, '[REDACTED_JWT]')
      .replace(NHS_REGEX, '[REDACTED_NHS]')
      .replace(NI_REGEX, '[REDACTED_NI]');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactPii(val);
      }
    }
    return sanitized;
  }

  return value;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private formatLog(
    level: string,
    message: unknown,
    context?: string,
    meta?: unknown,
  ): string {
    const timestamp = new Date().toISOString();
    const cleanMessage = redactPii(message);
    const cleanMeta = meta !== undefined ? redactPii(meta) : undefined;

    return JSON.stringify({
      timestamp,
      level,
      context: context || 'Application',
      message: cleanMessage,
      ...(cleanMeta !== undefined ? { meta: cleanMeta } : {}),
    });
  }

  log(message: unknown, context?: string, meta?: unknown) {
    process.stdout.write(this.formatLog('INFO', message, context, meta) + '\n');
  }

  error(message: unknown, trace?: string, context?: string) {
    process.stderr.write(
      this.formatLog('ERROR', message, context, trace ? { trace } : undefined) +
        '\n',
    );
  }

  warn(message: unknown, context?: string, meta?: unknown) {
    process.stdout.write(this.formatLog('WARN', message, context, meta) + '\n');
  }

  debug(message: unknown, context?: string, meta?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(
        this.formatLog('DEBUG', message, context, meta) + '\n',
      );
    }
  }

  verbose(message: unknown, context?: string, meta?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(
        this.formatLog('VERBOSE', message, context, meta) + '\n',
      );
    }
  }
}
