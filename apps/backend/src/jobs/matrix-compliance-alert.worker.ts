import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MatrixComplianceAlertWorker {
  private readonly logger = new Logger(MatrixComplianceAlertWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  private resolveEscalationMilestone(
    targetDate: Date,
    now: Date,
  ): { milestone: '28d' | '14d' | '7d' | '1d' | null; daysLeft: number } {
    const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / DAY_MS);
    if (daysLeft <= 1 && daysLeft >= 0) return { milestone: '1d', daysLeft };
    if (daysLeft <= 7 && daysLeft > 1) return { milestone: '7d', daysLeft };
    if (daysLeft <= 14 && daysLeft > 7) return { milestone: '14d', daysLeft };
    if (daysLeft <= 28 && daysLeft > 14) return { milestone: '28d', daysLeft };
    return { milestone: null, daysLeft };
  }

  /**
   * Daily statutory & operational Notification Matrix checks (runs at 07:30 AM):
   * - INC-005: Duty of Candour 10-day deadline (7/3/1 days escalating)
   * - CP-007: DoLS/LPS renewal approaching (28/14/7/1 days escalating High -> Critical)
   * - MH-011: MHA renewal/tribunal approaching (28/14/7/1 days escalating High -> Critical)
   * - CP-008: Care plan review due (14 days prior or review date reached)
   * - FIN-002/FIN-005: Invoice overdue
   * - RM-006: Vacancy alert (bed vacant beyond configurable threshold)
   * - CQC-001: SAF theme score drop
   */
  @Cron('30 7 * * *')
  async runDailyMatrixChecks(now: Date = new Date()): Promise<void> {
    this.logger.log('Running daily Notification Matrix checks...');
    await this.checkDutyOfCandourDeadlines(now);
    await this.checkDolsRenewals(now);
    await this.checkMhaRenewals(now);
    await this.checkCarePlanReviewsDue(now);
    await this.checkOverdueInvoices(now);
    await this.checkBedVacancyThresholds(now);
    await this.checkSafThemeScoreDrops(now);
  }

  /**
   * Hourly Rota & Staffing Notification Matrix checks:
   * - ROT-004: Staffing below minimum (Shift below safe staffing ratio)
   * - ROT-001: Shift unconfirmed (24 hrs before shift, staff not confirmed)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyRotaMatrixChecks(now: Date = new Date()): Promise<void> {
    await this.checkStaffingBelowMinimum(now);
    await this.checkUnconfirmedShifts(now);
  }

  /**
   * Matrix INC-005: Duty of Candour 10-day deadline (escalating 7/3/1 days)
   */
  async checkDutyOfCandourDeadlines(now: Date = new Date()): Promise<void> {
    const inSevenDays = new Date(now.getTime() + 7 * DAY_MS);
    const incidents = await prisma.incident.findMany({
      where: {
        dutyOfCandourApplicable: true,
        writtenNoticeSentAt: null,
        writtenNoticeDueAt: { lte: inSevenDays, gte: now },
        status: { not: 'Closed' },
        deletedAt: null,
      },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    for (const inc of incidents) {
      if (!inc.writtenNoticeDueAt) continue;
      const daysLeft = Math.ceil(
        (inc.writtenNoticeDueAt.getTime() - now.getTime()) / DAY_MS,
      );
      const milestone =
        daysLeft <= 1
          ? '1d'
          : daysLeft <= 3
            ? '3d'
            : daysLeft <= 7
              ? '7d'
              : null;
      if (!milestone) continue;

      await this.notificationsService.triggerMatrixAlert('INC-005', {
        tenantId: inc.tenantId,
        branchId: inc.branchId,
        residentId: inc.resident?.id,
        priorityOverride: daysLeft <= 1 ? 'Critical' : 'High',
        title: `DUTY OF CANDOUR (${daysLeft}d remaining): ${inc.incidentNumber}`,
        message: `Statutory 10-day written Duty of Candour notice for ${inc.resident?.fullName || 'Resident'} (${inc.incidentNumber}) is due in ${daysLeft} day(s).`,
        actionUrl: `/incidents/${inc.id}`,
        dedupeKey: `inc-005-${inc.id}-${milestone}`,
        dedupeWindowHours: 24 * 2,
        metadata: { incidentId: inc.id, daysLeft, milestone },
      });
    }
  }

  /**
   * Matrix CP-007: DoLS/LPS renewal approaching (28/14/7/1 days before expiry, High -> Critical)
   */
  async checkDolsRenewals(now: Date = new Date()): Promise<void> {
    const in28Days = new Date(now.getTime() + 28 * DAY_MS);
    const records = await prisma.dolsAuthorization.findMany({
      where: {
        status: 'Authorized',
        expiryDate: { lte: in28Days, gte: now },
      },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    for (const dols of records) {
      if (!dols.expiryDate) continue;
      const { milestone, daysLeft } = this.resolveEscalationMilestone(
        dols.expiryDate,
        now,
      );
      if (!milestone) continue;

      await this.notificationsService.triggerMatrixAlert('CP-007', {
        tenantId: dols.tenantId,
        branchId: dols.branchId,
        residentId: dols.residentId,
        priorityOverride: milestone === '1d' ? 'Critical' : 'High',
        title: `DoLS/LPS RENEWAL (${daysLeft}d): ${dols.resident.fullName}`,
        message: `DoLS/LPS authorisation for ${dols.resident.fullName} expires in ${daysLeft} day(s) (${dols.expiryDate.toLocaleDateString('en-GB')}).`,
        actionUrl: `/admin/residents/${dols.residentId}?tab=careplan`,
        dedupeKey: `cp-007-${dols.id}-${milestone}`,
        dedupeWindowHours: 24 * 5,
        metadata: { dolsId: dols.id, daysLeft, milestone },
      });
    }
  }

  /**
   * Matrix MH-011: MHA renewal/tribunal approaching (28/14/7/1 days before date, High -> Critical)
   */
  async checkMhaRenewals(now: Date = new Date()): Promise<void> {
    const in28Days = new Date(now.getTime() + 28 * DAY_MS);
    const assessments = await prisma.mentalCapacityAssessment.findMany({
      where: {
        reviewDate: { lte: in28Days, gte: now },
      },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    for (const mca of assessments) {
      if (!mca.reviewDate) continue;
      const { milestone, daysLeft } = this.resolveEscalationMilestone(
        mca.reviewDate,
        now,
      );
      if (!milestone) continue;

      await this.notificationsService.triggerMatrixAlert('MH-011', {
        tenantId: mca.tenantId,
        branchId: mca.branchId,
        residentId: mca.residentId,
        priorityOverride: milestone === '1d' ? 'Critical' : 'High',
        title: `MHA / MCA REVIEW APPROACHING (${daysLeft}d): ${mca.resident.fullName}`,
        message: `MHA/Mental Capacity review or tribunal date for ${mca.resident.fullName} (${mca.specificDecision}) is in ${daysLeft} day(s).`,
        actionUrl: `/admin/residents/${mca.residentId}?tab=careplan`,
        dedupeKey: `mh-011-${mca.id}-${milestone}`,
        dedupeWindowHours: 24 * 5,
        metadata: { assessmentId: mca.id, daysLeft, milestone },
      });
    }
  }

  /**
   * Matrix CP-008: Care plan review due (Review date reached or 14 days prior)
   */
  async checkCarePlanReviewsDue(now: Date = new Date()): Promise<void> {
    const in14Days = new Date(now.getTime() + 14 * DAY_MS);
    const plans = await prisma.carePlan.findMany({
      where: {
        status: 'Active',
        nextReviewDate: { lte: in14Days },
      },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    for (const plan of plans) {
      if (!plan.nextReviewDate) continue;
      const daysLeft = Math.ceil(
        (plan.nextReviewDate.getTime() - now.getTime()) / DAY_MS,
      );
      const isDueNow = daysLeft <= 0;
      const milestone = isDueNow ? 'due' : '14d';

      await this.notificationsService.triggerMatrixAlert('CP-008', {
        tenantId: plan.tenantId,
        branchId: plan.branchId,
        residentId: plan.residentId,
        title: isDueNow
          ? `Care Plan Review Due: ${plan.resident.fullName}`
          : `Care Plan Review in ${daysLeft} Days: ${plan.resident.fullName}`,
        message: isDueNow
          ? `Care plan (v${plan.versionNumber}) for ${plan.resident.fullName} has reached its scheduled review date.`
          : `Care plan (v${plan.versionNumber}) for ${plan.resident.fullName} is due for review on ${plan.nextReviewDate.toLocaleDateString('en-GB')}.`,
        actionUrl: `/admin/care-plans/${plan.id}`,
        dedupeKey: `cp-008-${plan.id}-${milestone}`,
        dedupeWindowHours: 24 * 7,
        metadata: { carePlanId: plan.id, daysLeft, milestone },
      });
    }
  }

  /**
   * Matrix ROT-004: Staffing below minimum (Shift below safe staffing ratio)
   */
  async checkStaffingBelowMinimum(now: Date = new Date()): Promise<void> {
    const in24Hours = new Date(now.getTime() + DAY_MS);
    const maxResidentsPerStaff = Number(process.env.SAFE_STAFFING_RATIO || 6);

    const shifts = await prisma.shift.findMany({
      where: {
        status: 'Published',
        deletedAt: null,
        startTime: { lte: in24Hours },
        endTime: { gte: now },
      },
      include: {
        type: true,
        assignments: { where: { deletedAt: null } },
      },
    });

    for (const shift of shifts) {
      const staffCount = shift.assignments.length;
      const uniqueResidents = new Set(
        shift.assignments.flatMap((a) => a.assignedResidentIds),
      ).size;

      const isUnderstaffed =
        staffCount === 0 ||
        (uniqueResidents > 0 &&
          uniqueResidents / staffCount > maxResidentsPerStaff);

      if (isUnderstaffed) {
        await this.notificationsService.triggerMatrixAlert('ROT-004', {
          tenantId: shift.tenantId,
          branchId: shift.branchId,
          title: `STAFFING BELOW MINIMUM: ${shift.type?.name || 'Shift'}`,
          message: `Shift on ${shift.startTime.toLocaleDateString('en-GB')} (${shift.type?.name || 'Rota'}) has ${staffCount} assigned staff for ${uniqueResidents} residents — below safe staffing ratio.`,
          actionUrl: `/admin/shifts`,
          dedupeKey: `rot-004-${shift.id}`,
          dedupeWindowHours: 24,
          metadata: { shiftId: shift.id, staffCount, uniqueResidents },
        });
      }
    }
  }

  /**
   * Matrix ROT-001: Shift unconfirmed (24 hrs before shift, staff not confirmed)
   */
  async checkUnconfirmedShifts(now: Date = new Date()): Promise<void> {
    const in24Hours = new Date(now.getTime() + DAY_MS);
    const shifts = await prisma.shift.findMany({
      where: {
        status: 'Draft',
        deletedAt: null,
        startTime: { gte: now, lte: in24Hours },
      },
      include: {
        type: true,
        assignments: { where: { deletedAt: null } },
      },
    });

    for (const shift of shifts) {
      const staffIds = shift.assignments.map((a) => a.userId);
      await this.notificationsService.triggerMatrixAlert('ROT-001', {
        tenantId: shift.tenantId,
        branchId: shift.branchId,
        explicitRecipientIds: staffIds,
        title: `SHIFT UNCONFIRMED (<24 HRS): ${shift.type?.name || 'Shift'}`,
        message: `Shift starting ${shift.startTime.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} remains unconfirmed with <24 hours remaining.`,
        actionUrl: `/admin/shifts`,
        dedupeKey: `rot-001-${shift.id}`,
        dedupeWindowHours: 24,
        metadata: { shiftId: shift.id },
      });
    }
  }

  /**
   * Matrix FIN-002/FIN-005: Invoice overdue (Payment past due date)
   */
  async checkOverdueInvoices(now: Date = new Date()): Promise<void> {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { notIn: ['Paid', 'Cancelled', 'Void'] },
        dueDate: { lt: now },
        deletedAt: null,
      },
      include: { resident: { select: { id: true, fullName: true } } },
    });

    const dateKey = now.toISOString().slice(0, 10);
    for (const inv of invoices) {
      await this.notificationsService.triggerMatrixAlert('FIN-002/FIN-005', {
        tenantId: inv.tenantId,
        branchId: inv.branchId,
        residentId: inv.residentId,
        title: `INVOICE OVERDUE: ${inv.invoiceNumber}`,
        message: `Invoice ${inv.invoiceNumber} (£${inv.amount.toFixed(2)}) for ${inv.resident?.fullName || 'Resident'} was due on ${inv.dueDate.toLocaleDateString('en-GB')}.`,
        actionUrl: `/admin/finance/invoices`,
        dedupeKey: `fin-002-${inv.id}-${dateKey}`,
        dedupeWindowHours: 24 * 3,
        metadata: { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber },
      });
    }
  }

  /**
   * Matrix RM-006: Vacancy alert (Bed vacant beyond configurable threshold)
   */
  async checkBedVacancyThresholds(now: Date = new Date()): Promise<void> {
    const thresholdDays = Number(process.env.VACANCY_THRESHOLD_DAYS || 7);
    const cutoff = new Date(now.getTime() - thresholdDays * DAY_MS);
    const vacantBeds = await prisma.bed.findMany({
      where: {
        status: 'Available',
        deletedAt: null,
        updatedAt: { lte: cutoff },
      },
      include: { room: { include: { wing: true } } },
    });

    const weekKey = `${now.getUTCFullYear()}-W${Math.ceil(now.getUTCDate() / 7)}`;
    for (const bed of vacantBeds) {
      const tenantId = bed.room?.wing?.tenantId;
      if (!tenantId) continue;
      const daysVacant = Math.floor(
        (now.getTime() - bed.updatedAt.getTime()) / DAY_MS,
      );
      const bedIdentifier = bed.bedLabel || bed.number || bed.id;
      await this.notificationsService.triggerMatrixAlert('RM-006', {
        tenantId,
        branchId: bed.branchId || bed.room?.branchId,
        title: `VACANCY ALERT: Bed ${bedIdentifier} (${daysVacant}d vacant)`,
        message: `Bed ${bedIdentifier} in Room ${bed.room?.roomNumber || ''} has been vacant for ${daysVacant} days (threshold: ${thresholdDays} days).`,
        actionUrl: `/admin/facilities`,
        dedupeKey: `rm-006-${bed.id}-${weekKey}`,
        dedupeWindowHours: 24 * 6,
        metadata: { bedId: bed.id, daysVacant },
      });
    }
  }

  /**
   * Matrix CQC-001: SAF theme score drop (Evidence strength declines on a theme)
   */
  async checkSafThemeScoreDrops(now: Date = new Date()): Promise<void> {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true },
    });

    const weekKey = `${now.getUTCFullYear()}-W${Math.ceil(now.getUTCDate() / 7)}`;
    for (const tenant of tenants) {
      const [overduePlans, pendingReg18, overdueRisks] = await Promise.all([
        prisma.carePlan.count({
          where: {
            tenantId: tenant.id,
            status: 'Active',
            nextReviewDate: { lt: now },
          },
        }),
        prisma.incident.count({
          where: {
            tenantId: tenant.id,
            cqcNotificationRequired: true,
            cqcNotificationSubmittedAt: null,
            deletedAt: null,
          },
        }),
        prisma.riskAssessment.count({
          where: {
            tenantId: tenant.id,
            status: 'Active',
            deletedAt: null,
            nextReviewDate: { lt: now },
          },
        }),
      ]);

      const totalDeficits = overduePlans + pendingReg18 + overdueRisks;
      if (totalDeficits > 0) {
        await this.notificationsService.triggerMatrixAlert('CQC-001', {
          tenantId: tenant.id,
          title: `CQC SAF THEME EVIDENCE DROP: Safe & Effective Care`,
          message: `Evidence strength declined across CQC Single Assessment Framework indicators (${overduePlans} overdue care plans, ${overdueRisks} overdue risk reviews, ${pendingReg18} pending Reg 18 notifications).`,
          actionUrl: `/admin/dashboard`,
          dedupeKey: `cqc-001-${tenant.id}-${weekKey}`,
          dedupeWindowHours: 24 * 6,
          metadata: { overduePlans, pendingReg18, overdueRisks },
        });
      }
    }
  }
}
