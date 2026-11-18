import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import { ShiftOverrunWorker } from './shift-overrun.worker';

jest.mock('@repo/db', () => ({
  prisma: {
    staffShiftLog: {
      findMany: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe('ShiftOverrunWorker', () => {
  let worker: ShiftOverrunWorker;
  let mockNotificationsService: { triggerAlert: jest.Mock };

  const now = new Date('2026-10-29T15:15:00.000Z');

  beforeEach(async () => {
    mockNotificationsService = {
      triggerAlert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftOverrunWorker,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    worker = module.get<ShiftOverrunWorker>(ShiftOverrunWorker);
    jest.clearAllMocks();
  });

  it('notifies respective branch admins and shift creator when shift overruns past grace period without a continuous shift', async () => {
    (prisma.staffShiftLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'log-1',
        userId: 'carer-1',
        user: { id: 'carer-1', fullName: 'Jane Doe' },
        shift: {
          id: 'shift-1',
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          startTime: new Date('2026-10-29T07:00:00.000Z'),
          endTime: new Date('2026-10-29T15:00:00.000Z'),
          status: 'Published',
          deletedAt: null,
          createdById: 'creator-1',
          type: { name: 'Day Shift' },
        },
      },
    ]);
    (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'admin-1' },
      { id: 'creator-1' },
    ]);

    await worker.handleShiftOverruns(now);

    expect(mockNotificationsService.triggerAlert).toHaveBeenCalledTimes(2);
    expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        recipientId: 'admin-1',
        category: 'ROTA',
        actionUrl: '/admin/staff/rota',
        dedupeKey: 'shift-overrun-log-1',
        dedupeWindowHours: 24 * 30,
      }),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        isActive: true,
        OR: [
          {
            role: { name: { in: ['Admin', 'Manager'] } },
            OR: [
              { branches: { some: { branchId: 'branch-1' } } },
              { branches: { none: {} } },
            ],
          },
          { id: 'creator-1' },
        ],
      },
      select: { id: true },
    });
  });

  it('skips overrun notification when the carer has a continuous shift within 30 minutes', async () => {
    (prisma.staffShiftLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'log-1',
        userId: 'carer-1',
        user: { id: 'carer-1', fullName: 'Jane Doe' },
        shift: {
          id: 'shift-1',
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          startTime: new Date('2026-10-29T07:00:00.000Z'),
          endTime: new Date('2026-10-29T15:00:00.000Z'),
          status: 'Published',
          deletedAt: null,
          createdById: 'creator-1',
          type: { name: 'Day Shift' },
        },
      },
    ]);
    (prisma.shift.findFirst as jest.Mock).mockResolvedValue({
      id: 'shift-2',
      startTime: new Date('2026-10-29T15:15:00.000Z'),
      endTime: new Date('2026-10-29T23:00:00.000Z'),
      status: 'Published',
      deletedAt: null,
    });

    await worker.handleShiftOverruns(now);

    expect(mockNotificationsService.triggerAlert).not.toHaveBeenCalled();
  });
});
