import { prisma } from '@repo/db';
import { ShiftQueryService } from './shift-query.service';

jest.mock('@repo/db', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
    },
  },
}));

describe('ShiftQueryService', () => {
  const service = new ShiftQueryService();
  const now = new Date('2026-10-29T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now.getTime());
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not return an expired Started shift as active when a newer shift is scheduled', async () => {
    const staleStartedShift = {
      id: 'stale-shift',
      status: 'Published',
      startTime: new Date('2026-10-26T11:00:00.000Z'),
      endTime: new Date('2026-10-27T18:30:00.000Z'),
      type: { name: 'Old shift' },
      wing: null,
      assignments: [],
      staffLogs: [{ status: 'Started', actualStartTime: now }],
    };
    const nextShift = {
      id: 'next-shift',
      status: 'Published',
      startTime: new Date('2026-10-30T18:20:00.000Z'),
      endTime: new Date('2026-10-31T08:00:00.000Z'),
      type: { name: 'Custom shift' },
      wing: null,
      assignments: [],
      staffLogs: [],
    };

    (prisma.shift.findMany as jest.Mock)
      .mockResolvedValueOnce([staleStartedShift, nextShift])
      .mockResolvedValueOnce([]);

    const result = await service.findActiveOrNextShift('tenant-1', 'user-1');

    expect(result.active).toBeNull();
    expect(result.next).toEqual(expect.objectContaining({ id: 'next-shift' }));
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
