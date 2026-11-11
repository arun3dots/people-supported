import { startOfDay, getDay, differenceInDays } from 'date-fns';
import { parseUkDateTime } from '../../common/utils/time.util';

/**
 * Computes the exact due timestamp for a daily task from its scheduled date,
 * target time (e.g. "08:30"), and time slot.
 */
export function calculateDueAt(
  date: Date,
  targetTime?: string | null,
  timeSlot?: string | null,
): Date {
  let timeStr = '12:00';
  if (targetTime && /^\d{1,2}:\d{2}$/.test(targetTime.trim())) {
    timeStr = targetTime.trim();
  } else {
    const defaultHour =
      timeSlot === 'Morning'
        ? 9
        : timeSlot === 'Afternoon'
          ? 14
          : timeSlot === 'Evening'
            ? 18
            : timeSlot === 'Night'
              ? 22
              : 12;
    timeStr = `${String(defaultHour).padStart(2, '0')}:00`;
  }
  return parseUkDateTime(date, timeStr);
}

/**
 * Validates whether a recurring care plan task is due on the target date
 * according to its frequency specification (Daily, Weekly, Alternate Days).
 */
export function isTaskDueOnDate(
  frequency: string,
  date: Date,
  createdAt: Date = new Date(),
): boolean {
  const normalized = (frequency || 'Daily').toLowerCase();
  if (normalized === 'weekly') {
    // Standard weekly routine: Mondays
    return getDay(date) === 1;
  }
  if (normalized === 'alternate days' || normalized === 'alternatedays') {
    const diff = Math.abs(
      differenceInDays(startOfDay(date), startOfDay(createdAt)),
    );
    return diff % 2 === 0;
  }
  return true;
}
