import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateLeaveRequestDTO,
  UpdateLeaveRequestStatusDTO,
} from '@repo/schema';
import { ShiftRequestsService } from '../shift-requests.service';
import { AuditService } from '../../audit/audit.service';
import { toJsonValue } from '../../common/utils/json.util';

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly shiftRequestsService: ShiftRequestsService,
    private readonly auditService: AuditService,
  ) {}

  async getAll(tenantId: string) {
    const [leaveRequests, shiftLeaveRequests] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { tenantId },
        include: {
          staff: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: { select: { name: true } },
              profile: { select: { profilePhotoUrl: true, phoneNumber: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shiftRequest.findMany({
        where: { tenantId, type: 'Leave' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: { select: { name: true } },
              profile: { select: { profilePhotoUrl: true, phoneNumber: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const mappedShiftRequests = shiftLeaveRequests.map((sr) => ({
      id: sr.id,
      tenantId: sr.tenantId,
      staffId: sr.userId,
      type: 'Annual Leave',
      startDate: sr.startTime,
      endDate: sr.endTime ?? sr.startTime,
      reason: sr.reason,
      status: sr.status,
      adminNotes: sr.notes,
      createdAt: sr.createdAt,
      updatedAt: sr.updatedAt,
      createdById: sr.userId,
      updatedById: null,
      staff: sr.user,
    }));

    return [...leaveRequests, ...mappedShiftRequests].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async create(tenantId: string, userId: string, dto: CreateLeaveRequestDTO) {
    const created = await prisma.leaveRequest.create({
      data: {
        tenantId,
        staffId: dto.staffId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: 'Pending',
        createdById: userId,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'LEAVE_REQUESTED',
      entityType: 'LeaveRequest',
      entityId: created.id,
      entityLabel: `Leave Request (${dto.type})`,
      tenantId,
      userId,
      description: `Leave request submitted: ${dto.type}`,
      newValue: toJsonValue(created) as Record<string, unknown>,
    });

    return created;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateLeaveRequestStatusDTO,
  ) {
    const existing = await prisma.leaveRequest.findFirst({
      where: { id, tenantId },
      include: {
        staff: { select: { id: true, fullName: true } },
      },
    });

    if (existing) {
      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
          updatedById: userId,
        },
      });

      void this.auditService.emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType:
          dto.status === 'Approved'
            ? 'LEAVE_APPROVED'
            : dto.status === 'Declined'
              ? 'LEAVE_REJECTED'
              : 'LEAVE_UPDATED',
        entityType: 'LeaveRequest',
        entityId: id,
        entityLabel: `Leave Request for ${existing.staff?.fullName || 'Staff'} (${existing.type})`,
        tenantId,
        userId,
        description: `Leave request ${dto.status.toLowerCase()} for ${existing.staff?.fullName || 'Staff'} (${existing.type})`,
        oldValue: { status: existing.status },
        newValue: { status: dto.status, adminNotes: dto.adminNotes },
      });

      return updated;
    }

    const shiftRequest = await prisma.shiftRequest.findFirst({
      where: { id, tenantId, type: 'Leave' },
      select: { id: true },
    });

    if (shiftRequest) {
      const mappedStatus: 'Pending' | 'Approved' | 'Rejected' =
        dto.status === 'Approved' ? 'Approved' : 'Rejected';
      return this.shiftRequestsService.updateStatus(
        id,
        { status: mappedStatus, adminNotes: dto.adminNotes },
        tenantId,
        userId,
      );
    }

    throw new NotFoundException(`Leave request not found`);
  }
}
