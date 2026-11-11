import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateFoodFluidLogDTO,
  UpdateFoodFluidLogDTO,
  FoodFluidLogQueryDTO,
  FoodFluidSummaryDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import { evaluateTenantDehydrationRisks } from './resident-food-fluid.util';

@Injectable()
export class ResidentFoodFluidService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Record a food or fluid intake entry (CQC Regulation 14 & NICE CG32).
   */
  async recordFoodFluid(
    residentId: string,
    tenantId: string,
    userId: string,
    dto: CreateFoodFluidLogDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true, fullName: true, branchId: true, status: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (resident.status === 'Discharged' || resident.status === 'Deceased') {
      throw new BadRequestException(
        'Cannot record intake for inactive resident',
      );
    }

    const logDate = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate current day's total before this entry
    const dayAgg = await prisma.foodFluidLog.aggregate({
      where: {
        residentId,
        tenantId,
        type: dto.type,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      _sum: { amount: true },
    });

    const previousTotal = dayAgg._sum.amount ?? 0;
    const newTotal = previousTotal + dto.amount;

    const log = await prisma.foodFluidLog.create({
      data: {
        tenantId,
        branchId: resident.branchId,
        residentId,
        type: dto.type,
        amount: dto.amount,
        unit: dto.unit,
        dailyTotal: newTotal,
        mealSlot: dto.mealSlot,
        intakePercentage: dto.intakePercentage,
        notes: dto.notes,
        timestamp: logDate,
        createdById: userId,
      },
    });

    // Create care timeline event for real-time shift handover visibility
    await prisma.careTimeline.create({
      data: {
        residentId,
        eventType: 'NUTRITION_RECORDED',
        summary: `${dto.type} recorded: ${dto.amount} ${dto.unit}${
          dto.mealSlot ? ` (${dto.mealSlot})` : ''
        }${dto.notes ? ` - ${dto.notes}` : ''}`,
        carerId: userId,
        createdById: userId,
        updatedById: userId,
      },
    });

    // Emit clinical documentation audit
    await this.auditService.emitClinicalDoc({
      tenantId,
      userId,
      entityType: 'FoodFluidLog',
      entityId: log.id,
      residentId,
      actionType: 'CARE_NOTE_ADDED',
      description: `${dto.type} intake of ${dto.amount} ${dto.unit} logged for resident ${resident.fullName}.`,
      metadata: {
        type: dto.type,
        amount: dto.amount,
        unit: dto.unit,
        mealSlot: dto.mealSlot,
        dailyTotal: newTotal,
      },
    });

    return log;
  }

  /**
   * Retrieve food & fluid logs for a resident with date filtering.
   */
  async getLogs(
    residentId: string,
    tenantId: string,
    query: FoodFluidLogQueryDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true, status: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (resident.status === 'Discharged' || resident.status === 'Deceased') {
      throw new BadRequestException(
        'Cannot record intake for inactive resident',
      );
    }

    const where: {
      residentId: string;
      tenantId: string;
      type?: string;
      timestamp?: { gte: Date; lte: Date };
    } = {
      residentId,
      tenantId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.date) {
      const targetDate = new Date(query.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.timestamp = { gte: startOfDay, lte: endOfDay };
    }

    return prisma.foodFluidLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query.limit,
      skip: query.offset,
    });
  }

  /**
   * Computes 24h hydration balance and dehydration risk (NICE CG32).
   */
  async getSummary(
    residentId: string,
    tenantId: string,
    dateStr?: string,
  ): Promise<FoodFluidSummaryDTO> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true, fullName: true, status: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (resident.status === 'Discharged' || resident.status === 'Deceased') {
      throw new BadRequestException(
        'Cannot record intake for inactive resident',
      );
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.foodFluidLog.findMany({
      where: {
        residentId,
        tenantId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: 'desc' },
    });

    const dailyTargetMl = 2000; // NICE CG32 adult standard baseline
    const fluidLogs = logs.filter((l) => l.type === 'Fluid');
    const totalFluidIntakeMl = fluidLogs.reduce((acc, curr) => {
      const pct =
        curr.intakePercentage !== null && curr.intakePercentage !== undefined
          ? curr.intakePercentage / 100
          : 1;
      return acc + Math.round(curr.amount * pct);
    }, 0);
    const remainingFluidMl = Math.max(dailyTargetMl - totalFluidIntakeMl, 0);
    const percentageCompleted = Math.min(
      Math.round((totalFluidIntakeMl / dailyTargetMl) * 100),
      100,
    );

    const isDehydrationRisk = percentageCompleted < 50;

    let statusLabel = 'On Track';
    if (percentageCompleted >= 100) {
      statusLabel = 'Target Met';
    } else if (percentageCompleted >= 75) {
      statusLabel = 'Good Progress';
    } else if (percentageCompleted < 50) {
      statusLabel = 'Dehydration Risk';
    } else {
      statusLabel = 'Below Target';
    }

    return {
      residentId,
      date: startOfDay.toISOString().split('T')[0] ?? '',
      totalFluidIntakeMl,
      dailyTargetMl,
      remainingFluidMl,
      percentageCompleted,
      isDehydrationRisk,
      statusLabel,
      totalFoodEntries: logs.filter((l) => l.type === 'Food').length,
      recentLogs: logs.slice(0, 10).map((l) => ({
        id: l.id,
        type: l.type,
        amount: l.amount,
        unit: l.unit,
        mealSlot: l.mealSlot,
        intakePercentage: l.intakePercentage,
        timestamp: l.timestamp,
        notes: l.notes,
      })),
    };
  }

  /**
   * G-07: Evaluates all active residents in a tenant to detect daily fluid target deficits (CQC Reg 14).
   */
  async getTenantDehydrationRisks(tenantId: string) {
    return evaluateTenantDehydrationRisks(tenantId);
  }

  async updateLog(
    residentId: string,
    logId: string,
    tenantId: string,
    userId: string,
    dto: UpdateFoodFluidLogDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true, status: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.status === 'Discharged' || resident.status === 'Deceased') {
      throw new BadRequestException('Cannot edit logs for inactive resident');
    }
    const existing = await prisma.foodFluidLog.findFirst({
      where: { id: logId, residentId, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Log entry not found');

    return prisma.foodFluidLog.update({
      where: { id: logId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.mealSlot !== undefined && { mealSlot: dto.mealSlot }),
        ...(dto.intakePercentage !== undefined && {
          intakePercentage: dto.intakePercentage,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.timestamp !== undefined && {
          timestamp: new Date(dto.timestamp),
        }),
        updatedById: userId,
      },
    });
  }

  async deleteLog(
    residentId: string,
    logId: string,
    tenantId: string,
    userId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true, status: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.status === 'Discharged' || resident.status === 'Deceased') {
      throw new BadRequestException('Cannot delete logs for inactive resident');
    }
    const existing = await prisma.foodFluidLog.findFirst({
      where: { id: logId, residentId, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Log entry not found');

    await prisma.foodFluidLog.update({
      where: { id: logId },
      data: { deletedAt: new Date(), deletedById: userId },
    });
    return { success: true };
  }
}
