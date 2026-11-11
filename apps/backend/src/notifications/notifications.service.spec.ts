import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { prisma } from '@repo/db';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_MATRIX } from './notification-matrix';

jest.mock('@repo/db', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    shiftAssignment: {
      findMany: jest.fn(),
    },
  },
  Prisma: {},
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  const mockQueue = { add: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: 'n1', isRead: false },
    ]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(1);
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.notification.create as jest.Mock).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'created-n1',
        ...data,
      }),
    );
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.shiftAssignment.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getNotifications', () => {
    it('returns the standard paginated envelope', async () => {
      const result = await service.getNotifications('user-1', undefined, {
        page: 2,
        limit: 5,
      });

      expect(result).toMatchObject({
        data: [{ id: 'n1' }],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
        hasPreviousPage: true,
        hasNextPage: false,
      });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('scopes a branch-assigned user to their active branch plus tenant-wide rows', async () => {
      await service.getNotifications('user-1', 'branch-1', {});

      const where = (prisma.notification.findMany as jest.Mock).mock.calls[0][0]
        .where;
      expect(where.recipientId).toBe('user-1');
      expect(where.AND).toEqual([
        { OR: [{ branchId: 'branch-1' }, { branchId: null }] },
      ]);
    });

    it('does not branch-scope a user with no active branch', async () => {
      await service.getNotifications('user-1', undefined, {});

      const where = (prisma.notification.findMany as jest.Mock).mock.calls[0][0]
        .where;
      expect(where.AND).toBeUndefined();
      expect(where.recipientId).toBe('user-1');
    });

    it('applies the isRead filter', async () => {
      await service.getNotifications('user-1', undefined, { isRead: false });

      const where = (prisma.notification.findMany as jest.Mock).mock.calls[0][0]
        .where;
      expect(where.isRead).toBe(false);
    });

    it('bypasses pagination and skips the count query when all=true', async () => {
      const result = await service.getNotifications('user-1', undefined, {
        all: true,
      });

      expect(prisma.notification.count).not.toHaveBeenCalled();
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: undefined, take: undefined }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('NOTIFICATION_MATRIX & triggerMatrixAlert', () => {
    it('defines all 20 official notification matrix rows', () => {
      const expectedCodes = [
        'EMAR-001',
        'EMAR-007',
        'EMAR-004',
        'MH-001',
        'MH-009',
        'MH-007',
        'INC-004',
        'INC-003',
        'INC-005',
        'INC-006',
        'CP-007',
        'MH-011',
        'CP-008',
        'HR-002',
        'HR-004',
        'ROT-004',
        'ROT-001',
        'FIN-002/FIN-005',
        'RM-006',
        'CQC-001',
      ];
      expect(Object.keys(NOTIFICATION_MATRIX)).toEqual(expectedCodes);
    });

    it('persists in-app notifications even when no external channels are active (e.g. CP-008)', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mgr-1',
          email: 'mgr@care.co.uk',
          notificationPreference: null,
          pushTokens: [],
          profile: null,
        },
      ]);

      await service.triggerMatrixAlert('CP-008', {
        tenantId: 'tenant-1',
        title: '[CP-008] Care Plan Review Due',
        message: 'Care plan review due in 14 days',
        dedupeKey: 'cp008:plan-1:14d',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            recipientId: 'mgr-1',
            category: 'CLINICAL',
            priority: 'Medium',
          }),
        }),
      );
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('skips duplicate alert within deduplication window', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'mgr-1', email: 'mgr@care.co.uk' },
      ]);
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-notif',
      });

      await service.triggerMatrixAlert('RM-006', {
        tenantId: 'tenant-1',
        title: '[RM-006] Bed Vacancy Alert',
        message: 'Bed vacant for 10 days',
        dedupeKey: 'rm006:bed-1:2026-11-04',
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
});
