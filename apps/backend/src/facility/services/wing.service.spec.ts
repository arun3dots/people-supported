import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { WingService } from './wing.service';
import { AuditService } from '../../audit/audit.service';

jest.mock('@repo/db', () => ({
  prisma: {
    wing: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('WingService', () => {
  let service: WingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingService,
        { provide: AuditService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get<WingService>(WingService);
    (prisma.wing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.wing.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.wing.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllWings', () => {
    it('scopes directly by branchId — no tenantId anywhere in the filter', async () => {
      await service.findAllWings('branch-1', {});

      const where = (prisma.wing.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.branchId).toBe('branch-1');
      expect(where.tenantId).toBeUndefined();
    });

    it('applies the status filter alongside the branch scope', async () => {
      await service.findAllWings('branch-1', { status: 'Active' });

      const where = (prisma.wing.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.branchId).toBe('branch-1');
      expect(where.status).toBe('Active');
    });
  });

  describe('createWing duplicate checks', () => {
    it('throws ConflictException when creating a duplicate wing name in the same branch', async () => {
      (prisma.wing.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'wing-1',
      });

      await expect(
        service.createWing(
          { name: 'wing 1' },
          'tenant-1',
          'branch-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
