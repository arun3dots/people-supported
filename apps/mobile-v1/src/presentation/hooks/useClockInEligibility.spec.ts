import { describe, expect, it } from '@jest/globals';
import { checkClockInEligibility, parseShiftTimestamp } from './useClockInEligibility';

describe('clock-in uses a recorded schedule', () => {
  it('does not enable clock-in when the schedule cannot be parsed', () => {
    expect(checkClockInEligibility({ id: 'shift', startTime: 'invalid' })).toMatchObject({
      isEligible: false,
      reason: 'invalid_schedule',
    });
    expect(parseShiftTimestamp(undefined, '99:99', '2026-11-13')).toBeNull();
  });

  it('does not silently substitute today when a schedule date is missing', () => {
    expect(parseShiftTimestamp(undefined, '14:00')).toBeNull();
  });

  it('opens the ten-minute window at the recorded wall-clock time', () => {
    const shift = { id: 'shift', startTime: '14:00', endTime: '20:00', date: '2026-11-13' };
    expect(
      checkClockInEligibility(shift, new Date(2026, 10, 13, 13, 49).getTime()).isEligible,
    ).toBe(false);
    expect(
      checkClockInEligibility(shift, new Date(2026, 10, 13, 13, 50).getTime()).isEligible,
    ).toBe(true);
  });
});
