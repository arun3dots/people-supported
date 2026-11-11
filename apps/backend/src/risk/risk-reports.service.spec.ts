import { prisma } from '@repo/db';
import { RiskReportsService } from './risk-reports.service';

jest.mock('@repo/db', () => ({
  prisma: {
    riskAssessment: { findMany: jest.fn() },
  },
}));

describe('RiskReportsService.getOverview', () => {
  const service = new RiskReportsService();

  afterEach(() => jest.clearAllMocks());

  it('narrows the summary to a branch when branchId is given', async () => {
    (prisma.riskAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await service.getOverview('tenant-1', 'branch-1');

    expect(prisma.riskAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
        }),
      }),
    );
  });

  it('does not filter by branch when branchId is omitted', async () => {
    (prisma.riskAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await service.getOverview('tenant-1');

    const where = (prisma.riskAssessment.findMany as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.branchId).toBeUndefined();
    expect(where.tenantId).toBe('tenant-1');
  });
});
