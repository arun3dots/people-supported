const UK_TIME_ZONE = "Europe/London";

type DateInput = Date | string;

interface UkDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function getParts(value: DateInput): UkDateTimeParts {
  const date = toDate(value);
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("Invalid date supplied");
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function getUkDateString(value: DateInput): string {
  const { year, month, day } = getParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatUkTime(value: DateInput): string {
  const { hour, minute } = getParts(value);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatUkDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("Invalid date supplied");
  }

  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: UK_TIME_ZONE,
  }).format(date);
}

export function getUkDateTimeForLocalDisplay(value: DateInput): Date {
  const { year, month, day, hour, minute, second } = getParts(value);
  return new Date(year, month - 1, day, hour, minute, second);
}

export function convertLocalDateTimeToUk(value: Date): Date {
  const date = getLocalCalendarDateString(value);
  const time = [
    String(value.getHours()).padStart(2, "0"),
    String(value.getMinutes()).padStart(2, "0"),
  ].join(":");
  return createUkDateTime(date, time);
}

export function createUkDateTime(dateValue: DateInput, timeValue: string): Date {
  const dateString = typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? dateValue
    : getUkDateString(dateValue);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!match || !timeMatch) {
    throw new RangeError("Invalid UK date or time supplied");
  }

  const [, yearText, monthText, dayText] = match;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour > 23 || minute > 59 ||
    getUkDateString(new Date(Date.UTC(year, month - 1, day, 12))) !== dateString
  ) {
    throw new RangeError("Invalid UK date or time supplied");
  }

  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = targetUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getParts(new Date(timestamp));
    const representedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const difference = targetUtc - representedUtc;
    if (difference === 0) {
      return new Date(timestamp);
    }
    timestamp += difference;
  }

  throw new RangeError(
    "The selected UK local time does not exist because of a daylight-saving transition",
  );
}

export function addUkCalendarDays(value: DateInput, days: number): Date {
  const parts = getParts(value);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
  const dateString = date.toISOString().slice(0, 10);
  return createUkDateTime(dateString, formatUkTime(value));
}

export function getUkCalendarDate(value: DateInput): Date {
  const { year, month, day } = getParts(value);
  return new Date(year, month - 1, day, 12);
}

export function getLocalCalendarDateString(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

export function normalizeLocalCalendarDate(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
}

export function getUkDayStart(value: DateInput): Date {
  return createUkDateTime(getUkDateString(value), "00:00");
}

export function getUkDayEnd(value: DateInput): Date {
  return new Date(addUkCalendarDays(getUkDayStart(value), 1).getTime() - 1);
}

export function isUkDateBeforeToday(value: DateInput, now: DateInput = new Date()): boolean {
  return getUkDateString(value) < getUkDateString(now);
}

export function isCalendarDateBeforeUkToday(value: Date, now: DateInput = new Date()): boolean {
  return getLocalCalendarDateString(value) < getUkDateString(now);
}
