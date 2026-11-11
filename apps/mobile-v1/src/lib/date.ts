export const UK_TIMEZONE = 'Europe/London';

export type DateInput = Date | string | number | null | undefined | unknown;

function toValidDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number' || typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(input);
  if (str && str !== '[object Object]') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Returns whether Europe/London is currently in British Summer Time (BST, UTC+1).
 */
export function isUkSummerTime(date: Date = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: UK_TIMEZONE,
      timeZoneName: 'shortOffset',
    }).format(date);
    return parts.includes('+1');
  } catch {
    return false;
  }
}

/**
 * Formats a timestamp or date string into a 24-hour time string (e.g. "22:19", "08:00").
 * Standardized across mobile UI per NHS DSPT guidelines (BUG-030).
 * Matches system clock time by default to eliminate timezone mismatch.
 */
export function formatUkTime(
  dateInput: DateInput,
  options: { hour12?: boolean; forceUkTimezone?: boolean } = { hour12: false, forceUkTimezone: false },
): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // 12-hour format e.g. "08:00 AM" or "4:30 PM"
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      if (options.hour12) return trimmed.toUpperCase();
      let h = parseInt(match12[1], 10);
      const m = match12[2];
      const isPm = match12[3].toUpperCase() === 'PM';
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }

    // 24-hour format e.g. "08:00" or "16:30"
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = match24[2];
      if (!options.hour12) {
        return `${String(h).padStart(2, '0')}:${m}`;
      }
      const period = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 || 12;
      return `${String(dispH).padStart(2, '0')}:${m} ${period}`;
    }
  }

  const date = toValidDate(dateInput);
  if (!date) return '';

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: options.hour12 ?? false,
  };
  if (options.forceUkTimezone) {
    formatOptions.timeZone = UK_TIMEZONE;
  }

  return new Intl.DateTimeFormat('en-GB', formatOptions).format(date);
}

/**
 * Formats a Date or timestamp as a localized date string (e.g. "6 Nov 2026").
 */
export function formatUkDate(
  dateInput: DateInput,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
  forceUkTimezone = false,
): string {
  if (!dateInput) return '';
  const date = toValidDate(dateInput);
  if (!date) return '';

  const opts: Intl.DateTimeFormatOptions = {
    ...options,
  };
  if (forceUkTimezone) {
    opts.timeZone = UK_TIMEZONE;
  }

  return new Intl.DateTimeFormat('en-GB', opts).format(date);
}

/**
 * Formats a Date as a full localized date & time string in 24-hour format (e.g. "6 Nov 2026, 22:19").
 */
export function formatUkDateTime(
  dateInput: DateInput,
  options: { hour12?: boolean; forceUkTimezone?: boolean } = { hour12: false, forceUkTimezone: false },
): string {
  if (!dateInput) return '';
  const d = formatUkDate(dateInput, undefined, options.forceUkTimezone);
  const t = formatUkTime(dateInput, options);
  if (!d) return t;
  if (!t) return d;
  return `${d}, ${t}`;
}

/**
 * Returns the current calendar date formatted as YYYY-MM-DD.
 * Defaulting forceUkTimezone=true ensures clinical records, incidents, and shifts
 * align with the care home's calendar (Europe/London) and avoid future date rejections.
 */
export function getUkDateString(dateInput: DateInput = new Date(), forceUkTimezone = true): string {
  const date = toValidDate(dateInput) || new Date();
  if (forceUkTimezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: UK_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      // Fallback
    }
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes any date input (YYYY-MM-DD, DD/MM/YYYY, '6 Nov 2026', or Date) to standard YYYY-MM-DD.
 */
export function normalizeToIsoDate(input: string | Date | undefined | null): string {
  if (!input) return getUkDateString(new Date(), true);
  if (input instanceof Date) return getUkDateString(input, true);
  const trimmed = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const ukMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ukMatch) {
    const d = ukMatch[1].padStart(2, '0');
    const m = ukMatch[2].padStart(2, '0');
    const y = ukMatch[3];
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return getUkDateString(parsed, false);
  }
  return getUkDateString(new Date(), true);
}

/**
 * Returns current hours (0-23) and minutes in system local timezone.
 */
export function getUkTimeParts(dateInput: DateInput = new Date()): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const date = toValidDate(dateInput) || new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

/**
 * Returns the current hour (0-23) matching the system clock.
 */
export function getUkHour(dateInput: DateInput = new Date()): number {
  return getUkTimeParts(dateInput).hours;
}

/**
 * Formats header bar date string e.g. "Friday | 6, Nov 2026" matching system clock.
 */
export function formatUkHeaderDate(dateInput: DateInput = new Date()): string {
  const date = toValidDate(dateInput) || new Date();

  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';

  return `${weekday} | ${day}, ${month} ${year}`;
}

/**
 * Formats relative date ("Today", "Yesterday", or "6 Nov") and 24-hour time in system local time.
 */
export function formatUkRelativeDayAndTime(
  dateInput: DateInput,
): { dateLabel: string; timeLabel: string } {
  if (!dateInput) return { dateLabel: 'Today', timeLabel: '' };
  const date = toValidDate(dateInput);
  if (!date) return { dateLabel: 'Today', timeLabel: '' };

  const targetDate = getUkDateString(date);
  const todayDate = getUkDateString(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getUkDateString(yesterdayDate);

  let dateLabel = '';
  if (targetDate === todayDate) {
    dateLabel = 'Today';
  } else if (targetDate === yesterdayStr) {
    dateLabel = 'Yesterday';
  } else {
    dateLabel = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  const timeLabel = formatUkTime(date, { hour12: false });
  return { dateLabel, timeLabel };
}
