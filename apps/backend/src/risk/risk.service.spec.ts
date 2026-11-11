import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { RiskService } from './risk.service';
import { AuditService } from '../audit/audit.service';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskAssessmentSyncService } from './risk-assessment-sync.service';

jest.mock('@repo/db', () => ({
  prisma: {
    riskAssessment: { findMany: jest.fn() },
  },
}));

describe('RiskService.findAll', () => {
  let service: RiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskService,
        { provide: AuditService, useValue: {} },
        { provide: RiskAlertsService, useValue: {} },
        {
          provide: RiskAssessmentSyncService,
          useValue: { syncRiskAssessment: jest.fn(), handleDelete: jest.fn() },
        },
      ],
    }).compile();
    service = module.get<RiskService>(RiskService);
    (prisma.riskAssessment.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('scopes the assessment list to a branch when branchId is set', async () => {
    await service.findAll('tenant-1', { branchId: 'branch-1' });

    expect(prisma.riskAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          deletedAt: null,
          branchId: 'branch-1',
        }),
      }),
    );
  });

  it('does not branch-filter when branchId is absent', async () => {
    await service.findAll('tenant-1', {});

    const where = (prisma.riskAssessment.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.branchId).toBeUndefined();
  });
});
