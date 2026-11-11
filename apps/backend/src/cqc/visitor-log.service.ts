import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateVisitorLogDTO, SignOutVisitorDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VisitorLogService {
  constructor(private readonly auditService: AuditService) {}

  async create(dto: CreateVisitorLogDTO, userId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const log = await prisma.visitorLog.create({
      data: {
        tenantId,
        residentId: dto.residentId,
        visitorName: dto.visitorName,
        relationship: dto.relationship,
        contactNumber: dto.contactNumber || null,
        visitingRestrictions: dto.visitingRestrictions || null,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'VISITOR_SIGNED_IN',
      entityType: 'VisitorLog',
      entityId: log.id,
      tenantId,
      userId,
      newValue: { visitorName: log.visitorName, residentId: log.residentId },
    });

    return log;
  }

  async signOut(
    id: string,
    dto: SignOutVisitorDTO,
    userId: string,
    tenantId: string,
  ) {
    const log = await prisma.visitorLog.findFirst({
      where: { id, tenantId },
    });
    if (!log) throw new NotFoundException('Visitor log entry not found');

    const updated = await prisma.visitorLog.update({
      where: { id },
      data: {
        signOutTime: new Date(),
        notes: dto.notes
          ? log.notes
            ? `${log.notes} | ${dto.notes}`
            : dto.notes
          : log.notes,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'VISITOR_SIGNED_OUT',
      entityType: 'VisitorLog',
      entityId: log.id,
      tenantId,
      userId,
      newValue: { signOutTime: updated.signOutTime },
    });

    return updated;
  }

  async findAllByResident(residentId: string, tenantId: string) {
    return prisma.visitorLog.findMany({
      where: { residentId, tenantId },
      orderBy: { signInTime: 'desc' },
      take: 100,
    });
  }

  async findActiveVisitors(tenantId: string) {
    return prisma.visitorLog.findMany({
      where: { tenantId, signOutTime: null },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
      orderBy: { signInTime: 'desc' },
    });
  }
}
