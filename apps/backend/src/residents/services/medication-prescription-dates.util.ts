import { BadRequestException } from '@nestjs/common';
import { getUkDateString, parseUkDateTime } from '../../common/utils/time.util';

export function ukDayOf(value: string | Date): string {
  const day = getUkDateString(value);
  if (!day) throw new BadRequestException('Invalid date');
  return day;
}

export function ukStartOf(day: string): Date {
  return parseUkDateTime(day, '00:00');
}

export function addUkDays(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return getUkDateString(date);
}

export function listUkDays(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addUkDays(day, 1)) {
    days.push(day);
  }
  return days;
}

export function minDay(a: string, b: string): string {
  return a < b ? a : b;
}

/** Future-only cutoff: history before "now" is never rewritten, even for backdated changes. */
export function cutoffFor(effectiveDay: string): Date {
  const start = ukStartOf(effectiveDay);
  const now = new Date();
  return start > now ? start : now;
}

export function assertBackdateReason(
  effectiveDay: string,
  backdateReason?: string,
): void {
  const today = getUkDateString(new Date());
  if (effectiveDay < today && !backdateReason?.trim()) {
    throw new BadRequestException(
      'A reason is required when backdating a change',
    );
  }
}
