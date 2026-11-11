import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { DepartmentService } from './department.service';

jest.mock('@repo/db', () => ({
  prisma: {
    department: { findMany: jest.fn() },
  },
}));

describe('DepartmentService.getDepartments', () => {
  let service: DepartmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentService],
    }).compile();
    service = module.get<DepartmentService>(DepartmentService);
    (prisma.department.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('includes branch-specific and tenant-wide (branchId null) departments when branchId is set', async () => {
    await service.getDepartments('tenant-1', 'branch-1');

    const where = (prisma.department.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.OR).toEqual([{ branchId: 'branch-1' }, { branchId: null }]);
  });

  it('does not branch-filter when branchId is absent', async () => {
    await service.getDepartments('tenant-1');

    const where = (prisma.department.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.OR).toBeUndefined();
  });
});
