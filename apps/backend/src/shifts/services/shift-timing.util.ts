export interface FormattedTiming {
  startTime: string;
  endTime: string;
  rawStartTime: Date;
  rawEndTime: Date;
}

import { formatUkTime } from '../../common/utils/time.util';

export function formatTime(d: Date | null): string {
  return formatUkTime(d, { hour12: false });
}

export function resolveShiftTimings(
  startRaw: Date,
  endRaw: Date,
): FormattedTiming {
  const startTime = new Date(startRaw);
  const endTime = new Date(endRaw);
  return {
    startTime: formatTime(startTime),
    endTime: formatTime(endTime),
    rawStartTime: startTime,
    rawEndTime: endTime,
  };
}
