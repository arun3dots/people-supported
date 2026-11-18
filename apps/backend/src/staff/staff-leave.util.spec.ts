import { prisma } from '@repo/db';
import { getStaffOnLeaveIds } from './staff-leave.util';

jest.mock('@repo/db', () => ({
  prisma: {
    leaveRequest: { findMany: jest.fn() },
    shiftRequest: { findMany: jest.fn() },
  },
}));

describe('getStaffOnLeaveIds', () => {
  const users = [
    { id: 'staff-1', tenantId: 'tenant-1' },
    { id: 'staff-2', tenantId: 'tenant-1' },
  ];

  beforeEach(() => jest.clearAllMocks());

  it('counts each staff member once across calendar and shift leave', async () => {
    jest
      .mocked(prisma.leaveRequest.findMany)
      .mockResolvedValue([
        { staffId: 'staff-1' },
        { staffId: 'staff-1' },
      ] as Awaited<ReturnType<typeof prisma.leaveRequest.findMany>>);
    jest
      .mocked(prisma.shiftRequest.findMany)
      .mockResolvedValue([
        { userId: 'staff-1' },
        { userId: 'staff-2' },
      ] as Awaited<ReturnType<typeof prisma.shiftRequest.findMany>>);

    const now = new Date('2026-07-10T23:30:00Z');
    const result = await getStaffOnLeaveIds(users, 'branch-1', now);

    expect([...result]).toEqual(['staff-1', 'staff-2']);
    expect(prisma.leaveRequest.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: { in: ['tenant-1'] },
        staffId: { in: ['staff-1', 'staff-2'] },
        status: 'Approved',
        startDate: { lte: new Date('2026-07-11T00:00:00Z') },
        endDate: { gte: new Date('2026-07-11T00:00:00Z') },
      },
      select: { staffId: true },
    });
    expect(prisma.shiftRequest.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: { in: ['tenant-1'] },
        branchId: 'branch-1',
        userId: { in: ['staff-1', 'staff-2'] },
        type: 'Leave',
        status: 'Approved',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: { userId: true },
    });
  });

  it('returns no staff on leave after records are cancelled or no longer current', async () => {
    jest.mocked(prisma.leaveRequest.findMany).mockResolvedValue([]);
    jest.mocked(prisma.shiftRequest.findMany).mockResolvedValue([]);
    expect(await getStaffOnLeaveIds(users, 'branch-1')).toEqual(new Set());
  });

  it('skips leave queries when no staff are in scope', async () => {
    expect(await getStaffOnLeaveIds([], 'branch-1')).toEqual(new Set());
    expect(prisma.leaveRequest.findMany).not.toHaveBeenCalled();
    expect(prisma.shiftRequest.findMany).not.toHaveBeenCalled();
  });
});
