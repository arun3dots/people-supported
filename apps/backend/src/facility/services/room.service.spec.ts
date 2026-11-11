import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { RoomService } from './room.service';
import { AuditService } from '../../audit/audit.service';

jest.mock('@repo/db', () => ({
  prisma: {
    wing: { findFirst: jest.fn() },
    room: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: AuditService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get<RoomService>(RoomService);
    (prisma.room.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.room.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllRooms', () => {
    it('scopes directly by branchId — no tenant join', async () => {
      await service.findAllRooms('branch-1', {});

      const where = (prisma.room.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.branchId).toBe('branch-1');
      expect(where.branch).toBeUndefined();
    });

    it('filters by wingId directly on the room when supplied', async () => {
      await service.findAllRooms('branch-1', { wingId: 'wing-1' });

      const where = (prisma.room.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.wingId).toBe('wing-1');
    });
  });

  describe('createRoom & updateRoom duplicate checks', () => {
    it('throws ConflictException when creating a duplicate room in the same wing', async () => {
      (prisma.wing.findFirst as jest.Mock).mockResolvedValue({
        id: 'wing-1',
        branchId: 'branch-1',
      });
      (prisma.room.findMany as jest.Mock).mockResolvedValue([
        { id: 'room-1', roomNumber: '1', name: null, code: null },
      ]);

      await expect(
        service.createRoom(
          { wingId: 'wing-1', roomNumber: 'Room 1', type: 'Single Room' },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when updating a room to a duplicate roomNumber in the same wing', async () => {
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'room-2',
        wingId: 'wing-1',
        roomNumber: '2',
      });
      (prisma.room.findMany as jest.Mock).mockResolvedValue([
        { id: 'room-1', roomNumber: '1', name: null, code: null },
      ]);

      await expect(
        service.updateRoom('room-2', { roomNumber: '1' }, 'tenant-1', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
