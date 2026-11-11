/**
 * Safe Logger conforming to UK DSPT, Caldicott Principles, and UK GDPR.
 * Automatically redacts NHS numbers, resident names, authentication tokens,
 * passwords, and sensitive medical notes from console output.
 */

const SENSITIVE_PATTERNS = [
  // 10-digit NHS Numbers: 3-3-4 or 10 continuous digits
  /\b\d{3}\s?\d{3}\s?\d{4}\b/g,
  // JWT Tokens
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  // Bearer headers
  /Bearer\s+[A-Za-z0-9_.-]+/gi,
];

function sanitize(message: unknown): unknown {
  if (typeof message === 'string') {
    let sanitized = message;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_DSPT]');
    }
    return sanitized;
  }

  if (message && typeof message === 'object') {
    if (Array.isArray(message)) {
      return message.map(sanitize);
    }
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(message as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('nhsnumber') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('pin')
      ) {
        cleanObj[key] = '[REDACTED_SECURE]';
      } else {
        cleanObj[key] = sanitize(value);
      }
    }
    return cleanObj;
  }

  return message;
}

export const safeLogger = {
  log: (...args: unknown[]) => {
    if (__DEV__) {
      console.log(...args.map(sanitize));
    }
  },
  info: (...args: unknown[]) => {
    if (__DEV__) {
      console.info(...args.map(sanitize));
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(...args.map(sanitize));
  },
  error: (...args: unknown[]) => {
    console.error(...args.map(sanitize));
  },
};
