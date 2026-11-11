import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { BedService } from './bed.service';
import { AuditService } from '../../audit/audit.service';

jest.mock('@repo/db', () => ({
  prisma: {
    room: { findFirst: jest.fn() },
    bed: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('BedService', () => {
  let service: BedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedService,
        { provide: AuditService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get<BedService>(BedService);
    (prisma.bed.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.bed.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.bed.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllBeds', () => {
    it('scopes directly by branchId — no tenant join', async () => {
      await service.findAllBeds('branch-1', {});

      const where = (prisma.bed.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.branchId).toBe('branch-1');
      expect(where.branch).toBeUndefined();
    });

    it('filters by roomId directly on the bed when supplied', async () => {
      await service.findAllBeds('branch-1', { roomId: 'room-1' });

      const where = (prisma.bed.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.roomId).toBe('room-1');
    });

    it('filters by wingId via the room relation when supplied', async () => {
      await service.findAllBeds('branch-1', { wingId: 'wing-1' });

      const where = (prisma.bed.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.room).toEqual({ wingId: 'wing-1' });
    });
  });

  describe('createBed duplicate and capacity checks', () => {
    it('throws ConflictException when creating a duplicate bedNumber in the same room', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        branchId: 'branch-1',
        roomNumber: '101',
        type: 'Double Room',
      });
      (prisma.bed.findMany as jest.Mock).mockResolvedValue([
        { id: 'bed-1', number: '101-A', code: 'BED-101-A' },
      ]);

      await expect(
        service.createBed(
          {
            roomId: 'room-1',
            bedNumber: 'Bed 101-A',
            bedCode: 'BED-101-B',
            status: 'Available',
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when adding a second bed to a Single Room', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-1',
        branchId: 'branch-1',
        roomNumber: '1',
        type: 'Single Room',
      });
      (prisma.bed.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.bed.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.bed.count as jest.Mock).mockResolvedValue(1);

      await expect(
        service.createBed(
          {
            roomId: 'room-1',
            bedNumber: 'Bed 2',
            bedCode: 'BED-1-B',
            status: 'Available',
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
