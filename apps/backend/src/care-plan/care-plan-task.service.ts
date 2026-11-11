import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { rawPrisma } from '@repo/db';
import { CreateCarePlanTaskDTO, UpdateCarePlanTaskDTO } from '@repo/schema';
import { CarePlanTaskGeneratorService } from './care-plan-task-generator.service';

@Injectable()
export class CarePlanTaskService {
  constructor(
    private readonly taskGeneratorService: CarePlanTaskGeneratorService,
  ) {}

  async createCarePlanTask(
    carePlanId: string,
    dto: CreateCarePlanTaskDTO,
    tenantId: string,
  ) {
    let carePlan = await rawPrisma.carePlan.findFirst({
      where: { id: carePlanId, tenantId },
    });

    if (!carePlan) {
      carePlan = await rawPrisma.carePlan.findFirst({
        where: { residentId: carePlanId, tenantId },
        orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
      });
    }

    if (!carePlan && dto.residentId) {
      carePlan = await rawPrisma.carePlan.findFirst({
        where: { residentId: dto.residentId, tenantId },
        orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
      });
    }

    if (!carePlan) {
      throw new NotFoundException('Care Plan not found');
    }

    if (carePlan.status === 'Expired' || carePlan.status === 'Superseded') {
      throw new BadRequestException(
        `Cannot add tasks to care plan in status '${carePlan.status}'.`,
      );
    }

    const task = await rawPrisma.carePlanTask.create({
      data: {
        residentId: carePlan.residentId,
        tenantId,
        branchId: carePlan.branchId,
        carePlanId: carePlan.id,
        goalId: dto.goalId || null,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        precautions: dto.precautions,
        category: dto.category,
        frequency: dto.frequency || 'Daily',
        timeOfDay:
          dto.timeOfDay && dto.timeOfDay.length > 0
            ? dto.timeOfDay
            : ['Morning'],
        targetTime: dto.targetTime,
        priority: dto.priority || 'Medium',
        assignedGroupId: dto.assignedGroupId,
        assignedStaffId: dto.assignedStaffId,
        requirePhotoOrNote: dto.requirePhotoOrNote ?? false,
        escalateIfSkipped: dto.escalateIfSkipped ?? false,
        status: 'Active',
        isActive: true,
      },
    });

    try {
      await this.taskGeneratorService.generateTasksForResident(
        carePlan.residentId,
        new Date(),
      );
    } catch {
      // Non-blocking fallback
    }

    return task;
  }

  async createCarePlanTaskForResident(
    residentId: string,
    dto: CreateCarePlanTaskDTO,
    tenantId: string,
    userId: string,
  ) {
    const resident = await rawPrisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    // Find the latest / active care plan for this resident
    let carePlan = await rawPrisma.carePlan.findFirst({
      where: { residentId, tenantId },
      orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
    });

    if (!carePlan) {
      // Create active care plan for resident if none exists
      carePlan = await rawPrisma.carePlan.create({
        data: {
          tenantId,
          branchId: resident.branchId,
          residentId,
          versionNumber: 1,
          status: 'Active',
          validFrom: new Date(),
          authorId: userId,
          departments: [],
          doctorsInvolved: [],
        },
      });
    }

    const task = await rawPrisma.carePlanTask.create({
      data: {
        residentId,
        tenantId,
        branchId: resident.branchId,
        carePlanId: carePlan.id,
        goalId: dto.goalId || null,
        title: dto.title,
        description: dto.description || null,
        instructions: dto.instructions || null,
        precautions: dto.precautions || null,
        category: dto.category,
        frequency: dto.frequency || 'Daily',
        timeOfDay:
          dto.timeOfDay && dto.timeOfDay.length > 0
            ? dto.timeOfDay
            : ['Morning'],
        targetTime: dto.targetTime || null,
        priority: dto.priority || 'Medium',
        assignedGroupId: dto.assignedGroupId || null,
        assignedStaffId: dto.assignedStaffId || null,
        requirePhotoOrNote: dto.requirePhotoOrNote ?? false,
        escalateIfSkipped: dto.escalateIfSkipped ?? false,
        status: 'Active',
        isActive: true,
      },
    });

    // Pre-generate today's task occurrence immediately
    try {
      await this.taskGeneratorService.generateTasksForResident(
        residentId,
        new Date(),
      );
    } catch {
      // Non-blocking fallback if task generation fails
    }

    return task;
  }

  async getResidentCarePlanTasks(residentId: string, tenantId: string) {
    return rawPrisma.carePlanTask.findMany({
      where: {
        residentId,
        tenantId,
        isActive: true,
      },
      include: {
        goal: { select: { id: true, title: true } },
        assignedStaff: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateCarePlanTask(
    taskId: string,
    dto: UpdateCarePlanTaskDTO,
    tenantId: string,
  ) {
    const task = await rawPrisma.carePlanTask.findFirst({
      where: { id: taskId, tenantId },
      include: { carePlan: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return rawPrisma.carePlanTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        precautions: dto.precautions,
        category: dto.category,
        frequency: dto.frequency,
        timeOfDay: dto.timeOfDay,
        targetTime: dto.targetTime,
        priority: dto.priority,
        goalId: dto.goalId !== undefined ? dto.goalId || null : undefined,
        residentId: dto.residentId || undefined,
        assignedGroupId: dto.assignedGroupId,
        assignedStaffId: dto.assignedStaffId,
        requirePhotoOrNote: dto.requirePhotoOrNote,
        escalateIfSkipped: dto.escalateIfSkipped,
        status: dto.status,
      },
    });
  }

  async deleteCarePlanTask(taskId: string, tenantId: string) {
    const task = await rawPrisma.carePlanTask.findFirst({
      where: { id: taskId, tenantId },
      include: { carePlan: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return rawPrisma.carePlanTask.delete({
      where: { id: taskId },
    });
  }
}
