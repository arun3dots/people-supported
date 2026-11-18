import {
  CONTINUOUS_SHIFT_MAX_GAP_MS,
  findContinuousFollowUpShiftInList,
  formatShiftTimeRemaining,
  isContinuousFollowUpShift,
} from './shift-continuity.util';

describe('shift-continuity.util', () => {
  const baseStart = new Date('2026-10-29T07:00:00.000Z');
  const baseEnd = new Date('2026-10-29T15:00:00.000Z');

  it('matches back-to-back and <= 30m gap Published shifts as continuous', () => {
    const current = {
      id: 's1',
      startTime: baseStart,
      endTime: baseEnd,
      status: 'Published',
    };
    const backToBack = {
      id: 's2',
      startTime: new Date(baseEnd.getTime()),
      endTime: new Date(baseEnd.getTime() + 8 * 3600_000),
      status: 'Published',
    };
    const withinGap = {
      id: 's3',
      startTime: new Date(baseEnd.getTime() + CONTINUOUS_SHIFT_MAX_GAP_MS),
      endTime: new Date(baseEnd.getTime() + 8 * 3600_000),
      status: 'Published',
    };
    const outsideGap = {
      id: 's4',
      startTime: new Date(
        baseEnd.getTime() + CONTINUOUS_SHIFT_MAX_GAP_MS + 60_000,
      ),
      endTime: new Date(baseEnd.getTime() + 8 * 3600_000),
      status: 'Published',
    };
    const draftShift = {
      id: 's5',
      startTime: new Date(baseEnd.getTime()),
      endTime: new Date(baseEnd.getTime() + 8 * 3600_000),
      status: 'Draft',
    };

    expect(isContinuousFollowUpShift(current, backToBack)).toBe(true);
    expect(isContinuousFollowUpShift(current, withinGap)).toBe(true);
    expect(isContinuousFollowUpShift(current, outsideGap)).toBe(false);
    expect(isContinuousFollowUpShift(current, draftShift)).toBe(false);
    expect(
      findContinuousFollowUpShiftInList(current, [
        outsideGap,
        withinGap,
        backToBack,
      ])?.id,
    ).toBe('s2');
  });

  it('formats continuing overrun strings instead of Shift ended when started without a follower', () => {
    const plus15m = new Date(baseEnd.getTime() + 15 * 60_000);
    const plus1h05m = new Date(baseEnd.getTime() + 65 * 60_000);

    expect(
      formatShiftTimeRemaining(baseEnd, plus15m, {
        isStarted: true,
        isCompleted: false,
        hasContinuousNextShift: false,
      }),
    ).toBe('Continuing (+15m)');

    expect(
      formatShiftTimeRemaining(baseEnd, plus1h05m, {
        isStarted: true,
        isCompleted: false,
        hasContinuousNextShift: false,
      }),
    ).toBe('Continuing (+1h 05m)');

    expect(
      formatShiftTimeRemaining(baseEnd, plus15m, {
        isStarted: true,
        isCompleted: false,
        hasContinuousNextShift: true,
      }),
    ).toBe('Shift ended');
  });
});
