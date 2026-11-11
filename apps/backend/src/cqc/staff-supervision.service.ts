import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateSupervisionDTO, CreateAppraisalDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StaffSupervisionService {
  constructor(private readonly auditService: AuditService) {}

  async createSupervision(
    dto: CreateSupervisionDTO,
    supervisorId: string,
    tenantId: string,
  ) {
    const staff = await prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const record = await prisma.staffSupervision.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        supervisorId,
        supervisionDate: new Date(dto.supervisionDate),
        notes: dto.notes,
        actionAgreed: dto.actionAgreed || null,
        nextSessionDate: dto.nextSessionDate
          ? new Date(dto.nextSessionDate)
          : null,
        status: dto.status,
        createdById: supervisorId,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        supervisor: { select: { id: true, fullName: true } },
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'STAFF_SUPERVISION_RECORDED',
      entityType: 'StaffSupervision',
      entityId: record.id,
      tenantId,
      userId: supervisorId,
      newValue: {
        staffId: record.staffId,
        supervisionDate: record.supervisionDate,
        status: record.status,
      },
    });

    return record;
  }

  async getStaffSupervisions(staffId: string, tenantId: string) {
    return prisma.staffSupervision.findMany({
      where: { staffId, tenantId },
      include: {
        supervisor: { select: { id: true, fullName: true } },
      },
      orderBy: { supervisionDate: 'desc' },
    });
  }

  async createAppraisal(
    dto: CreateAppraisalDTO,
    appraiserId: string,
    tenantId: string,
  ) {
    const staff = await prisma.user.findFirst({
      where: { id: dto.staffId, tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const record = await prisma.staffAppraisal.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        appraiserId,
        appraisalPeriod: dto.appraisalPeriod,
        appraisalDate: new Date(dto.appraisalDate),
        objectives: dto.objectives,
        trainingNeeds: dto.trainingNeeds || null,
        overallRating: dto.overallRating,
        nextAppraisalDue: new Date(dto.nextAppraisalDue),
        createdById: appraiserId,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        appraiser: { select: { id: true, fullName: true } },
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'STAFF_APPRAISAL_RECORDED',
      entityType: 'StaffAppraisal',
      entityId: record.id,
      tenantId,
      userId: appraiserId,
      newValue: {
        staffId: record.staffId,
        appraisalPeriod: record.appraisalPeriod,
        overallRating: record.overallRating,
        nextAppraisalDue: record.nextAppraisalDue,
      },
    });

    return record;
  }

  async getStaffAppraisals(staffId: string, tenantId: string) {
    return prisma.staffAppraisal.findMany({
      where: { staffId, tenantId },
      include: {
        appraiser: { select: { id: true, fullName: true } },
      },
      orderBy: { appraisalDate: 'desc' },
    });
  }

  async getAllTenantSupervisions(tenantId: string) {
    return prisma.staffSupervision.findMany({
      where: { tenantId },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
        supervisor: { select: { id: true, fullName: true } },
      },
      orderBy: { supervisionDate: 'desc' },
    });
  }
}
