import { prisma } from '@repo/db';
import { ShiftQueryService } from './shift-query.service';

jest.mock('@repo/db', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
    dailyTask: {
      findMany: jest.fn(),
    },
  },
}));

describe('ShiftQueryService', () => {
  const service = new ShiftQueryService();
  const now = new Date('2026-10-29T15:20:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now.getTime());
    jest.clearAllMocks();
    (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.dailyTask.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps an unended Started shift active past endTime when there is no continuous shift', async () => {
    const continuingShift = {
      id: 'open-shift',
      status: 'Published',
      startTime: new Date('2026-10-26T07:00:00.000Z'),
      endTime: new Date('2026-10-26T15:00:00.000Z'),
      type: { name: 'Day shift' },
      wing: null,
      assignments: [],
      staffLogs: [
        {
          status: 'Started',
          actualStartTime: new Date('2026-10-26T07:02:00.000Z'),
        },
      ],
    };
    const nextDayShift = {
      id: 'next-shift',
      status: 'Published',
      startTime: new Date('2026-10-30T07:00:00.000Z'),
      endTime: new Date('2026-10-30T15:00:00.000Z'),
      type: { name: 'Tomorrow shift' },
      wing: null,
      assignments: [],
      staffLogs: [],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValueOnce([
      continuingShift,
      nextDayShift,
    ]);

    const result = await service.findActiveOrNextShift('tenant-1', 'user-1');

    expect(result.active).toEqual(
      expect.objectContaining({
        id: 'open-shift',
        isStarted: true,
        isContinuing: true,
        hasContinuousNextShift: false,
        status: 'Continuing',
      }),
    );
    expect(
      (result.active as { timeRemainingStr: string }).timeRemainingStr,
    ).toMatch(/^Continuing \(/);
  });

  it('transitions past endTime when a continuous Published shift follows within 30 minutes', async () => {
    const firstShift = {
      id: 'shift-1',
      status: 'Published',
      startTime: new Date('2026-10-29T07:00:00.000Z'),
      endTime: new Date('2026-10-29T15:00:00.000Z'),
      type: { name: 'Early' },
      wing: null,
      assignments: [],
      staffLogs: [
        {
          status: 'Started',
          actualStartTime: new Date('2026-10-29T07:00:00.000Z'),
        },
      ],
    };
    const continuousShift = {
      id: 'shift-2',
      status: 'Published',
      startTime: new Date('2026-10-29T15:30:00.000Z'),
      endTime: new Date('2026-10-29T23:00:00.000Z'),
      type: { name: 'Late' },
      wing: null,
      assignments: [],
      staffLogs: [],
    };

    (prisma.shift.findMany as jest.Mock)
      .mockResolvedValueOnce([firstShift, continuousShift])
      .mockResolvedValueOnce([]);

    const result = await service.findActiveOrNextShift('tenant-1', 'user-1');

    expect(result.active).toBeNull();
    expect(result.next).toEqual(expect.objectContaining({ id: 'shift-2' }));
  });

  it('marks continuing shifts as Continuing in findMyShifts and unstarted past shifts as Missed', async () => {
    const unendedShift = {
      id: 'shift-open',
      status: 'Published',
      startTime: new Date('2026-10-29T07:00:00.000Z'),
      endTime: new Date('2026-10-29T15:00:00.000Z'),
      type: { name: 'Day' },
      wing: null,
      assignments: [],
      staffLogs: [
        {
          status: 'Started',
          actualStartTime: new Date('2026-10-29T07:01:00.000Z'),
        },
      ],
    };
    const missedShift = {
      id: 'shift-missed',
      status: 'Published',
      startTime: new Date('2026-10-28T07:00:00.000Z'),
      endTime: new Date('2026-10-28T15:00:00.000Z'),
      type: { name: 'Yesterday' },
      wing: null,
      assignments: [],
      staffLogs: [],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValueOnce([
      missedShift,
      unendedShift,
    ]);

    const list = (await service.findMyShifts('tenant-1', 'user-1')) as Array<
      Record<string, unknown>
    >;

    expect(list.find((s) => s.id === 'shift-open')).toEqual(
      expect.objectContaining({
        isStarted: true,
        isContinuing: true,
        status: 'Continuing',
      }),
    );
    expect(list.find((s) => s.id === 'shift-missed')).toEqual(
      expect.objectContaining({
        isStarted: false,
        isContinuing: false,
        status: 'Missed',
      }),
    );
  });

  it('skips shifts with an end time before the start time', async () => {
    const invalidShift = {
      id: 'invalid-shift',
      status: 'Published',
      startTime: new Date('2026-10-30T18:30:00.000Z'),
      endTime: new Date('2026-10-29T18:30:00.000Z'),
      type: { name: 'Invalid shift' },
      wing: null,
      assignments: [],
      staffLogs: [],
    };

    (prisma.shift.findMany as jest.Mock)
      .mockResolvedValueOnce([invalidShift])
      .mockResolvedValueOnce([]);

    const result = await service.findActiveOrNextShift('tenant-1', 'user-1');

    expect(result.active).toBeNull();
    expect(result.next).toBeNull();
  });
});
