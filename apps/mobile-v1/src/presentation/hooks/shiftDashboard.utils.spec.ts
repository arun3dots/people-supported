import { describe, expect, it } from '@jest/globals';
import {
  formatContinuingTimeRemaining,
  isContinuousNextShift,
  mapApiShift,
  normalizeShiftTimeRemaining,
} from './shiftDashboard.utils';

describe('shiftDashboard.utils', () => {
  it('keeps past started shift marked Started and Continuing when no continuous shift follows', () => {
    const mapped = mapApiShift({
      id: 's1',
      name: 'Day',
      startTime: '2026-10-29T07:00:00.000Z',
      endTime: '2026-10-29T15:00:00.000Z',
      isStarted: true,
      hasContinuousNextShift: false,
      timeRemainingStr: 'Shift ended',
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 's1',
        isStarted: true,
        isContinuing: true,
        status: 'Continuing',
      }),
    );
    expect(mapped?.timeRemainingStr).toMatch(/^Continuing \(/);
  });

  it('marks past started shift as Ended when backend flags hasContinuousNextShift', () => {
    const mapped = mapApiShift({
      id: 's1',
      name: 'Day',
      startTime: '2026-10-29T07:00:00.000Z',
      endTime: '2026-10-29T15:00:00.000Z',
      isStarted: true,
      hasContinuousNextShift: true,
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 's1',
        isStarted: false,
        isContinuing: false,
        status: 'Ended',
      }),
    );
  });

  it('keeps unstarted past shifts closed as Ended', () => {
    const mapped = mapApiShift({
      id: 's-missed',
      name: 'Day',
      startTime: '2026-10-29T07:00:00.000Z',
      endTime: '2026-10-29T15:00:00.000Z',
      isStarted: false,
    });

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 's-missed',
        isStarted: false,
        isContinuing: false,
        status: 'Ended',
      }),
    );
  });

  it('matches continuous shifts within a 30-minute gap only', () => {
    const current = {
      id: 's1',
      rawStartTime: '2026-10-29T07:00:00.000Z',
      rawEndTime: '2026-10-29T15:00:00.000Z',
    };

    expect(
      isContinuousNextShift(current, {
        id: 's2',
        rawStartTime: '2026-10-29T15:30:00.000Z',
        rawEndTime: '2026-10-29T23:00:00.000Z',
      }),
    ).toBe(true);

    expect(
      isContinuousNextShift(current, {
        id: 's3',
        rawStartTime: '2026-10-29T15:35:00.000Z',
        rawEndTime: '2026-10-29T23:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('formats live continuing durations cleanly', () => {
    const shift = {
      rawStartTime: '2026-10-29T07:00:00.000Z',
      rawEndTime: '2026-10-29T15:00:00.000Z',
    };
    const endMs = new Date('2026-10-29T15:00:00.000Z').getTime();

    expect(formatContinuingTimeRemaining(shift, endMs + 12 * 60_000)).toBe('Continuing (+12m)');
    expect(formatContinuingTimeRemaining(shift, endMs + 75 * 60_000)).toBe('Continuing (+1h 15m)');
    expect(
      normalizeShiftTimeRemaining('Shift ended', true, false, {
        isContinuing: true,
        shift,
        nowMs: endMs + 12 * 60_000,
      }),
    ).toBe('Continuing (+12m)');
  });
});
