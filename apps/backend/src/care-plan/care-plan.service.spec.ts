import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { CarePlanService } from './care-plan.service';
import { AuditService } from '../audit/audit.service';

jest.mock('@repo/db', () => ({
  prisma: {
    carePlan: { findMany: jest.fn(), count: jest.fn() },
  },
  rawPrisma: {},
}));

describe('CarePlanService.findAll', () => {
  let service: CarePlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarePlanService, { provide: AuditService, useValue: {} }],
    }).compile();
    service = module.get<CarePlanService>(CarePlanService);
    (prisma.carePlan.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.carePlan.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  it('scopes to a branch when branchId is set', async () => {
    await service.findAll('tenant-1', { branchId: 'branch-1' });

    const where = (prisma.carePlan.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where).toEqual(
      expect.objectContaining({ tenantId: 'tenant-1', branchId: 'branch-1' }),
    );
  });

  it('does not branch-filter when branchId is absent', async () => {
    await service.findAll('tenant-1', {});

    const where = (prisma.carePlan.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.branchId).toBeUndefined();
  });
});
