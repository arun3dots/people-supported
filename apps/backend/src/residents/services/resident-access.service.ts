import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ResidentAccessService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Asserts that an authenticated user has Caldicott Need-to-Know authorization (D-08 / D-10 / C-10)
   * to view or modify a given resident's clinical and care records.
   */
  async assertCanAccessResident(
    user: AuthenticatedUser,
    residentId: string,
  ): Promise<{
    id: string;
    fullName: string;
    tenantId: string;
    branchId: string | null;
    status: string;
    recordState: string;
  }> {
    const resident = await prisma.resident.findFirst({
      where: {
        id: residentId,
        tenantId: user.tenantId ?? undefined,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        tenantId: true,
        branchId: true,
        status: true,
        recordState: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const role = (user.roleName || '').toLowerCase();
    const isLeadership =
      role === 'admin' || role === 'manager' || role === 'superadmin';

    // C-10: Restrict Discharged or Deceased resident records to Admin & Manager only
    if (
      resident.status === 'Discharged' ||
      resident.status === 'Deceased' ||
      resident.recordState === 'Archived'
    ) {
      if (!isLeadership) {
        const activeBreakGlass = await prisma.breakGlassAccess.findFirst({
          where: {
            tenantId: resident.tenantId,
            residentId: resident.id,
            userId: user.userId,
            expiresAt: { gt: new Date() },
          },
        });
        if (!activeBreakGlass) {
          throw new ForbiddenException(
            "Access to discharged or deceased residents' archived records is restricted to Managers and Administrators (CQC Record Governance C-10).",
          );
        }
      }
      return resident;
    }

    // Platform SuperAdmin or Tenant Admins & Managers have tenant-wide clinical oversight
    if (isLeadership) {
      return resident;
    }

    // For Carers and Nurses, enforce Branch / Wing need-to-know boundaries (D-08 / D-10)
    if (user.branchIds && user.branchIds.length > 0 && resident.branchId) {
      const hasAccess =
        user.branchIds.includes(resident.branchId) ||
        user.activeBranchId === resident.branchId;

      if (!hasAccess) {
        // D-10: Check for an active unexpired Break-Glass Access authorization
        const activeBreakGlass = await prisma.breakGlassAccess.findFirst({
          where: {
            tenantId: resident.tenantId,
            residentId: resident.id,
            userId: user.userId,
            expiresAt: { gt: new Date() },
          },
        });

        if (!activeBreakGlass) {
          throw new ForbiddenException(
            'You do not have permission to access records for residents outside your assigned branch or wing (Caldicott Need-to-Know Principle). In a clinical emergency, utilize the Break-Glass Access workflow.',
          );
        }
      }
    }

    return resident;
  }

  /**
   * D-10: Caldicott Principle 4/7 Emergency Break-Glass Access Workflow.
   * Grants a time-boxed (4-hour) emergency override with mandatory clinical justification.
   */
  async requestBreakGlassAccess(
    user: AuthenticatedUser,
    residentId: string,
    reason: string,
  ): Promise<{ success: boolean; expiresAt: Date; message: string }> {
    const resident = await prisma.resident.findFirst({
      where: {
        id: residentId,
        tenantId: user.tenantId ?? undefined,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        tenantId: true,
        branchId: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4-hour emergency window

    const record = await prisma.breakGlassAccess.create({
      data: {
        tenantId: resident.tenantId,
        residentId: resident.id,
        userId: user.userId,
        reason,
        expiresAt,
      },
    });

    void this.auditService.emit({
      categoryType: 'DATA_ACCESS',
      actionType: 'BREAK_GLASS_ACCESS',
      entityType: 'Resident',
      entityId: resident.id,
      tenantId: resident.tenantId,
      userId: user.userId,
      metadata: {
        breakGlassId: record.id,
        reason,
        expiresAt: expiresAt.toISOString(),
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId: resident.id,
        eventType: 'BREAK_GLASS_ACCESS',
        summary: `Emergency Break-Glass access invoked by ${user.fullName || user.email}. Reason: ${reason}`,
        carerId: user.userId,
        createdById: user.userId,
        updatedById: user.userId,
      },
    });

    // Alert on-duty Managers and Admins
    const managers = await prisma.user.findMany({
      where: {
        tenantId: resident.tenantId,
        role: { name: { in: ['Manager', 'Admin'] } },
        isActive: true,
      },
      select: { id: true },
    });

    for (const manager of managers) {
      void this.notificationsService
        .triggerAlert({
          tenantId: resident.tenantId,
          recipientId: manager.id,
          title: 'EMERGENCY BREAK-GLASS ACCESS INVOKED',
          message: `${user.fullName || user.email} accessed resident records outside their wing under emergency justification: "${reason}"`,
          priority: 'High',
          category: 'SYSTEM',
          metadata: { entityId: resident.id },
        })
        .catch(() => {});
    }

    return {
      success: true,
      expiresAt,
      message:
        'Emergency break-glass access granted for 4 hours. Access has been logged and escalated to on-duty management.',
    };
  }

  /**
   * Retrieves break-glass access review queue for Manager and Admin review.
   */
  async getBreakGlassReviewQueue(tenantId: string) {
    return prisma.breakGlassAccess.findMany({
      where: { tenantId },
      include: {
        resident: { select: { id: true, fullName: true, status: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Reviews and signs off an emergency break-glass event.
   */
  async reviewBreakGlassAccess(
    breakGlassId: string,
    reviewNotes: string,
    reviewerId: string,
    tenantId: string,
  ) {
    const record = await prisma.breakGlassAccess.findFirst({
      where: { id: breakGlassId, tenantId },
    });
    if (!record) throw new NotFoundException('Break-glass record not found');

    const updated = await prisma.breakGlassAccess.update({
      where: { id: breakGlassId },
      data: {
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
      },
    });

    void this.auditService.emit({
      categoryType: 'DATA_ACCESS',
      actionType: 'BREAK_GLASS_REVIEWED',
      entityType: 'BreakGlassAccess',
      entityId: breakGlassId,
      tenantId,
      userId: reviewerId,
      newValue: { reviewedAt: updated.reviewedAt, reviewNotes },
    });

    return updated;
  }
}
