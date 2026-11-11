import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { BranchesService } from './branches.service';
import { AuditService } from '../audit/audit.service';

jest.mock('@repo/db', () => ({
  prisma: {
    branch: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    wing: { count: jest.fn() },
    resident: { count: jest.fn() },
  },
  Branch: {},
}));

describe('BranchesService', () => {
  let service: BranchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: AuditService, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get<BranchesService>(BranchesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findBranchById', () => {
    it('returns the branch scoped to the tenant, excluding soft-deleted', async () => {
      (prisma.branch.findFirst as jest.Mock).mockResolvedValue({
        id: 'b1',
        name: 'Riverside',
      });

      const result = await service.findBranchById('b1', 'tenant-1');

      expect(result).toMatchObject({ id: 'b1' });
      expect(prisma.branch.findFirst).toHaveBeenCalledWith({
        where: { id: 'b1', tenantId: 'tenant-1', deletedAt: null },
      });
    });

    it('throws NotFoundException when the branch is missing or in another tenant', async () => {
      (prisma.branch.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findBranchById('b1', 'tenant-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteBranch', () => {
    it('soft-deletes (sets deletedAt) rather than removing the row', async () => {
      (prisma.wing.count as jest.Mock).mockResolvedValue(0);
      (prisma.resident.count as jest.Mock).mockResolvedValue(0);
      (prisma.branch.findFirst as jest.Mock).mockResolvedValue({ id: 'b1' });
      (prisma.branch.update as jest.Mock).mockResolvedValue({ id: 'b1' });

      await service.deleteBranch('b1', 'tenant-1', 'user-1');

      expect(prisma.branch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'b1', tenantId: 'tenant-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            deletedById: 'user-1',
          }),
        }),
      );
    });

    it('refuses to delete a branch that still has wings', async () => {
      (prisma.wing.count as jest.Mock).mockResolvedValue(2);

      await expect(
        service.deleteBranch('b1', 'tenant-1', 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.branch.update).not.toHaveBeenCalled();
    });
  });
});
