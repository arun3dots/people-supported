import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma, type ResidentCareTaskRecord } from '@repo/db';
import {
  type AssessmentAreaKey,
  type CareTaskBoardDTO,
  type CareTaskBoardItemDTO,
  type CareTaskBoardQueryDTO,
  type CareTaskDayDTO,
  type CareTaskListItemDTO,
  type CareTaskRecurrenceDTO,
  type CareTaskShift,
  type CreateShiftNoteDTO,
  type RecordCareTaskDTO,
  type ShiftNoteDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ResidentAccessService } from '../services/resident-access.service';
import { toRecordSummary, toShiftNoteDTO } from './care-journey.mapper';
import { buildMustKnow } from './must-know';
import {
  asDate,
  emitCareAudit,
  findTaskOrThrow,
  requireTenant,
  runsOn,
  todayLocal,
  type TaskWithPlan,
} from './care-task.util';

@Injectable()
export class CareTaskDayService {
  constructor(
    private readonly access: ResidentAccessService,
    private readonly auditService: AuditService,
  ) {}

  async getBoard(
    query: CareTaskBoardQueryDTO,
    user: AuthenticatedUser,
  ): Promise<CareTaskBoardDTO> {
    const tenantId = requireTenant(user);
    const date = query.date ?? todayLocal();
    const day = asDate(date);
    const tasks = await prisma.residentCareTask.findMany({
      where: {
        tenantId,
        isActive: true,
        carePlan: { isCurrent: true, agreedAt: { not: null } },
        AND: [
          { OR: [{ startsOn: null }, { startsOn: { lte: day } }] },
          { OR: [{ endsOn: null }, { endsOn: { gte: day } }] },
        ],
      },
      include: {
        carePlan: { select: { id: true, area: true } },
        resident: { select: { id: true, fullName: true } },
      },
    });
    const due = tasks.filter((task) =>
      runsOn(task.recurrence as CareTaskRecurrenceDTO | null, date),
    );
    const records = due.length
      ? await prisma.residentCareTaskRecord.findMany({
          where: {
            tenantId,
            date: day,
            undoneAt: null,
            taskId: { in: due.map((task) => task.id) },
          },
        })
      : [];
    const recordByTask = new Map(records.map((record) => [record.taskId, record]));

    const items: CareTaskBoardItemDTO[] = due.map((task) => {
      const record = recordByTask.get(task.id);
      return {
        taskId: task.id,
        residentId: task.residentId,
        title: task.title,
        status: !record
          ? 'Pending'
          : record.outcome === 'Done'
            ? 'Completed'
            : 'Skipped',
        timeSlot: task.shift as CareTaskBoardItemDTO['timeSlot'],
        targetTime: task.time || null,
        role: task.role as CareTaskBoardItemDTO['role'],
        instructions: task.description,
        skipReason: record?.outcome === 'Declined' ? record.note : null,
        resident: task.resident,
        carePlan: task.carePlan,
      };
    });

    items.sort((a, b) => {
      const shiftOrder = a.timeSlot.localeCompare(b.timeSlot);
      if (shiftOrder !== 0) return shiftOrder;
      if (!a.targetTime) return b.targetTime ? 1 : 0;
      if (!b.targetTime) return -1;
      return a.targetTime.localeCompare(b.targetTime);
    });

    return { date, items };
  }

  async getDay(
    residentId: string,
    query: { date?: string; shift?: CareTaskShift },
    user: AuthenticatedUser,
  ): Promise<CareTaskDayDTO> {
    const tenantId = requireTenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    const date = query.date ?? todayLocal();
    const shift: CareTaskShift = query.shift ?? 'Day';
    const day = asDate(date);

    const tasks = (await prisma.residentCareTask.findMany({
      where: {
        residentId,
        tenantId,
        isActive: true,
        shift,
        // Tasks go live once the plan has been agreed at least once.
        carePlan: { isCurrent: true, agreedAt: { not: null } },
        AND: [
          { OR: [{ startsOn: null }, { startsOn: { lte: day } }] },
          { OR: [{ endsOn: null }, { endsOn: { gte: day } }] },
        ],
      },
      include: { carePlan: true },
    })) as TaskWithPlan[];
    const due = tasks.filter((t) =>
      runsOn(t.recurrence as CareTaskRecurrenceDTO | null, date),
    );

    const [records, notes, mustKnow] = await Promise.all([
      prisma.residentCareTaskRecord.findMany({
        where: {
          tenantId,
          residentId,
          date: day,
          undoneAt: null,
          taskId: { in: due.map((t) => t.id) },
        },
      }),
      prisma.residentShiftNote.findMany({
        where: { tenantId, residentId, date: day, shift },
        orderBy: { createdAt: 'desc' },
      }),
      buildMustKnow(residentId, tenantId),
    ]);
    const recordByTask = new Map(
      (records as ResidentCareTaskRecord[]).map((r) => [r.taskId, r]),
    );

    const items: CareTaskListItemDTO[] = due
      .map((t) => {
        const rec = recordByTask.get(t.id);
        return {
          taskId: t.id,
          time: t.time,
          shift,
          title: t.title,
          description: t.description,
          role: t.role as CareTaskListItemDTO['role'],
          carePlan: {
            id: t.carePlanId,
            areaKey: t.carePlan.areaKey as AssessmentAreaKey,
            area: t.carePlan.area,
          },
          status: rec
            ? (rec.outcome as 'Done' | 'Declined')
            : ('Pending' as const),
          record: rec ? toRecordSummary(rec) : null,
        };
      })
      // Night shifts run past midnight, so 00:00-05:59 sorts after the evening.
      // Untimed shift tasks sort after timed tasks.
      .sort((a, b) => {
        const key = (t: string) => {
          if (!t) return '2';
          return shift === 'Night' && t < '12:00' ? `1${t}` : `0${t}`;
        };
        return key(a.time).localeCompare(key(b.time));
      });

    return {
      residentId,
      date,
      shift,
      items,
      progress: {
        recorded: items.filter((i) => i.status !== 'Pending').length,
        total: items.length,
      },
      mustKnow,
      notes: notes.map(toShiftNoteDTO),
    };
  }

