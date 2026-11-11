import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  prisma,
  rawPrisma,
  RawPrismaTransactionClient,
  Prisma,
} from '@repo/db';
import {
  CreateCarePlanWizardDTO,
  UpdateCarePlanDraftDTO,
  UpdateCarePlanMasterDTO,
  type CarePlanListQueryDTO,
  type CarePlanMetricsDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { paginate, resolvePagination } from '../common/utils/pagination.util';

@Injectable()
export class CarePlanService {
  constructor(private readonly auditService: AuditService) {}

  async getMetrics(tenantId: string): Promise<CarePlanMetricsDTO> {
    const allTenantPlans = await prisma.carePlan.findMany({
      where: { tenantId },
      select: { status: true, validTo: true },
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      totalPlans: allTenantPlans.length,
      activeCount: allTenantPlans.filter(
        (p) => p.status === 'Active' || p.status === 'active',
      ).length,
      pendingApprovalCount: allTenantPlans.filter(
        (p) =>
          p.status === 'PendingPrimaryApproval' ||
          p.status === 'PendingSecondaryApproval',
      ).length,
      expiringSoonCount: allTenantPlans.filter(
        (p) =>
          (p.status === 'Active' || p.status === 'active') &&
          p.validTo &&
          p.validTo >= now &&
          p.validTo <= thirtyDaysAhead,
      ).length,
    };
  }

  async findAll(tenantId: string, filters: Partial<CarePlanListQueryDTO> = {}) {
    const slice = resolvePagination(filters);
    const where: Prisma.CarePlanWhereInput = { tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.department) where.departments = { has: filters.department };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.doctorId) {
      where.OR = [
        { primaryDoctorId: filters.doctorId },
        { secondaryDoctorId: filters.doctorId },
        { doctorsInvolved: { has: filters.doctorId } },
      ];
    }
    if (filters.search?.trim()) {
      where.resident = {
        fullName: { contains: filters.search.trim(), mode: 'insensitive' },
      };
    }
    if (filters.expiringWithinDays) {
      const now = new Date();
      const cutoff = new Date(
        now.getTime() + filters.expiringWithinDays * 24 * 60 * 60 * 1000,
      );
      where.validTo = { gte: now, lte: cutoff };
    }

    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.CarePlanOrderByWithRelationInput[] =
      filters.sortBy === 'createdAt'
        ? [{ createdAt: sortOrder }]
        : filters.sortBy === 'versionNumber'
          ? [{ versionNumber: sortOrder }]
          : [{ updatedAt: sortOrder }, { versionNumber: 'desc' }];

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.carePlan.findMany({
          where,
          ...args,
          include: {
            resident: {
              select: {
                id: true,
                fullName: true,
                photoUrl: true,
                status: true,
                bed: {
                  select: {
                    room: {
                      select: {
                        roomNumber: true,
                        wing: { select: { name: true } },
                      },
                    },
                  },
                },
                keyworker: {
                  select: {
                    id: true,
                    fullName: true,
                    role: { select: { name: true } },
                  },
                },
              },
            },
            goals: {
              select: { id: true, status: true, progressPercent: true },
            },
            tasks: { select: { id: true, status: true } },
            approvals: true,
          },
          orderBy,
        }),
      () => prisma.carePlan.count({ where }),
    );

    const allTenantPlans = await prisma.carePlan.findMany({
      where: { tenantId },
      select: { status: true, validTo: true },
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      ...pageResult,
      plans: pageResult.data,
      counters: {
        totalPlans: allTenantPlans.length,
        activeCount: allTenantPlans.filter(
          (p) => p.status === 'Active' || p.status === 'active',
        ).length,
        pendingApprovalCount: allTenantPlans.filter(
          (p) =>
            p.status === 'PendingPrimaryApproval' ||
            p.status === 'PendingSecondaryApproval',
        ).length,
        expiringSoonCount: allTenantPlans.filter(
          (p) =>
            (p.status === 'Active' || p.status === 'active') &&
            p.validTo &&
            p.validTo >= now &&
            p.validTo <= thirtyDaysAhead,
        ).length,
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const plan = await prisma.carePlan.findFirst({
      where: { id, tenantId },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            status: true,
            dob: true,
            bed: { select: { room: { select: { roomNumber: true } } } },
          },
        },
        goals: { include: { tasks: true }, orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        approvals: {
          include: {
            approver: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        parentVersion: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
            validFrom: true,
            validTo: true,
          },
        },
        childVersions: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
            validFrom: true,
            validTo: true,
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Care Plan not found');
    return plan;
  }

  async findByResident(residentId: string, tenantId: string, asOfDate?: Date) {
    if (asOfDate) {
      const planOnDate = await prisma.carePlan.findFirst({
        where: {
          residentId,
          tenantId,
          validFrom: { lte: asOfDate },
          OR: [{ validTo: { gte: asOfDate } }, { validTo: null }],
        },
        include: {
          goals: { include: { tasks: true }, orderBy: { createdAt: 'asc' } },
          tasks: { orderBy: { createdAt: 'asc' } },
          approvals: {
            include: { approver: { select: { id: true, fullName: true } } },
          },
        },
        orderBy: { versionNumber: 'desc' },
      });
      if (planOnDate) return planOnDate;
    }

    return prisma.carePlan.findFirst({
      where: { residentId, tenantId },
      include: {
        goals: { include: { tasks: true }, orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
        approvals: {
          include: { approver: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
    });
  }

  async getResidentVersions(residentId: string, tenantId: string) {
    return prisma.carePlan.findMany({
      where: { residentId, tenantId },
      include: {
        approvals: {
          include: { approver: { select: { id: true, fullName: true } } },
        },
        goals: { select: { id: true, title: true, status: true } },
        tasks: { select: { id: true, title: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async createDraft(
    tenantId: string,
    userId: string,
    dto: CreateCarePlanWizardDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId },
    });
    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.isDraft || resident.status !== 'Active') {
      throw new BadRequestException(
        'Care plans can only be created for active, fully admitted residents.',
      );
    }
    if (new Date(dto.validTo) <= new Date(dto.validFrom)) {
      throw new BadRequestException(
        'Validity End Date must be strictly after Start Date.',
      );
    }

    return rawPrisma.$transaction(async (tx: RawPrismaTransactionClient) => {
      const existingDraft = await tx.carePlan.findFirst({
        where: { residentId: dto.residentId, tenantId, status: 'Draft' },
      });
      if (existingDraft) {
        throw new BadRequestException(
          'A draft care plan already exists for this resident. Please review or edit the existing draft.',
        );
      }

      const latestPlan = await tx.carePlan.findFirst({
        where: { residentId: dto.residentId, tenantId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      const nextVersionNumber = (latestPlan?.versionNumber ?? 0) + 1;

      const plan = await tx.carePlan.create({
        data: {
          tenantId,
          branchId: resident.branchId,
          residentId: dto.residentId,
          versionNumber: nextVersionNumber,
          status: 'Draft',
          validFrom: new Date(dto.validFrom),
          validTo: new Date(dto.validTo),
          nextReviewDate: dto.nextReviewDate
            ? new Date(dto.nextReviewDate)
            : new Date(dto.validTo),
          description: dto.description || null,
          authorId: userId,
          primaryDoctorId: dto.primaryDoctorId ?? null,
          secondaryDoctorId: dto.secondaryDoctorId ?? null,
          authorRole: dto.authorRole ?? 'SeniorCarer',
          clinicalApproverId: dto.clinicalApproverId ?? null,
          managerApproverId: dto.managerApproverId ?? null,
          residentAgreed: dto.residentAgreed ?? true,
          residentAgreementNotes: dto.residentAgreementNotes ?? null,
          representativeName: dto.representativeName ?? null,
          representativeRelationship: dto.representativeRelationship ?? null,
          legalConsentBasis: dto.legalConsentBasis ?? 'ResidentSelf',
          departments: dto.departments || [],
        },
      });

      for (const g of dto.goals) {
        await tx.carePlanGoal.create({
          data: {
            tenantId,
            branchId: plan.branchId,
            carePlanId: plan.id,
            title: g.title,
            targetDescription: g.targetDescription,
            whyItMattersToResident: g.whyItMattersToResident ?? null,
            category: g.category || 'Mobility',
            reviewFrequency: g.reviewFrequency || 'Weekly',
            progressPercent: g.progressPercent || 0,
            status: 'Active',
          },
        });
      }

      for (const t of dto.tasks) {
        await tx.carePlanTask.create({
          data: {
            tenantId,
            branchId: plan.branchId,
            residentId: dto.residentId,
            carePlanId: plan.id,
            title: t.title,
            description: t.description,
            instructions: t.instructions,
            category: t.category,
            frequency: t.frequency || 'Daily',
            timeOfDay: t.timeOfDay || ['Morning'],
            priority: t.priority || 'Medium',
            assignedGroupId: t.assignedGroupId,
            assignedStaffId: t.assignedStaffId,
            requirePhotoOrNote: t.requirePhotoOrNote ?? false,
            escalateIfSkipped: t.escalateIfSkipped ?? false,
            status: 'Active',
            isActive: true,
          },
        });
      }

      await this.auditService.emitCarePlan({
        tenantId,
        userId,
        entityId: plan.id,
        residentId: dto.residentId,
        actionType: 'CREATED',
        description: `Care Plan v0001 draft created for ${resident.fullName}.`,
        newValue: { version: 1, status: 'Draft' },
      });

      return plan;
    });
  }

  async updateDraft(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateCarePlanDraftDTO,
  ) {
    const plan = await prisma.carePlan.findFirst({
      where: { id, tenantId },
      include: { resident: { select: { fullName: true } } },
    });
    if (!plan) throw new NotFoundException('Care Plan not found');

    const isDraftState =
      plan.status === 'Draft' ||
      plan.status === 'ChangesRequested' ||
      plan.status === 'draft' ||
      plan.status === 'changes_requested';
    const isPendingApproval =
      plan.status === 'PendingPrimaryApproval' ||
      plan.status === 'PendingSecondaryApproval' ||
      plan.status === 'pending_primary_approval' ||
      plan.status === 'pending_secondary_approval';

    if (!isDraftState && !isPendingApproval) {
      throw new ConflictException(
        `Cannot edit plan in status '${plan.status}'. Approved or active plans are immutable.`,
      );
    }

    const updateData: Prisma.CarePlanUpdateInput = {};
    if (isDraftState) {
      if (dto.validFrom) updateData.validFrom = new Date(dto.validFrom);
      if (dto.validTo) updateData.validTo = new Date(dto.validTo);
      if (dto.nextReviewDate)
        updateData.nextReviewDate = new Date(dto.nextReviewDate);
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.departments !== undefined) {
        updateData.departments = Array.isArray(dto.departments)
          ? dto.departments
          : dto.departments.split(',').map((d) => d.trim());
      }
    }

    if (dto.primaryDoctorId !== undefined) {
      updateData.primaryDoctorId = dto.primaryDoctorId;
      if (dto.primaryDoctorId) {
        await prisma.carePlanApproval.updateMany({
          where: {
            carePlanId: id,
            tenantId,
            role: 'Primary',
            decision: 'Pending',
          },
          data: { approverId: dto.primaryDoctorId },
        });
      }
    }

    if (dto.secondaryDoctorId !== undefined) {
      updateData.secondaryDoctorId = dto.secondaryDoctorId;
      if (dto.secondaryDoctorId) {
        await prisma.carePlanApproval.updateMany({
          where: {
            carePlanId: id,
            tenantId,
            role: 'Secondary',
            decision: 'Pending',
          },
          data: { approverId: dto.secondaryDoctorId },
        });
      }
    }

    if (dto.authorRole !== undefined) updateData.authorRole = dto.authorRole;
    if (dto.clinicalApproverId !== undefined)
      updateData.clinicalApproverId = dto.clinicalApproverId;
    if (dto.managerApproverId !== undefined)
      updateData.managerApproverId = dto.managerApproverId;
    if (dto.residentAgreed !== undefined)
      updateData.residentAgreed = dto.residentAgreed;
    if (dto.residentAgreementNotes !== undefined)
      updateData.residentAgreementNotes = dto.residentAgreementNotes;
    if (dto.representativeName !== undefined)
      updateData.representativeName = dto.representativeName;
    if (dto.representativeRelationship !== undefined)
      updateData.representativeRelationship = dto.representativeRelationship;
    if (dto.legalConsentBasis !== undefined)
      updateData.legalConsentBasis = dto.legalConsentBasis;

    const updated = await prisma.carePlan.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.emitCarePlan({
      tenantId,
      userId,
      entityId: id,
      residentId: plan.residentId,
      actionType: 'FIELD_CHANGED',
      description: `Plan v${String(plan.versionNumber).padStart(4, '0')} details updated.`,
      newValue: updateData,
    });

    return updated;
  }

  async updateMasterByResident(
    residentId: string,
    tenantId: string,
    userId: string,
    dto: UpdateCarePlanMasterDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const parseList = (val?: string[] | string) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return val
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
    };

    const plan = await prisma.carePlan.findFirst({
      where: { residentId, tenantId },
      orderBy: [{ status: 'asc' }, { versionNumber: 'desc' }],
    });

    if (!plan) {
      const newPlan = await prisma.carePlan.create({
        data: {
          tenantId,
          branchId: resident.branchId,
          residentId,
          versionNumber: 1,
          status: dto.status || 'Active',
          validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
          validTo: dto.validTo ? new Date(dto.validTo) : null,
          nextReviewDate: dto.nextReviewDate
            ? new Date(dto.nextReviewDate)
            : null,
          description: dto.description || null,
          authorId: userId,
          primaryDoctorId: dto.primaryDoctorId || null,
          secondaryDoctorId: dto.secondaryDoctorId || null,
          approvedById: dto.approvedById || null,
          approvedAt: dto.approvedById ? new Date() : null,
          secondaryApprovedById: dto.secondaryApprovedById || null,
          secondaryApprovedAt: dto.secondaryApprovedById ? new Date() : null,
          departments: parseList(dto.departments) || [],
          doctorsInvolved: parseList(dto.doctorsInvolved) || [],
        },
      });

      await this.auditService.emitCarePlan({
        tenantId,
        userId,
        entityId: newPlan.id,
        residentId,
        actionType: 'CREATED',
        description: `Master Care Plan created for ${resident.fullName}.`,
        newValue: newPlan,
      });

      return newPlan;
    }

    const updateData: Prisma.CarePlanUpdateInput = {};
    if (dto.validFrom) updateData.validFrom = new Date(dto.validFrom);
    if (dto.validTo !== undefined) {
      updateData.validTo = dto.validTo ? new Date(dto.validTo) : null;
    }
    if (dto.nextReviewDate !== undefined) {
      updateData.nextReviewDate = dto.nextReviewDate
        ? new Date(dto.nextReviewDate)
        : null;
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.primaryDoctorId !== undefined)
      updateData.primaryDoctorId = dto.primaryDoctorId;
    if (dto.secondaryDoctorId !== undefined)
      updateData.secondaryDoctorId = dto.secondaryDoctorId;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'Active' && !plan.activatedAt) {
        updateData.activatedAt = new Date();
      }
    }
    if (dto.approvedById !== undefined) {
      updateData.approvedById = dto.approvedById;
      if (dto.approvedById) {
        updateData.approvedAt = new Date();
      }
    }
    if (dto.secondaryApprovedById !== undefined) {
      updateData.secondaryApprovedById = dto.secondaryApprovedById;
      if (dto.secondaryApprovedById) {
        updateData.secondaryApprovedAt = new Date();
      }
    }
    if (dto.departments !== undefined) {
      updateData.departments = parseList(dto.departments) || [];
    }
    if (dto.doctorsInvolved !== undefined) {
      updateData.doctorsInvolved = parseList(dto.doctorsInvolved) || [];
    }

    const updated = await prisma.carePlan.update({
      where: { id: plan.id },
      data: updateData,
    });

    await this.auditService.emitCarePlan({
      tenantId,
      userId,
      entityId: plan.id,
      residentId,
      actionType: 'FIELD_CHANGED',
      description: `Master Care Plan details updated for ${resident.fullName}.`,
      newValue: updateData,
    });

    return updated;
  }
}
