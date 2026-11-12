import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateShiftRequestDto,
  UpdateShiftRequestStatusDto,
} from './dto/shift-requests.dto';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';
import { NotificationsService } from '../notifications/notifications.service';
import { ShiftNotificationService } from './services/shift-notification.service';
import { getUkDayBoundaries } from '../common/utils/time.util';

@Injectable()
export class ShiftRequestsService {
  constructor(
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    @Optional() private shiftNotificationService?: ShiftNotificationService,
  ) {}

  async create(
    data: CreateShiftRequestDto,
    tenantId: string,
    userId: string,
    branchId: string,
  ) {
    // If tied to a specific shift, that shift's branch wins over the
    // caller's own scope, keeping the request consistent with the shift.
    let resolvedBranchId = branchId;
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId, tenantId },
        select: { branchId: true },
      });
      if (!shift) throw new NotFoundException('Shift not found');
      resolvedBranchId = shift.branchId;
    }

    if (!data.startTime) {
      throw new BadRequestException('Start time is required for shift requests.');
    }
    const start = new Date(data.startTime);
    if (isNaN(start.getTime())) {
      throw new BadRequestException(
        'A valid start date and time is required for shift requests.',
      );
    }

    let end: Date;
    if (data.endTime) {
      end = new Date(data.endTime);
      if (isNaN(end.getTime())) {
        const { end: dayEnd } = getUkDayBoundaries(start);
        end = dayEnd;
      }
    } else {
      const { end: dayEnd } = getUkDayBoundaries(start);
      end = dayEnd;
    }

    if (end.getTime() <= start.getTime()) {
      const { end: dayEnd } = getUkDayBoundaries(start);
      end =
        dayEnd.getTime() > start.getTime()
          ? dayEnd
          : new Date(start.getTime() + 8 * 60 * 60 * 1000);
    }

    const request = await prisma.shiftRequest.create({
      data: {
        type: data.type,
        startTime: start,
        endTime: end,
        reason: data.reason,
        notes: data.notes,
        shiftId: data.shiftId || null,
        tenantId,
        branchId: resolvedBranchId,
        userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CREATE',
      entityType: 'ShiftRequest',
      entityId: request.id,
      tenantId,
      userId,
      newValue: toJsonValue(request) as Record<string, unknown>,
    });

    if (data.type === 'Leave') {
      const admins = await prisma.user.findMany({
        where: {
          tenantId,
          role: { name: { in: ['Admin', 'Manager'] } },
          isActive: true,
        },
        select: { id: true },
      });

      const requester = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });

      for (const admin of admins) {
        await this.notificationsService.triggerAlert({
          tenantId,
          recipientId: admin.id,
          title: 'New leave request',
          message: `${requester?.fullName || 'A staff member'} submitted a leave request for review.`,
          category: 'SYSTEM',
          priority: 'Medium',
          actionUrl: '/admin/staff/requests',
          metadata: { shiftRequestId: request.id, requesterId: userId },
          preferPushOverEmail: true,
        });
      }
    }

    return request;
  }

  async findAll(tenantId: string, userId?: string) {
    return prisma.shiftRequest.findMany({
      where: {
        tenantId,
        userId: userId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        shift: {
          include: {
            type: true,
            branch: true,
            wing: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    data: UpdateShiftRequestStatusDto,
    tenantId: string,
    adminId: string,
  ) {
    const existing = await prisma.shiftRequest.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    if (!existing) throw new NotFoundException('Shift request not found');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.shiftRequest.update({
        where: { id },
        data: {
          status: data.status,
          notes: data.adminNotes
            ? `${existing.notes || ''}\nAdmin: ${data.adminNotes}`.trim()
            : existing.notes,
        },
      });

      // Handle shift updates if approved
      if (data.status === 'Approved' && existing.shiftId) {
        if (existing.type === 'Leave' || existing.type === 'Cover') {
          // Unassign staff from the shift
          await tx.shiftAssignment.deleteMany({
            where: {
              shiftId: existing.shiftId,
              userId: existing.userId,
            },
          });
        } else if (existing.type === 'Change') {
          // Update the shift times to match the request
          await tx.shift.update({
            where: { id: existing.shiftId },
            data: {
              startTime: existing.startTime,
              endTime: existing.endTime,
            },
          });
        }
      }

      void this.auditService.emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'UPDATE',
        entityType: 'ShiftRequest',
        entityId: id,
        tenantId,
        userId: adminId,
        oldValue: toJsonValue(existing) as Record<string, unknown>,
        newValue: toJsonValue(updated) as Record<string, unknown>,
      });

      if (
        existing.user?.email &&
        (data.status === 'Rejected' || data.status === 'Approved')
      ) {
        void this.shiftNotificationService?.sendShiftRequestDecisionNotification(
          {
            user: existing.user,
            request: {
              id: existing.id,
              type: existing.type,
              status: data.status,
              startTime: existing.startTime,
              endTime: existing.endTime,
              adminNotes: data.adminNotes,
            },
            tenantName: existing.tenant?.name,
          },
        );
      }

      return updated;
    });
  }
}
