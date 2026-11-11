import { Test, TestingModule } from '@nestjs/testing';
import { ShiftRequestsService } from './shift-requests.service';
import { AuditService } from '../audit/audit.service';
import { prisma } from '@repo/db';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

jest.mock('@repo/db', () => ({
  prisma: {
    shiftRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    shiftAssignment: {
      deleteMany: jest.fn(),
    },
    shift: {
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
    },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

const mockNotificationsService = {
  triggerAlert: jest.fn().mockResolvedValue(undefined),
};

describe('ShiftRequestsService', () => {
  let service: ShiftRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftRequestsService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ShiftRequestsService>(ShiftRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new leave/shift request', async () => {
      const dto = {
        type: 'Leave' as const,
        startTime: '2026-08-10T08:00:00Z',
        endTime: '2026-08-15T18:00:00Z',
        reason: 'Annual Vacation',
      };
      const mockCreated = {
        id: 'req-1',
        ...dto,
        status: 'Pending',
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      (prisma.shiftRequest.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.create(
        dto,
        'tenant-1',
        'user-1',
        'branch-1',
      );

      expect(result).toEqual(mockCreated);
      expect(prisma.shiftRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'Leave',
          tenantId: 'tenant-1',
          userId: 'user-1',
        }),
      });
      expect(mockAuditService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CREATE',
          entityType: 'ShiftRequest',
        }),
      );
    });

    it('should create a leave request when endTime is not provided', async () => {
      const dto = {
        type: 'Leave' as const,
        startTime: '2026-08-10T08:00:00Z',
        reason: 'Day Off',
      };
      const mockCreated = {
        id: 'req-2',
        ...dto,
        endTime: new Date('2026-08-10T23:59:59.999Z'),
        status: 'Pending',
        tenantId: 'tenant-1',
        userId: 'user-1',
      };

      (prisma.shiftRequest.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.create(
        dto,
        'tenant-1',
        'user-1',
        'branch-1',
      );

      expect(result).toEqual(mockCreated);
      expect(prisma.shiftRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'Leave',
          startTime: new Date('2026-08-10T08:00:00Z'),
          endTime: expect.any(Date),
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all shift requests for tenant when admin', async () => {
      const mockRequests = [{ id: 'req-1', type: 'Leave', status: 'Pending' }];
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue(
        mockRequests,
      );

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(mockRequests);
      expect(prisma.shiftRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', userId: undefined },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter shift requests by userId for regular staff', async () => {
      const mockRequests = [
        { id: 'req-1', type: 'Leave', status: 'Pending', userId: 'user-1' },
      ];
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue(
        mockRequests,
      );

      const result = await service.findAll('tenant-1', 'user-1');

      expect(result).toEqual(mockRequests);
      expect(prisma.shiftRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should approve leave request and unassign staff from shift', async () => {
      const mockExisting = {
        id: 'req-1',
        type: 'Leave',
        status: 'Pending',
        shiftId: 'shift-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
      };
      const mockUpdated = { ...mockExisting, status: 'Approved' };

      (prisma.shiftRequest.findFirst as jest.Mock).mockResolvedValue(
        mockExisting,
      );
      (prisma.shiftRequest.update as jest.Mock).mockResolvedValue(mockUpdated);
      (prisma.shiftAssignment.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.updateStatus(
        'req-1',
        { status: 'Approved', adminNotes: 'Approved by manager' },
        'tenant-1',
        'admin-1',
      );

      expect(result).toEqual(mockUpdated);
      expect(prisma.shiftAssignment.deleteMany).toHaveBeenCalledWith({
        where: { shiftId: 'shift-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException if request not found', async () => {
      (prisma.shiftRequest.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus(
          'invalid-id',
          { status: 'Approved' },
          'tenant-1',
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
