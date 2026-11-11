import { Injectable, Logger } from '@nestjs/common';
import { rawPrisma, RawPrismaTransactionClient } from '@repo/db';
import { startOfDay, endOfDay } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from '../audit/audit.service';
import { calculateDueAt, isTaskDueOnDate } from './utils/task-generator.utils';

@Injectable()
export class CarePlanTaskGeneratorService {
  private readonly logger = new Logger(CarePlanTaskGeneratorService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Generates DailyTask occurrences for a specific resident based on their active CarePlan tasks
   */
  async generateTasksForResident(
    residentId: string,
    date: Date = new Date(),
    tx: RawPrismaTransactionClient | typeof rawPrisma = rawPrisma,
  ) {
    const carePlanTasks = await tx.carePlanTask.findMany({
      where: {
        residentId,
        isActive: true,
        status: 'Active',
        carePlan: { status: 'Active' },
      },
    });

    const start = startOfDay(date);
    const end = endOfDay(date);

    for (const cpTask of carePlanTasks) {
      if (!isTaskDueOnDate(cpTask.frequency, date, cpTask.createdAt)) {
        continue;
      }

      const timeSlots =
        cpTask.timeOfDay && cpTask.timeOfDay.length > 0
          ? cpTask.timeOfDay
          : ['AllDay'];
      for (const slot of timeSlots) {
        const existing = await tx.dailyTask.findFirst({
          where: {
            carePlanTaskId: cpTask.id,
            scheduledDate: { gte: start, lte: end },
            timeSlot: slot,
          },
        });

        if (!existing) {
          const dueAt = calculateDueAt(date, cpTask.targetTime, slot);
          await tx.dailyTask.create({
            data: {
              residentId,
              carePlanTaskId: cpTask.id,
              title: cpTask.title,
              description: cpTask.description,
              instructions: cpTask.instructions,
              precautions: cpTask.precautions,
              category: cpTask.category,
              priority: cpTask.priority,
              targetTime: cpTask.targetTime,
              assignedStaffId: cpTask.assignedStaffId,
              scheduledDate: start,
              dueAt,
              timeSlot: slot,
              status: 'Pending',
            },
          });
        }
      }
    }
  }

  /**
   * Generates daily tasks for all active residents in a tenant
   */
  async generateAllDailyTasks(tenantId: string, date: Date = new Date()) {
    const residents = await rawPrisma.resident.findMany({
      where: { tenantId, status: 'Active' },
      select: { id: true },
    });

    for (const resident of residents) {
      await this.generateTasksForResident(resident.id, date);
    }
  }

  /**
   * Cron scheduled nightly at midnight to ensure all task occurrences are pre-generated
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyTasksCRON() {
    this.logger.debug(
      'Running nightly generation of tasks for active care plans...',
    );

    const activePlans = await rawPrisma.carePlan.findMany({
      where: { status: 'Active' },
      include: { tasks: { where: { status: 'Active', isActive: true } } },
    });

    const today = new Date();

    for (const plan of activePlans) {
      await this.generateTasksForResident(plan.residentId, today);
    }
  }

  /**
   * Cron scheduled nightly at 1 AM to check and expire care plans where validTo has passed
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkAndExpireCarePlansCRON() {
    this.logger.debug('Running nightly check for expired care plans...');
    const today = new Date();

    const expiredPlans = await rawPrisma.carePlan.findMany({
      where: { status: 'Active', validTo: { lte: today } },
    });

    for (const plan of expiredPlans) {
      await rawPrisma.carePlan.update({
        where: { id: plan.id },
        data: { status: 'Expired', expiredAt: today },
      });

      await this.auditService.emitCarePlan({
        tenantId: plan.tenantId,
        userId: 'SYSTEM',
        entityId: plan.id,
        residentId: plan.residentId,
        actionType: 'EXPIRED',
        description: `Care plan v${String(plan.versionNumber).padStart(4, '0')} reached validity end date and expired.`,
        newValue: { status: 'Expired' },
      });
    }
  }

  /**
   * Automatically triggers clinical risk tasks based on BAPEN MUST and Waterlow scores
   * In compliance with CQC Regulation 12 (Safe Care & Treatment)
   */
  async generateClinicalRiskTasks(
    residentId: string,
    mustScore?: number,
    waterlowScore?: number,
    tx: RawPrismaTransactionClient | typeof rawPrisma = rawPrisma,
  ) {
    const activePlan = await tx.carePlan.findFirst({
      where: { residentId, status: 'Active' },
      select: { id: true, tenantId: true, branchId: true },
    });

    if (!activePlan) return;

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. MUST High Risk (Score >= 2): Auto-schedule Daily Food & Fluid Intake Charting
    if (mustScore !== undefined && mustScore >= 2) {
      let foodCpTask = await tx.carePlanTask.findFirst({
        where: {
          carePlanId: activePlan.id,
          title: 'Food Intake Charting (BAPEN MUST High Risk)',
        },
      });

      if (!foodCpTask) {
        foodCpTask = await tx.carePlanTask.create({
          data: {
            tenantId: activePlan.tenantId,
            branchId: activePlan.branchId,
            residentId,
            carePlanId: activePlan.id,
            title: 'Food Intake Charting (BAPEN MUST High Risk)',
            description:
              'Record all meals and snacks consumed to monitor calorie intake.',
            instructions: 'Document portion sizes consumed in dietary log.',
            precautions:
              'Alert nurse or senior carer if resident consumes less than 50% of 2 consecutive meals.',
            category: 'Nutrition',
            priority: 'High',
            frequency: 'Daily',
            timeOfDay: ['AllDay'],
            status: 'Active',
            isActive: true,
          },
        });
      }

      const existingFoodTask = await tx.dailyTask.findFirst({
        where: {
          carePlanTaskId: foodCpTask.id,
          scheduledDate: { gte: start, lte: end },
        },
      });

      if (!existingFoodTask) {
        await tx.dailyTask.create({
          data: {
            residentId,
            carePlanTaskId: foodCpTask.id,
            title: foodCpTask.title,
            description: foodCpTask.description,
            instructions: foodCpTask.instructions,
            precautions: foodCpTask.precautions,
            category: foodCpTask.category,
            priority: foodCpTask.priority,
            targetTime: '18:00',
            scheduledDate: start,
            dueAt: calculateDueAt(today, '18:00', 'AllDay'),
            timeSlot: 'AllDay',
            status: 'Pending',
          },
        });
      }

      let fluidCpTask = await tx.carePlanTask.findFirst({
        where: {
          carePlanId: activePlan.id,
          title: 'Fluid Balance Monitoring (BAPEN MUST High Risk)',
        },
      });

      if (!fluidCpTask) {
        fluidCpTask = await tx.carePlanTask.create({
          data: {
            tenantId: activePlan.tenantId,
            branchId: activePlan.branchId,
            residentId,
            carePlanId: activePlan.id,
            title: 'Fluid Balance Monitoring (BAPEN MUST High Risk)',
            description:
              'Chart all fluid intake throughout shift towards 1500ml-2000ml daily target.',
            instructions:
              'Record volume in millilitres (ml) immediately after giving drink.',
            precautions:
              'Encourage sips between meals. Report if daily intake is under 1000ml by 16:00.',
            category: 'Nutrition',
            priority: 'High',
            frequency: 'Daily',
            timeOfDay: ['AllDay'],
            status: 'Active',
            isActive: true,
          },
        });
      }

      const existingFluidTask = await tx.dailyTask.findFirst({
        where: {
          carePlanTaskId: fluidCpTask.id,
          scheduledDate: { gte: start, lte: end },
        },
      });

      if (!existingFluidTask) {
        await tx.dailyTask.create({
          data: {
            residentId,
            carePlanTaskId: fluidCpTask.id,
            title: fluidCpTask.title,
            description: fluidCpTask.description,
            instructions: fluidCpTask.instructions,
            precautions: fluidCpTask.precautions,
            category: fluidCpTask.category,
            priority: fluidCpTask.priority,
            targetTime: '20:00',
            scheduledDate: start,
            dueAt: calculateDueAt(today, '20:00', 'AllDay'),
            timeSlot: 'AllDay',
            status: 'Pending',
          },
        });
      }
    }

    // 2. Waterlow High / Very High Risk (Score >= 15): Auto-schedule Repositioning & Skin Checks
    if (waterlowScore !== undefined && waterlowScore >= 15) {
      let repositionCpTask = await tx.carePlanTask.findFirst({
        where: {
          carePlanId: activePlan.id,
          title: 'Repositioning & Pressure Relief',
        },
      });

      if (!repositionCpTask) {
        repositionCpTask = await tx.carePlanTask.create({
          data: {
            tenantId: activePlan.tenantId,
            branchId: activePlan.branchId,
            residentId,
            carePlanId: activePlan.id,
            title: 'Repositioning & Pressure Relief',
            description:
              'Assist resident to alter posture to relieve pressure on sacrum, heels, and hips.',
            instructions:
              'Use slide sheets and 30-degree tilt. Ensure heels are offloaded.',
            precautions:
              'Check skin for non-blanching erythema (Grade 1). Never drag resident.',
            category: 'Mobility',
            priority: 'High',
            frequency: 'Daily',
            timeOfDay: ['Morning', 'Afternoon', 'Evening', 'Night'],
            status: 'Active',
            isActive: true,
          },
        });
      }

      const slots = ['Morning', 'Afternoon', 'Evening', 'Night'];
      for (const slot of slots) {
        const existingRepositionTask = await tx.dailyTask.findFirst({
          where: {
            carePlanTaskId: repositionCpTask.id,
            scheduledDate: { gte: start, lte: end },
            timeSlot: slot,
          },
        });

        if (!existingRepositionTask) {
          const targetTime =
            slot === 'Morning'
              ? '10:00'
              : slot === 'Afternoon'
                ? '14:00'
                : slot === 'Evening'
                  ? '18:00'
                  : '22:00';
          await tx.dailyTask.create({
            data: {
              residentId,
              carePlanTaskId: repositionCpTask.id,
              title: `Repositioning & Pressure Relief (${slot})`,
              description: repositionCpTask.description,
              instructions: repositionCpTask.instructions,
              precautions: repositionCpTask.precautions,
              category: repositionCpTask.category,
              priority: repositionCpTask.priority,
              targetTime,
              scheduledDate: start,
              dueAt: calculateDueAt(today, targetTime, slot),
              timeSlot: slot,
              status: 'Pending',
            },
          });
        }
      }
    }
  }
}
