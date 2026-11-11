import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { rawPrisma, Prisma } from '@repo/db';
import { UpdateDailyTaskStatusDTO } from '@repo/schema';
import { getUkDayBoundaries } from '../common/utils/time.util';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { escalateSkippedTask } from './utils/task-escalation.utils';

@Injectable()
export class CarePlanDailyTaskService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDailyTasks(
    tenantId: string,
    date: Date = new Date(),
    residentId?: string,
    carerId?: string,
  ) {
    const { start, end } = getUkDayBoundaries(date);

    const where: Prisma.DailyTaskWhereInput = {
      resident: { tenantId },
      scheduledDate: {
        gte: start,
        lte: end,
      },
    };

    if (residentId) {
      where.residentId = residentId;
    }

    if (carerId) {
      where.OR = [
        { assignedStaffId: carerId },
        { resident: { keyworkerId: carerId } },
        { resident: { staff: { some: { id: carerId } } } },
      ];
    }

    return rawPrisma.dailyTask.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            status: true,
            bed: {
              select: {
                number: true,
                bedLabel: true,
                room: { select: { roomNumber: true, name: true } },
              },
            },
          },
        },
        carePlanTask: {
          select: {
            category: true,
            priority: true,
            instructions: true,
            precautions: true,
            targetTime: true,
            requirePhotoOrNote: true,
            escalateIfSkipped: true,
            goal: { select: { id: true, title: true } },
          },
        },
        assignedStaff: {
          select: { id: true, fullName: true },
        },
        completedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getCarerShiftTasks(
    tenantId: string,
    carerId: string,
    shiftSlot?: string,
    date: Date = new Date(),
    residentId?: string,
  ) {
    const { start, end } = getUkDayBoundaries(date);

    // 1. Resolve residents explicitly assigned to this carer for this date.
    const activeShifts = await rawPrisma.shiftAssignment.findMany({
      where: {
        userId: carerId,
        shift: {
          tenantId,
          startTime: { lte: end },
          endTime: { gte: start },
        },
      },
    });

    const shiftResidentIds = activeShifts.flatMap(
      (s) => s.assignedResidentIds || [],
    );
    // 2. Location membership alone does not grant task assignment.
    const where: Prisma.DailyTaskWhereInput = {
      resident: { tenantId },
      scheduledDate: { gte: start, lte: end },
    };

    if (shiftSlot && shiftSlot !== 'ALL') {
      where.timeSlot = { in: [shiftSlot, 'AllDay'] };
    }

    if (residentId) {
      where.residentId = residentId;
    }
    where.OR = [
      ...(shiftResidentIds.length > 0
        ? [{ residentId: { in: Array.from(new Set(shiftResidentIds)) } }]
        : []),
      { assignedStaffId: carerId },
    ];

    return rawPrisma.dailyTask.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            status: true,
            bed: {
              select: {
                number: true,
                bedLabel: true,
                room: { select: { roomNumber: true, name: true } },
              },
            },
          },
        },
        carePlanTask: {
          select: {
            category: true,
            priority: true,
            instructions: true,
            precautions: true,
            targetTime: true,
            requirePhotoOrNote: true,
            escalateIfSkipped: true,
            goal: { select: { id: true, title: true } },
          },
        },
        assignedStaff: {
          select: { id: true, fullName: true },
        },
        completedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getCarerAssignedResidentTasks(
    tenantId: string,
    carerId: string,
    shiftSlot?: string,
    date: Date = new Date(),
    residentId?: string,
  ) {
    const { start, end } = getUkDayBoundaries(date);
    const where: Prisma.DailyTaskWhereInput = {
      resident: {
        tenantId,
        deletedAt: null,
        OR: [{ keyworkerId: carerId }, { staff: { some: { id: carerId } } }],
      },
      scheduledDate: { gte: start, lte: end },
    };

    if (shiftSlot && shiftSlot !== 'ALL') {
      where.timeSlot = { in: [shiftSlot, 'AllDay'] };
    }

    if (residentId) {
      where.residentId = residentId;
    }

    return rawPrisma.dailyTask.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            status: true,
            bed: {
              select: {
                number: true,
                bedLabel: true,
                room: { select: { roomNumber: true, name: true } },
              },
            },
          },
        },
        carePlanTask: {
          select: {
            category: true,
            priority: true,
            instructions: true,
            precautions: true,
            targetTime: true,
            requirePhotoOrNote: true,
            escalateIfSkipped: true,
            goal: { select: { id: true, title: true } },
          },
        },
        assignedStaff: {
          select: { id: true, fullName: true },
        },
        completedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async updateDailyTaskStatus(
    taskId: string,
    dto: UpdateDailyTaskStatusDTO,
    userId: string,
    tenantId: string,
  ) {
    const task = await rawPrisma.dailyTask.findFirst({
      where: { id: taskId, resident: { tenantId } },
      include: {
        resident: { select: { fullName: true, branchId: true } },
        carePlanTask: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task occurrence not found');
    }

    if (
      dto.status === 'Skipped' &&
      (!dto.skipReason || dto.skipReason.trim().length === 0)
    ) {
      throw new BadRequestException(
        'Skip reason is required when marking a task as Skipped.',
      );
    }

    const isCompleted = dto.status === 'Completed';
    const now = new Date();

    if (isCompleted && task.scheduledDate) {
      const { end: scheduledDayEnd } = getUkDayBoundaries(task.scheduledDate);
      const { start: todayStart } = getUkDayBoundaries(now);
      if (scheduledDayEnd < todayStart) {
        throw new BadRequestException(
          'Past-due daily tasks cannot be marked as completed after the scheduled date has passed.',
        );
      }
    }

    const updatedTask = await rawPrisma.dailyTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        notes: dto.notes ?? null,
        skipReason: dto.skipReason ?? null,
        photoUrl: dto.photoUrl ?? null,
        completedAt: isCompleted ? now : null,
        completedById: isCompleted ? userId : null,
      },
      include: {
        completedBy: { select: { fullName: true } },
      },
    });

    // Automatic clinical escalation if configured in the Care Plan (CQC Reg 12/17)
    if (
      dto.status === 'Skipped' &&
      task.carePlanTask?.escalateIfSkipped &&
      dto.skipReason
    ) {
      void escalateSkippedTask({
        tenantId,
        userId,
        taskId: task.id,
        taskTitle: task.title,
        category: task.carePlanTask?.category || task.category || '',
        instructions: task.carePlanTask?.instructions,
        residentId: task.residentId,
        residentName: task.resident.fullName,
        branchId: task.resident.branchId,
        skipReason: dto.skipReason,
        notificationsService: this.notificationsService,
        auditService: this.auditService,
      });
    }

    const actionLabel = isCompleted ? 'TASK_COMPLETED' : 'TASK_SKIPPED';
    const desc = isCompleted
      ? `Task '${task.title}' completed for ${task.resident.fullName}`
      : `Task '${task.title}' skipped for ${task.resident.fullName} — reason: "${dto.skipReason}"`;

    await this.auditService.emitCarePlan({
      tenantId,
      userId,
      entityId: taskId,
      residentId: task.residentId,
      actionType: actionLabel,
      description: desc,
      newValue: {
        status: dto.status,
        skipReason: dto.skipReason,
        notes: dto.notes,
        completedAt: isCompleted ? now : null,
      },
    });

    return updatedTask;
  }
}
