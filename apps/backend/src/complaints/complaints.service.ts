import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Complaint } from '@repo/db';
import { CreateComplaintDTO, UpdateComplaintDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class ComplaintsService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * G-09 & A-13: Complaints Register (CQC Reg 16 & DUAA s.103).
   * 3-day acknowledgment SLA & 28-day substantive response SLA.
   */
  async createComplaint(
    dto: CreateComplaintDTO,
    userId: string,
    tenantId: string,
  ): Promise<Complaint> {
    if (dto.residentId) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId, deletedAt: null },
      });
      if (!resident) throw new NotFoundException('Resident not found');
    }

    const count = await prisma.complaint.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const complaintNumber = `CMP-${year}-${String(count + 1).padStart(4, '0')}`;

    const now = new Date();
    // 3 calendar days for acknowledgment SLA
    const acknowledgeDueAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    // 28 calendar days for substantive response SLA (DUAA s.103 / CQC)
    const responseDueAt = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const complaint = await prisma.complaint.create({
      data: {
        tenantId,
        branchId: dto.branchId ?? null,
        residentId: dto.residentId ?? null,
        complaintNumber,
        complaintType: dto.complaintType,
        complainantName: dto.complainantName,
        complainantRelationship: dto.complainantRelationship ?? null,
        complainantContact: dto.complainantContact ?? null,
        subject: dto.subject,
        description: dto.description,
        severity: dto.severity,
        status: 'Received',
        receivedAt: now,
        acknowledgeDueAt,
        responseDueAt,
        createdById: userId,
      },
    });

    if (dto.residentId) {
      await prisma.careTimeline.create({
        data: {
          residentId: dto.residentId,
          eventType: 'COMPLAINT_LOGGED',
          summary: `Complaint logged (${complaintNumber}): ${dto.subject}. Complainant: ${dto.complainantName}. Response due by ${responseDueAt.toLocaleDateString('en-GB')}`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'COMPLAINT_REGISTERED',
      entityType: 'Complaint',
      entityId: complaint.id,
      tenantId,
      userId,
      newValue: toJsonValue(complaint) as Record<string, unknown>,
    });

    return complaint;
  }

  async listComplaints(
    tenantId: string,
    type?: string,
    status?: string,
  ): Promise<Complaint[]> {
    return prisma.complaint.findMany({
      where: {
        tenantId,
        ...(type ? { complaintType: type } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getComplaint(id: string, tenantId: string): Promise<Complaint> {
    const complaint = await prisma.complaint.findFirst({
      where: { id, tenantId },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
      },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async updateComplaint(
    id: string,
    dto: UpdateComplaintDTO,
    userId: string,
    tenantId: string,
  ): Promise<Complaint> {
    const existing = await prisma.complaint.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Complaint not found');

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        ...dto,
        acknowledgedAt:
          dto.status === 'Acknowledged' && !existing.acknowledgedAt
            ? new Date()
            : existing.acknowledgedAt,
        respondedAt:
          dto.status === 'Responded' && !existing.respondedAt
            ? new Date()
            : existing.respondedAt,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'COMPLAINT_UPDATED',
      entityType: 'Complaint',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }
}
