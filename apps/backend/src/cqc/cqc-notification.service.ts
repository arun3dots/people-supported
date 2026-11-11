import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateCqcNotificationDTO,
  SubmitCqcNotificationDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CqcNotificationService {
  constructor(private readonly auditService: AuditService) {}

  async recordNotice(
    dto: CreateCqcNotificationDTO,
    userId: string,
    tenantId: string,
  ) {
    if (dto.residentId) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId, deletedAt: null },
      });
      if (!resident) {
        throw new NotFoundException('Resident not found');
      }
    }

    const notice = await prisma.cqcNotification.create({
      data: {
        tenantId,
        residentId: dto.residentId || null,
        noticeType: dto.noticeType,
        incidentDate: new Date(dto.incidentDate),
        summary: dto.summary,
        actionTaken: dto.actionTaken,
        cqcReferenceNo: dto.cqcReferenceNo || null,
        status: dto.cqcReferenceNo ? 'Submitted' : 'Pending',
        cqcNotifiedAt: dto.cqcReferenceNo ? new Date() : null,
        submittedById: dto.cqcReferenceNo ? userId : null,
        createdById: userId,
      },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CQC_NOTIFICATION_RECORDED',
      entityType: 'CqcNotification',
      entityId: notice.id,
      tenantId,
      userId,
      newValue: {
        noticeType: notice.noticeType,
        incidentDate: notice.incidentDate,
        status: notice.status,
      },
    });

    return notice;
  }

  async markSubmitted(
    id: string,
    dto: SubmitCqcNotificationDTO,
    userId: string,
    tenantId: string,
  ) {
    const existing = await prisma.cqcNotification.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('CQC notification record not found');
    }

    const updated = await prisma.cqcNotification.update({
      where: { id },
      data: {
        status: 'Submitted',
        cqcReferenceNo: dto.cqcReferenceNo,
        cqcNotifiedAt: new Date(),
        submittedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CQC_NOTIFICATION_SUBMITTED',
      entityType: 'CqcNotification',
      entityId: updated.id,
      tenantId,
      userId,
      newValue: {
        cqcReferenceNo: updated.cqcReferenceNo,
        cqcNotifiedAt: updated.cqcNotifiedAt,
      },
    });

    return updated;
  }

  async findAll(tenantId: string, status?: string) {
    return prisma.cqcNotification.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findPending(tenantId: string) {
    return prisma.cqcNotification.findMany({
      where: {
        tenantId,
        status: 'Pending',
      },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }
}
