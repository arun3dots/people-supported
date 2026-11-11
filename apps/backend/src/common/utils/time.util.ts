export const UK_TIMEZONE = 'Europe/London';

/**
 * Returns whether Europe/London is in British Summer Time (BST, UTC+1) on the given date.
 */
export function isUkSummerTime(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    timeZoneName: 'shortOffset',
  }).format(date);
  return parts.includes('+1');
}

/**
 * Returns the UK London calendar date string in YYYY-MM-DD format.
 */
export function getUkDateString(
  dateInput: Date | string | null | undefined = new Date(),
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Calculates start (00:00:00.000) and end (23:59:59.999) of the UK calendar day
 * as exact UTC Date instances, correctly accounting for GMT/BST transitions.
 */
export function getUkDayBoundaries(
  dateInput: Date | string | null | undefined = new Date(),
): {
  ukDateStr: string;
  start: Date;
  end: Date;
} {
  const date = dateInput
    ? typeof dateInput === 'string'
      ? new Date(dateInput)
      : dateInput
    : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const ukDateStr = getUkDateString(validDate);

  const probe = new Date(`${ukDateStr}T12:00:00Z`);
  const offset = isUkSummerTime(probe) ? '+01:00' : '+00:00';

  const start = new Date(`${ukDateStr}T00:00:00.000${offset}`);
  const end = new Date(`${ukDateStr}T23:59:59.999${offset}`);

  return { ukDateStr, start, end };
}

/**
 * Parses a date string and UK time string (e.g. "08:00") into an exact UTC Date.
 */
export function parseUkDateTime(
  dateInput: Date | string | null | undefined,
  timeStr: string = '00:00',
): Date {
  const ukDateStr =
    typeof dateInput === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())
      ? dateInput.trim()
      : getUkDateString(dateInput);

  const cleanTime =
    timeStr.trim().length === 5 ? `${timeStr.trim()}:00` : timeStr.trim();
  const probe = new Date(`${ukDateStr}T12:00:00Z`);
  const offset = isUkSummerTime(probe) ? '+01:00' : '+00:00';

  return new Date(`${ukDateStr}T${cleanTime}.000${offset}`);
}

/**
 * Returns the day of week (0 = Sunday, 6 = Saturday) in the UK London timezone.
 */
export function getUkDayOfWeek(dateInput: Date | string): number {
  const ukDateStr = getUkDateString(dateInput);
  if (!ukDateStr) return new Date(dateInput).getUTCDay();
  return new Date(`${ukDateStr}T12:00:00Z`).getUTCDay();
}

/**
 * Advances a Date by N calendar days in the UK London timezone while preserving its UK HH:mm time.
 */
export function addUkCalendarDays(
  dateInput: Date | string,
  days: number,
): Date {
  const ukDateStr = getUkDateString(dateInput);
  const timeStr = formatUkTime(dateInput);
  const [year = 1970, month = 1, day = 1] = ukDateStr.split('-').map(Number);
  const nextUtcNoon = new Date(Date.UTC(year, month - 1, day + days, 12));
  const nextDateStr = nextUtcNoon.toISOString().slice(0, 10);
  return parseUkDateTime(nextDateStr, timeStr || '00:00');
}

/**
 * Formats a Date or timestamp as a localized UK 24-hour time string (e.g. "08:00" or "15:00").
 */
export function formatUkTime(
  dateInput: Date | string | null | undefined,
  options: { hour12?: boolean } = { hour12: false },
): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const amPmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
    if (amPmMatch) {
      let hours = Number(amPmMatch[1]);
      const minutes = amPmMatch[2];
      const period = amPmMatch[3]?.toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/**
 * Formats a Date as a localized UK date string (e.g. "26 Oct 2026").
 */
export function formatUkDate(
  dateInput: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    ...options,
  }).format(date);
}
