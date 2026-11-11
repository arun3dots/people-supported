import { HydrationAlertWorker } from './hydration-alert.worker';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn(),
    },
    resident: {
      findMany: jest.fn(),
    },
    foodFluidLog: {
      aggregate: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockNotificationsService = {
  triggerAlert: jest.fn().mockResolvedValue(undefined),
};

describe('HydrationAlertWorker (G-07 Daily Fluid Target Alerts - CQC Reg 14)', () => {
  let worker: HydrationAlertWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new HydrationAlertWorker(mockNotificationsService as any);
  });

  it('should dispatch hydration alert when fluid intake is below target', async () => {
    (prisma.tenant.findMany as jest.Mock).mockResolvedValue([
      { id: 'tenant-1' },
    ]);
    (prisma.resident.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'res-1',
        fullName: 'Arthur Pendelton',
        branchId: 'branch-1',
      },
    ]);
    // Only 300ml consumed (severely low)
    (prisma.foodFluidLog.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 300 },
    });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'nurse-1' },
      { id: 'carer-1' },
    ]);

    const count = await worker.checkHydrationAlerts('tenant-1', 15);

    expect(count).toBe(2);
    expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'HYDRATION ALERT: LOW FLUID INTAKE',
        category: 'CLINICAL',
        priority: 'Urgent',
        metadata: expect.objectContaining({
          residentId: 'res-1',
          totalFluidMl: 300,
        }),
      }),
    );
  });

  it('should not dispatch alert when fluid intake is adequate', async () => {
    (prisma.tenant.findMany as jest.Mock).mockResolvedValue([
      { id: 'tenant-1' },
    ]);
    (prisma.resident.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'res-2',
        fullName: 'Beatrice Webb',
        branchId: 'branch-1',
      },
    ]);
    // 1800ml consumed (well on track)
    (prisma.foodFluidLog.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 1800 },
    });

    const count = await worker.checkHydrationAlerts('tenant-1');

    expect(count).toBe(0);
    expect(mockNotificationsService.triggerAlert).not.toHaveBeenCalled();
  });
});
