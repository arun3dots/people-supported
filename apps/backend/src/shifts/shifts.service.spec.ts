import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsService } from './shifts.service';
import { AuditService } from '../audit/audit.service';
import { prisma } from '@repo/db';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('@repo/db', () => ({
  prisma: {
    shiftType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    shift: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    shiftAssignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

describe('ShiftsService', () => {
  let service: ShiftsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createType', () => {
    it('should create a shift type template', async () => {
      const dto = {
        name: 'Morning Shift',
        startTime: '06:00',
        endTime: '15:00',
        color: '#4A706A',
      };
      const mockCreated = { id: 'type-1', ...dto, tenantId: 'tenant-1' };

      (prisma.shiftType.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.createType(
        dto,
        'tenant-1',
        'branch-1',
        'admin-1',
      );

      expect(result).toEqual(mockCreated);
      expect(prisma.shiftType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Morning Shift',
          tenantId: 'tenant-1',
          branchId: 'branch-1',
        }),
      });
      expect(mockAuditService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CREATE',
          entityType: 'ShiftType',
        }),
      );
    });
  });

  describe('create', () => {
    it('rejects a shift whose end timestamp is before its start timestamp', async () => {
      const dto = {
        startTime: '2030-10-30T18:30:00.000Z',
        endTime: '2030-10-29T18:30:00.000Z',
        status: 'Published',
        userIds: [],
        residentIds: [],
      };

      await expect(
        service.create(dto as any, 'tenant-1', 'branch-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.shift.create).not.toHaveBeenCalled();
    });

    it('sets branchId on the created shift — regression test for the missing-branchId bug', async () => {
      const dto = {
        typeId: 'type-1',
        wingId: 'none',
        unitId: 'none',
        roomId: 'none',
        startTime: '2032-05-01T08:00:00Z',
        endTime: '2032-05-01T20:00:00Z',
        status: 'Draft',
        userIds: [],
        residentIds: [],
      };
      const mockCreated = {
        id: 'shift-1',
        ...dto,
        tenantId: 't1',
        branchId: 'branch-1',
      };
      (prisma.shift.create as jest.Mock).mockResolvedValue(mockCreated);

      await service.create(dto as any, 'tenant-1', 'branch-1', 'admin-1');

      // Shift.branchId is a mandatory, non-nullable column — omitting it
      // makes prisma.shift.create throw, which is exactly what silently
      // broke the "Create Schedule" button in the rota UI.
      expect(prisma.shift.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            branchId: 'branch-1',
          }),
        }),
      );
    });

    it('overrides any branchId sent by the client with the resolved one', async () => {
      const dto = {
        startTime: '2032-05-01T08:00:00Z',
        endTime: '2032-05-01T20:00:00Z',
        status: 'Draft',
        branchId: 'client-supplied-branch',
      };
      (prisma.shift.create as jest.Mock).mockResolvedValue({ id: 'shift-1' });

      await service.create(dto as any, 'tenant-1', 'branch-1', 'admin-1');

      const data = (prisma.shift.create as jest.Mock).mock.calls[0][0].data;
      expect(data.branchId).toBe('branch-1');
    });
  });

  describe('findAllTypes', () => {
    it('should return all shift types for a tenant', async () => {
      const mockTypes = [
        { id: 'type-1', name: 'Morning Shift', tenantId: 'tenant-1' },
      ];
      (prisma.shiftType.findMany as jest.Mock).mockResolvedValue(mockTypes);

      const result = await service.findAllTypes('tenant-1');

      expect(result).toEqual(mockTypes);
      expect(prisma.shiftType.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', deletedAt: null },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('deleteType', () => {
    it('should soft delete a shift type template', async () => {
      (prisma.shift.findMany as jest.Mock).mockResolvedValue([]);
      ((prisma.shiftType as any).updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.deleteType('type-1', 'tenant-1', 'admin-1');

      expect((prisma.shiftType as any).updateMany).toHaveBeenCalledWith({
        where: { id: 'type-1', tenantId: 'tenant-1', deletedAt: null },
        data: expect.objectContaining({
          deletedById: 'admin-1',
        }),
      });
    });

    it('should throw NotFoundException if shift type does not exist', async () => {
      (prisma.shift.findMany as jest.Mock).mockResolvedValue([]);
      ((prisma.shiftType as any).updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      await expect(
        service.deleteType('invalid-id', 'tenant-1', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignStaff', () => {
    it('should assign a staff member to a shift', async () => {
      const dto = {
        shiftId: 'shift-1',
        userId: 'staff-1',
        role: 'Nurse',
      };
      const mockAssignment = {
        id: 'assign-1',
        ...dto,
        shift: { id: 'shift-1' },
        user: { id: 'staff-1' },
      };

      (prisma.shift.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'shift-1',
          startTime: new Date(Date.now() + 86400000),
          endTime: new Date(Date.now() + 172800000),
        })
        .mockResolvedValueOnce(null);
      (prisma.shiftAssignment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.shiftAssignment.create as jest.Mock).mockResolvedValue(
        mockAssignment,
      );

      const result = await service.assignStaff(dto, 'tenant-1', 'admin-1');

      expect(result).toEqual(mockAssignment);
      expect(prisma.shiftAssignment.create).toHaveBeenCalled();
      expect(mockAuditService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CREATE',
          entityType: 'ShiftAssignment',
        }),
      );
    });
  });

  describe('unassignStaff', () => {
    it('should unassign a staff member from a shift', async () => {
      const mockAssignment = {
        id: 'assign-1',
        shift: { tenantId: 'tenant-1' },
      };
      (prisma.shiftAssignment.findUnique as jest.Mock).mockResolvedValue(
        mockAssignment,
      );
      (prisma.shiftAssignment.delete as jest.Mock).mockResolvedValue(
        mockAssignment,
      );

      await service.unassignStaff('assign-1', 'tenant-1', 'admin-1');

      expect(prisma.shiftAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
      });
    });
  });
});
