import { rawPrisma } from '@repo/db';
import { CarePlanDailyTaskService } from './care-plan-daily-task.service';

jest.mock('@repo/db', () => ({
  rawPrisma: {
    shiftAssignment: { findMany: jest.fn() },
    resident: { findMany: jest.fn() },
    dailyTask: { findMany: jest.fn() },
  },
  Prisma: {},
}));

describe('CarePlanDailyTaskService.getCarerShiftTasks', () => {
  const service = new CarePlanDailyTaskService({} as never, {} as never);
  const mockedPrisma = rawPrisma as unknown as {
    shiftAssignment: { findMany: jest.Mock };
    resident: { findMany: jest.Mock };
    dailyTask: { findMany: jest.Mock };
  };
  const shiftAssignmentsQuery = mockedPrisma.shiftAssignment.findMany;
  const residentQuery = mockedPrisma.resident.findMany;
  const dailyTaskQuery = mockedPrisma.dailyTask.findMany;
  const date = new Date('2026-10-30T12:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    shiftAssignmentsQuery.mockResolvedValue([
      {
        assignedResidentIds: ['assigned-resident'],
        assignedRoomIds: ['room-with-other-residents'],
        shift: {
          wingId: 'wing-with-other-residents',
          branchId: 'branch-with-other-residents',
        },
      },
    ]);
    dailyTaskQuery.mockResolvedValue([]);
  });

  it('limits tasks to explicitly assigned residents and tasks assigned directly to the carer', async () => {
    await service.getCarerShiftTasks('tenant-1', 'carer-1', undefined, date);

    expect(residentQuery).not.toHaveBeenCalled();
    expect(dailyTaskQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          resident: { tenantId: 'tenant-1' },
          OR: [
            { residentId: { in: ['assigned-resident'] } },
            { assignedStaffId: 'carer-1' },
          ],
        }),
      }),
    );
  });

  it('does not broaden tasks to room, wing, or branch residents when no resident is explicitly assigned', async () => {
    shiftAssignmentsQuery.mockResolvedValue([
      {
        assignedResidentIds: [],
        assignedRoomIds: ['room-with-other-residents'],
        shift: {
          wingId: 'wing-with-other-residents',
          branchId: 'branch-with-other-residents',
        },
      },
    ]);

    await service.getCarerShiftTasks('tenant-1', 'carer-1', undefined, date);

    expect(residentQuery).not.toHaveBeenCalled();
    expect(dailyTaskQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ assignedStaffId: 'carer-1' }],
        }),
      }),
    );
  });

  it('keeps a requested resident filter in addition to the carer access scope', async () => {
    await service.getCarerShiftTasks(
      'tenant-1',
      'carer-1',
      undefined,
      date,
      'requested-resident',
    );

    expect(dailyTaskQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          residentId: 'requested-resident',
          OR: [
            { residentId: { in: ['assigned-resident'] } },
            { assignedStaffId: 'carer-1' },
          ],
        }),
      }),
    );
  });

  it('returns tasks only for residents assigned to the authenticated carer', async () => {
    await service.getCarerAssignedResidentTasks(
      'tenant-1',
      'carer-1',
      undefined,
      date,
    );

    expect(shiftAssignmentsQuery).not.toHaveBeenCalled();
    expect(dailyTaskQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          resident: {
            tenantId: 'tenant-1',
            deletedAt: null,
            OR: [
              { keyworkerId: 'carer-1' },
              { staff: { some: { id: 'carer-1' } } },
            ],
          },
        }),
      }),
    );
  });

  it('does not include tasks assigned directly to the carer for unrelated residents', async () => {
    await service.getCarerAssignedResidentTasks(
      'tenant-1',
      'carer-1',
      undefined,
      date,
    );

    const taskQuery = dailyTaskQuery.mock.calls[0]?.[0];
    expect(taskQuery.where).not.toHaveProperty('assignedStaffId');
    expect(taskQuery.where.resident.OR).toEqual([
      { keyworkerId: 'carer-1' },
      { staff: { some: { id: 'carer-1' } } },
    ]);
  });
});
