import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateAuditScheduleDTO, CompleteAuditScheduleDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuditScheduleService {
  constructor(private readonly auditService: AuditService) {}

  async createSchedule(
    dto: CreateAuditScheduleDTO,
    userId: string,
    tenantId: string,
  ) {
    const auditor = await prisma.user.findFirst({
      where: { id: dto.auditorId, tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!auditor) {
      throw new NotFoundException('Auditor user not found in tenant');
    }

    const schedule = await prisma.auditSchedule.create({
      data: {
        tenantId,
        auditType: dto.auditType,
        frequency: dto.frequency,
        scheduledDate: new Date(dto.scheduledDate),
        auditorId: dto.auditorId,
        createdById: userId,
        status: 'Scheduled',
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'AUDIT_SCHEDULED',
      entityType: 'AuditSchedule',
      entityId: schedule.id,
      tenantId,
      userId,
      newValue: {
        auditType: schedule.auditType,
        frequency: schedule.frequency,
        scheduledDate: schedule.scheduledDate,
      },
    });

    return schedule;
  }

  async completeAudit(
    id: string,
    dto: CompleteAuditScheduleDTO,
    userId: string,
    tenantId: string,
  ) {
    const existing = await prisma.auditSchedule.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Audit schedule record not found');
    }

    const updated = await prisma.auditSchedule.update({
      where: { id },
      data: {
        status: 'Completed',
        completedDate: new Date(),
        scorePercentage: dto.scorePercentage,
        findingsSummary: dto.findingsSummary,
        actionPlan: dto.actionPlan || null,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'AUDIT_COMPLETED',
      entityType: 'AuditSchedule',
      entityId: updated.id,
      tenantId,
      userId,
      newValue: {
        scorePercentage: updated.scorePercentage,
        findingsSummary: updated.findingsSummary,
      },
    });

    return updated;
  }

  async getCalendar(tenantId: string, status?: string) {
    return prisma.auditSchedule.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getDueOrOverdue(tenantId: string) {
    const now = new Date();
    return prisma.auditSchedule.findMany({
      where: {
        tenantId,
        status: { in: ['Scheduled', 'InProgress'] },
        scheduledDate: { lte: now },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}
