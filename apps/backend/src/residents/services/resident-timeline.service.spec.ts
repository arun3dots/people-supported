import { NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { ResidentTimelineService } from './resident-timeline.service';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: { findFirst: jest.fn() },
    careTimeline: { findMany: jest.fn() },
    dailyTask: { findMany: jest.fn() },
    residentCareTaskRecord: { findMany: jest.fn() },
  },
}));

describe('ResidentTimelineService', () => {
  const service = new ResidentTimelineService();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(prisma.resident.findFirst)
      .mockResolvedValue({ id: 'resident-1' } as Awaited<
        ReturnType<typeof prisma.resident.findFirst>
      >);
    jest.mocked(prisma.careTimeline.findMany).mockResolvedValue([]);
    jest.mocked(prisma.dailyTask.findMany).mockResolvedValue([]);
    jest.mocked(prisma.residentCareTaskRecord.findMany).mockResolvedValue([]);
  });

  it('includes new care-task outcomes with task and staff names in the timeline', async () => {
    const records = ['Done', 'Declined'].map((outcome, index) => ({
      id: `record-${index}`,
      residentId: 'resident-1',
      taskId: `task-${index}`,
      outcome,
      note: 'Support update',
      recordedById: 'staff-1',
      recordedByName: 'Sam Carer',
      recordedAt: new Date(`2026-11-13T1${index}:00:00Z`),
      task: { title: `Support task ${index}` },
    }));
    jest
      .mocked(prisma.residentCareTaskRecord.findMany)
      .mockResolvedValue(
        records as unknown as Awaited<
          ReturnType<typeof prisma.residentCareTaskRecord.findMany>
        >,
      );

    const result = await service.getTimeline('resident-1', 'tenant-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      eventType: 'CARE_TASK_DECLINED',
      title: 'Support task 1',
      status: 'Skipped',
      carer: { id: 'staff-1', fullName: 'Sam Carer' },
    });
    expect(result[1]).toMatchObject({
      eventType: 'CARE_TASK_COMPLETED',
      status: 'Completed',
    });
    expect(prisma.residentCareTaskRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          residentId: 'resident-1',
          undoneAt: null,
          task: { tenantId: 'tenant-1', residentId: 'resident-1' },
        },
      }),
    );
  });

  it('rejects residents outside the authenticated tenant before loading activity', async () => {
    jest.mocked(prisma.resident.findFirst).mockResolvedValue(null);
    await expect(service.getTimeline('resident-2', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.residentCareTaskRecord.findMany).not.toHaveBeenCalled();
    expect(prisma.careTimeline.findMany).not.toHaveBeenCalled();
  });
});
