import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';

@Injectable()
export class HydrationAlertWorker {
  private readonly logger = new Logger(HydrationAlertWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * G-07: Daily Fluid Target & Dehydration Risk Alerts (CQC Regulation 14).
   * Scheduled at 15:00 and 18:00 daily for afternoon and evening hydration checks.
   */
  @Cron('0 15,18 * * *')
  async runScheduledHydrationAlerts() {
    this.logger.log('Starting scheduled daily fluid intake evaluation...');
    await this.checkHydrationAlerts();
  }

  async checkHydrationAlerts(targetTenantId?: string, overrideHour?: number) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyTargetMl = 2000;
    const currentHour =
      overrideHour !== undefined ? overrideHour : now.getHours();

    const tenantFilter = targetTenantId
      ? { id: targetTenantId }
      : { status: 'Active' };
    const tenants = await prisma.tenant.findMany({
      where: tenantFilter,
      select: { id: true },
    });

    let totalAlertsDispatched = 0;

    for (const tenant of tenants) {
      const activeResidents = await prisma.resident.findMany({
        where: {
          tenantId: tenant.id,
          status: 'Active',
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          branchId: true,
        },
      });

      if (activeResidents.length === 0) continue;

      for (const resident of activeResidents) {
        const dayAgg = await prisma.foodFluidLog.aggregate({
          where: {
            residentId: resident.id,
            tenantId: tenant.id,
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

        if (isAfternoonRisk || isEveningRisk || isCriticalMidday) {
          const staffRecipients = await prisma.user.findMany({
            where: {
              tenantId: tenant.id,
              role: { name: { in: ['Nurse', 'Carer', 'Manager'] } },
              isActive: true,
            },
            select: { id: true },
            take: 10,
          });

          const pseudonymized = formatPseudonymizedResident(
            resident.fullName,
            resident.id,
          );

          const priority = totalFluid < 500 ? 'Urgent' : 'High';

          for (const staff of staffRecipients) {
            await this.notificationsService
              .triggerAlert({
                tenantId: tenant.id,
                recipientId: staff.id,
                title: 'HYDRATION ALERT: LOW FLUID INTAKE',
                message: `${pseudonymized} has consumed only ${totalFluid}ml (${percentageCompleted}% of 2000ml target) today. Prompt fluid offering advised (CQC Reg 14).`,
                category: 'CLINICAL',
                priority,
                actionUrl: `/residents/${resident.id}/food-fluid`,
                preferPushOverEmail: true,
                metadata: {
                  residentId: resident.id,
                  totalFluidMl: totalFluid,
                  percentageCompleted,
                },
              })
              .catch(() => {});
            totalAlertsDispatched++;
          }
        }
      }
    }

    this.logger.log(
      `Hydration alert check completed. Dispatched ${totalAlertsDispatched} alerts.`,
    );
    return totalAlertsDispatched;
  }
}
