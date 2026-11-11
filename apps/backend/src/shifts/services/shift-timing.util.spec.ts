import { resolveShiftTimings } from './shift-timing.util';

describe('resolveShiftTimings', () => {
  it('does not silently roll an invalid end timestamp into the next day', () => {
    const start = new Date('2026-10-30T18:30:00.000Z');
    const end = new Date('2026-10-29T18:30:00.000Z');

    const timings = resolveShiftTimings(start, end);

    expect(timings.rawEndTime).toEqual(end);
    expect(timings.rawEndTime.getTime()).toBeLessThan(
      timings.rawStartTime.getTime(),
    );
  });
});
