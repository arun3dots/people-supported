import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  type PrismaTransactionClient,
  type ResidentCareTask,
  type ResidentCareTaskRecord,
  type ResidentNeedCarePlan,
} from '@repo/db';
import {
  shiftForTime,
  type CareTaskDayDTO,
  type CareTaskDefinitionDTO,
  type CareTaskListItemDTO,
  type CareTaskRecurrenceDTO,
  type CareTaskShift,
  type CreateCareTaskDTO,
  type CreateShiftNoteDTO,
  type MustKnowItemDTO,
  type RecordCareTaskDTO,
  type ShiftNoteDTO,
  type UpdateCareTaskDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import type { ClinicalDocAction } from '../../audit/audit.types';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ResidentAccessService } from '../services/resident-access.service';
import {
  toRecordSummary,
  toShiftNoteDTO,
  toTaskDefinitionDTO,
} from './care-journey.mapper';
import {
  asDate,
  assertCarePlanDraft,
  type TaskWithPlan,
} from './care-task.util';

@Injectable()
export class CareTaskService {
  constructor(
    private readonly access: ResidentAccessService,
    private readonly auditService: AuditService,
  ) {}

  private tenant(user: AuthenticatedUser): string {
    if (!user.tenantId)
      throw new BadRequestException('Tenant context required');
    return user.tenantId;
  }

  private audit(
    user: AuthenticatedUser,
    actionType: ClinicalDocAction,
    residentId: string,
    entityId: string,
    entityType: string,
    metadata: Record<string, unknown> = {},
  ): void {
    // Outcomes and ids only; free-text notes are never logged.
    void this.auditService.emitClinicalDoc({
      actionType,
      entityType,
      entityId,
      residentId,
      tenantId: user.tenantId,
      userId: user.userId,
      metadata,
    });
  }

  private checkWindow(startsOn?: string | null, endsOn?: string | null): void {
    if (startsOn && endsOn && endsOn < startsOn) {
      throw new BadRequestException('End date cannot be before the start date');
    }
  }

  private async taskOrThrow(
    tx: PrismaTransactionClient,
    residentId: string,
    taskId: string,
    tenantId: string,
  ): Promise<TaskWithPlan> {
    const task = await tx.residentCareTask.findFirst({
      where: { id: taskId, residentId, tenantId },
      include: { carePlan: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task as TaskWithPlan;
  }

  async listDefinitions(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<CareTaskDefinitionDTO[]> {
    await this.access.assertCanAccessResident(user, residentId);
    const rows = await prisma.residentCareTask.findMany({
      where: {
        residentId,
        tenantId: this.tenant(user),
        carePlan: { isCurrent: true },
      },
      include: { carePlan: true },
      orderBy: { time: 'asc' },
    });
    return (rows as TaskWithPlan[]).map((r) =>
      toTaskDefinitionDTO(r, r.carePlan),
    );
  }

  async create(
    residentId: string,
    planId: string,
    dto: CreateCareTaskDTO,
    user: AuthenticatedUser,
  ): Promise<CareTaskDefinitionDTO> {
    const tenantId = this.tenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    this.checkWindow(dto.startsOn, dto.endsOn);
    const plan = await prisma.residentNeedCarePlan.findFirst({
      where: { id: planId, residentId, tenantId, isCurrent: true },
    });
    if (!plan) throw new NotFoundException('Care plan not found');
    assertCarePlanDraft(plan);

    const time = dto.time?.trim() ?? '';
    const shift = dto.shift ?? (time ? shiftForTime(time) : null);
    if (!shift) {
      throw new BadRequestException('Select a shift or choose a task time');
    }

    const row = await prisma.residentCareTask.create({
      data: {
        tenantId,
        branchId: plan.branchId,
        residentId,
        carePlanId: plan.id,
        stepIndex: dto.stepIndex ?? null,
        title: dto.title,
        description: dto.description ?? null,
        shift,
        time,
        role: dto.role,
        recurrence: dto.recurrence as Prisma.InputJsonValue,
        startsOn: dto.startsOn ? asDate(dto.startsOn) : null,
        endsOn: dto.endsOn ? asDate(dto.endsOn) : null,
        createdById: user.userId,
        updatedById: user.userId,
      },
    });
    this.audit(
      user,
      'CARE_TASK_CREATED',
      residentId,
      row.id,
      'ResidentCareTask',
      {
        carePlanId: plan.id,
      },
    );
    return toTaskDefinitionDTO(
      row as ResidentCareTask,
      plan as ResidentNeedCarePlan,
    );
  }

  async update(
    residentId: string,
    taskId: string,
    dto: UpdateCareTaskDTO,
    user: AuthenticatedUser,
  ): Promise<CareTaskDefinitionDTO> {
    const tenantId = this.tenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    const task = await this.taskOrThrow(prisma, residentId, taskId, tenantId);
    assertCarePlanDraft(task.carePlan);
    this.checkWindow(
      dto.startsOn ?? task.startsOn?.toISOString().slice(0, 10) ?? null,
      dto.endsOn ?? task.endsOn?.toISOString().slice(0, 10) ?? null,
    );

    const time = dto.time !== undefined ? (dto.time?.trim() ?? '') : task.time;
    const row = await prisma.residentCareTask.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.time !== undefined ? { time } : {}),
        ...(dto.shift !== undefined
          ? { shift: dto.shift }
          : dto.time !== undefined && time
            ? { shift: shiftForTime(time) }
            : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.recurrence !== undefined
          ? { recurrence: dto.recurrence as Prisma.InputJsonValue }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startsOn !== undefined
          ? { startsOn: dto.startsOn ? asDate(dto.startsOn) : null }
          : {}),
        ...(dto.endsOn !== undefined
          ? { endsOn: dto.endsOn ? asDate(dto.endsOn) : null }
          : {}),
        updatedById: user.userId,
      },
    });
    this.audit(
      user,
      'CARE_TASK_UPDATED',
      residentId,
      row.id,
      'ResidentCareTask',
    );
    return toTaskDefinitionDTO(row as ResidentCareTask, task.carePlan);
  }
}
