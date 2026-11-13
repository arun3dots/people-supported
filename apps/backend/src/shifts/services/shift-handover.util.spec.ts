import { prisma } from '@repo/db';
import { loadPreviousShiftHandovers } from './shift-handover.util';

jest.mock('@repo/db', () => ({
  prisma: { staffShiftLog: { findMany: jest.fn() } },
}));

describe('loadPreviousShiftHandovers', () => {
  const shift = {
    id: 'current-shift',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    wingId: 'property-1',
    startTime: new Date('2026-11-13T08:00:00Z'),
  };

  beforeEach(() => jest.clearAllMocks());

  it('preserves separate completed handovers and their staff identity', async () => {
    const logs = ['Alex', 'Sam', 'Blank'].map((fullName, index) => ({
      id: `log-${index}`,
      userId: `staff-${index}`,
      handoverNotes: index === 2 ? '  ' : ` Notes from ${fullName} `,
      actualEndTime: new Date('2026-11-13T07:55:00Z'),
      shift: {
        startTime: new Date('2026-11-12T20:00:00Z'),
        type: { name: 'Night' },
      },
      user: {
        fullName,
        role: { name: 'Carer' },
        profile: { profilePhotoUrl: null },
      },
    }));
    jest
      .mocked(prisma.staffShiftLog.findMany)
      .mockResolvedValue(
        logs as unknown as Awaited<
          ReturnType<typeof prisma.staffShiftLog.findMany>
        >,
      );

    const result = await loadPreviousShiftHandovers(
      shift,
      ['resident-1'],
      ['room-1'],
    );

    expect(result.map((note) => note.staffName)).toEqual(['Alex', 'Sam']);
    expect(result[0]).toMatchObject({
      id: 'log-0',
      staffId: 'staff-0',
      staffRole: 'Carer',
      shiftName: 'Night',
      handoverNotes: 'Notes from Alex',
      endTime: '2026-11-13T07:55:00.000Z',
    });
    expect(prisma.staffShiftLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          status: 'Completed',
          actualEndTime: { lte: expect.any(Date) },
          handoverNotes: { not: null },
          shift: expect.objectContaining({
            id: { not: 'current-shift' },
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            deletedAt: null,
            startTime: { lt: shift.startTime },
            OR: expect.arrayContaining([
              {
                assignments: {
                  some: {
                    deletedAt: null,
                    assignedResidentIds: { hasSome: ['resident-1'] },
                  },
                },
              },
              {
                assignments: {
                  some: {
                    deletedAt: null,
                    assignedRoomIds: { hasSome: ['room-1'] },
                  },
                },
              },
              { wingId: 'property-1' },
            ]),
          }),
        }),
        orderBy: { actualEndTime: 'desc' },
        take: 10,
      }),
    );
  });

  it('returns an empty list when no completed previous handovers exist', async () => {
    jest.mocked(prisma.staffShiftLog.findMany).mockResolvedValue([]);
    expect(await loadPreviousShiftHandovers(shift, [], [])).toEqual([]);
  });
});
