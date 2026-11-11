import { prisma } from '@repo/db';

export async function evaluateTenantDehydrationRisks(tenantId: string) {
  const activeResidents = await prisma.resident.findMany({
    where: {
      tenantId,
      status: 'Active',
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      branchId: true,
    },
  });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const dailyTargetMl = 2000;
  const currentHour = now.getHours();
  const atRiskResidents = [];

  for (const resident of activeResidents) {
    const dayAgg = await prisma.foodFluidLog.aggregate({
      where: {
        residentId: resident.id,
        tenantId,
        type: 'Fluid',
        timestamp: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    const totalFluid = dayAgg._sum.amount ?? 0;
    const percentageCompleted = Math.min(
      Math.round((totalFluid / dailyTargetMl) * 100),
      100,
    );

    const isAfternoonRisk = currentHour >= 14 && totalFluid < 800;
    const isEveningRisk = currentHour >= 17 && totalFluid < 1300;
    const isCriticalMidday = currentHour >= 12 && totalFluid < 500;

    const isDehydrationRisk =
      isAfternoonRisk || isEveningRisk || isCriticalMidday;

    if (isDehydrationRisk) {
      atRiskResidents.push({
        residentId: resident.id,
        fullName: resident.fullName,
        branchId: resident.branchId,
        totalFluidMl: totalFluid,
        dailyTargetMl,
        deficitMl: Math.max(dailyTargetMl - totalFluid, 0),
        percentageCompleted,
        severity: totalFluid < 500 ? ('High' as const) : ('Medium' as const),
      });
    }
  }

  return atRiskResidents;
}