  async record(
    residentId: string,
    taskId: string,
    dto: RecordCareTaskDTO,
    user: AuthenticatedUser,
  ): Promise<CareTaskDayDTO['items'][number]['record']> {
    const tenantId = requireTenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    const task = await findTaskOrThrow(prisma, residentId, taskId, tenantId);
    if (task.role === 'Nurse' && user.roleName === 'Carer') {
      throw new ForbiddenException('This task must be recorded by a nurse');
    }
    if (dto.outcome === 'Declined' && !dto.note?.trim()) {
      throw new BadRequestException(
        'Add a note explaining why it was declined',
      );
    }
    const date = dto.date ?? todayLocal();
    if (date > todayLocal()) {
      throw new BadRequestException('Cannot record a task for a future date');
    }

    try {
      const row = await prisma.residentCareTaskRecord.create({
        data: {
          tenantId,
          residentId,
          taskId: task.id,
          date: asDate(date),
          outcome: dto.outcome,
          note: dto.note?.trim() || null,
          recordedById: user.userId,
          recordedByName: user.fullName ?? null,
        },
      });
      emitCareAudit(
        this.auditService,
        user,
        'CARE_TASK_RECORDED',
        residentId,
        row.id,
        'ResidentCareTaskRecord',
        {
          taskId: task.id,
          outcome: dto.outcome,
          date,
        },
      );
      return toRecordSummary(row as ResidentCareTaskRecord);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'This task is already recorded for that day',
        );
      }
      throw e;
    }
  }

  async undo(
    residentId: string,
    taskId: string,
    date: string | undefined,
    user: AuthenticatedUser,
  ): Promise<{ undone: true }> {
    const tenantId = requireTenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    const task = await findTaskOrThrow(prisma, residentId, taskId, tenantId);
    const rec = await prisma.residentCareTaskRecord.findFirst({
      where: {
        taskId: task.id,
        tenantId,
        date: asDate(date ?? todayLocal()),
        undoneAt: null,
      },
    });
    if (!rec) throw new NotFoundException('Nothing recorded to undo');
    if (user.roleName === 'Carer' && rec.recordedById !== user.userId) {
      throw new ForbiddenException('You can only undo your own entries');
    }
    // The record is kept (marked undone) so the audit trail stays intact.
    await prisma.residentCareTaskRecord.update({
      where: { id: rec.id },
      data: { undoneAt: new Date(), undoneById: user.userId },
    });
    emitCareAudit(
      this.auditService,
      user,
      'CARE_TASK_UNDONE',
      residentId,
      rec.id,
      'ResidentCareTaskRecord',
      {
        taskId: task.id,
      },
    );
    return { undone: true };
  }

  async addNote(
    residentId: string,
    dto: CreateShiftNoteDTO,
    user: AuthenticatedUser,
  ): Promise<ShiftNoteDTO> {
    const tenantId = requireTenant(user);
    await this.access.assertCanAccessResident(user, residentId);
    const row = await prisma.residentShiftNote.create({
      data: {
        tenantId,
        residentId,
        date: asDate(dto.date ?? todayLocal()),
        shift: dto.shift,
        text: dto.text,
        authorId: user.userId,
        authorName: user.fullName ?? null,
      },
    });
    emitCareAudit(
      this.auditService,
      user,
      'SHIFT_NOTE_ADDED',
      residentId,
      row.id,
      'ResidentShiftNote',
      {
        shift: dto.shift,
      },
    );
    return toShiftNoteDTO(row);
  }
}
