import { useState, useEffect, useMemo } from 'react';
import {
  formatUkDate,
  formatUkTime,
  getUkDateString,
  UK_TIMEZONE,
} from '../../lib/date';

export interface ClockInEligibility {
  isEligible: boolean;
  reason: 'eligible' | 'too_early' | 'shift_ended' | 'no_shift';
  minutesUntilEligible: number;
  eligibleAtStr: string;
  scheduledStartTimeStr: string;
  scheduledEndTimeStr: string;
}

export interface ShiftTimeInput {
  id?: string;
  rawStartTime?: string | Date;
  rawEndTime?: string | Date;
  startTime?: string;
  endTime?: string;
  date?: string | Date;
  shiftDate?: string | Date;
  isStarted?: boolean;
  isCompleted?: boolean;
  status?: string;
}

function getUkCalendarParts(dateInput?: string | Date): { year: number; month: number; day: number } {
  if (typeof dateInput === 'string') {
    const dateOnlyMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      return {
        year: Number(dateOnlyMatch[1]),
        month: Number(dateOnlyMatch[2]) - 1,
        day: Number(dateOnlyMatch[3]),
      };
    }
  }

  const date = dateInput instanceof Date
    ? dateInput
    : typeof dateInput === 'string'
      ? new Date(dateInput)
      : new Date();
  const validDate = Number.isFinite(date.getTime()) ? date : new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(validDate);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value) - 1,
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

export function parseShiftTimestamp(
  rawTime: string | Date | undefined,
  formattedTime: string | undefined,
  baseDateInput?: string | Date
): number | null {
  let hours: number | null = null;
  let minutes: number | null = null;

  const candidateStr =
    formattedTime && /^\d{1,2}:\d{2}/.test(formattedTime.trim())
      ? formattedTime.trim()
      : typeof rawTime === 'string' && /^\d{1,2}:\d{2}/.test(rawTime.trim())
        ? rawTime.trim()
        : rawTime
          ? formatUkTime(rawTime, { forceUkTimezone: true })
          : '';

  if (candidateStr && /^\d{1,2}:\d{2}/.test(candidateStr)) {
    const [hStr, mStr] = candidateStr.split(':');
    hours = parseInt(hStr, 10);
    minutes = parseInt(mStr, 10);
  }

  if (hours === null || minutes === null || Number.isNaN(hours) || Number.isNaN(minutes)) {
    if (rawTime instanceof Date && Number.isFinite(rawTime.getTime())) {
      return rawTime.getTime();
    }
    if (typeof rawTime === 'string' && rawTime.trim()) {
      const parsed = new Date(rawTime);
      if (Number.isFinite(parsed.getTime())) return parsed.getTime();
    }
    return null;
  }

  // Anchor shift wall-clock HH:mm onto the local device calendar date for that shift
  // so a 14:00 shift opens at 13:50 on the carer's device clock regardless of UTC offset.
  const dateSource =
    baseDateInput ||
    (rawTime && !(typeof rawTime === 'string' && /^\d{1,2}:\d{2}/.test(rawTime.trim()))
      ? rawTime
      : undefined);
  const { year, month, day } = getUkCalendarParts(dateSource);
  const result = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(result.getTime()) ? null : result.getTime();
}

/** '' for today, ' tomorrow', or ' on Thu 5 Nov' for any other day. */
export function getUkDaySuffix(targetMs: number, nowMs: number): string {
  const targetDay = getUkDateString(new Date(targetMs), false);
  if (targetDay === getUkDateString(new Date(nowMs), false)) return '';
  const tomorrow = new Date(nowMs);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (targetDay === getUkDateString(tomorrow, false)) return ' tomorrow';
  return ` on ${formatUkDate(new Date(targetMs), { weekday: 'short', day: 'numeric', month: 'short' }, false)}`;
}

export function checkClockInEligibility(
  shift: ShiftTimeInput | null | undefined,
  nowMs: number = Date.now()
): ClockInEligibility {
  if (!shift || (!shift.id && !shift.startTime && !shift.rawStartTime)) {
    return {
      isEligible: false,
      reason: 'no_shift',
      minutesUntilEligible: 0,
      eligibleAtStr: '',
      scheduledStartTimeStr: '',
      scheduledEndTimeStr: '',
    };
  }

  // If already started or completed, allow shift interaction
  if (shift.isStarted || shift.isCompleted || shift.status === 'Completed') {
    return {
      isEligible: true,
      reason: 'eligible',
      minutesUntilEligible: 0,
      eligibleAtStr: '',
      scheduledStartTimeStr: shift.startTime || '',
      scheduledEndTimeStr: shift.endTime || '',
    };
  }

  const startMs = parseShiftTimestamp(
    shift.rawStartTime,
    shift.startTime,
    shift.date || shift.shiftDate
  );

  let endMs = parseShiftTimestamp(
    shift.rawEndTime,
    shift.endTime,
    shift.date || shift.shiftDate || shift.rawStartTime
  );

  // If overnight shift (end time precedes start time on clock), roll end time forward 24h
  if (startMs && endMs && endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }

  // Fallback: If start timestamp is unparseable, allow clock-in so carers aren't blocked
  if (!startMs) {
    return {
      isEligible: true,
      reason: 'eligible',
      minutesUntilEligible: 0,
      eligibleAtStr: '',
      scheduledStartTimeStr: shift.startTime || '',
      scheduledEndTimeStr: shift.endTime || '',
    };
  }

  // Clock-in eligibility window opens exactly 10 minutes prior to scheduled start time
  const eligibilityStartMs = startMs - 10 * 60 * 1000;
  const eligibleAtStr = `${formatUkTime(new Date(eligibilityStartMs))}${getUkDaySuffix(eligibilityStartMs, nowMs)}`;
  const scheduledStartTimeStr = formatUkTime(new Date(startMs));
  const scheduledEndTimeStr = endMs ? formatUkTime(new Date(endMs)) : (shift.endTime || '');

  // Only lock clock-in if it is MORE than 10 minutes before the scheduled start time
  if (nowMs < eligibilityStartMs) {
    const diffMs = eligibilityStartMs - nowMs;
    const minutesUntilEligible = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
    return {
      isEligible: false,
      reason: 'too_early',
      minutesUntilEligible,
      eligibleAtStr,
      scheduledStartTimeStr,
      scheduledEndTimeStr,
    };
  }

  // Once eligibilityStartMs is reached or passed, Start Shift is ALWAYS eligible (BUG-044)
  return {
    isEligible: true,
    reason: 'eligible',
    minutesUntilEligible: 0,
    eligibleAtStr,
    scheduledStartTimeStr,
    scheduledEndTimeStr,
  };
}

export function useClockInEligibility(
  shift: ShiftTimeInput | null | undefined
): ClockInEligibility {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // Re-evaluate every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    return checkClockInEligibility(shift, Date.now());
  }, [
    shift?.id,
    shift?.rawStartTime,
    shift?.rawEndTime,
    shift?.startTime,
    shift?.endTime,
    shift?.date,
    shift?.shiftDate,
    shift?.status,
    shift?.isStarted,
    shift?.isCompleted,
    tick,
  ]);
}
