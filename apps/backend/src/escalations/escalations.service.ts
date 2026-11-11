import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import {
  CreateClinicalEscalationDTO,
  TriageClinicalEscalationDTO,
  ManagerSignOffEscalationDTO,
  EscalationQueryDTO,
} from '@repo/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';
import { toJsonValue } from '../common/utils/json.util';
import {
  EscalationsTriageService,
  ActionTakenLog,
} from './escalations-triage.service';

@Injectable()
export class EscalationsService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly triageService: EscalationsTriageService,
  ) {}

  async create(
    dto: CreateClinicalEscalationDTO,
    tenantId: string,
    userId: string,
    resolvedBranchId: string,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: dto.residentId, tenantId },
      select: {
        id: true,
        fullName: true,
        branchId: true,
        isDraft: true,
        status: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found in this tenant');
    }

    if (resident.isDraft || resident.status === 'Draft') {
      throw new BadRequestException(
        'Cannot raise clinical alert for a resident whose admission is still in draft',
      );
    }

    const branchId = resident.branchId || resolvedBranchId;

    const raiser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });
    const raiserName = raiser?.fullName || raiser?.email || 'Care Staff';

    const initialActionLog: ActionTakenLog[] = [
      {
        role: 'Carer',
        staffName: raiserName,
        action: 'EscalationRaised',
        timestamp: new Date().toISOString(),
        notes: dto.initialNotes,
      },
    ];

    const escalation = await prisma.clinicalEscalation.create({
      data: {
        tenantId,
        branchId,
        residentId: resident.id,
        raisedById: userId,
        assignedToRole: 'Nurse',
        reason: dto.reason,
        severity: dto.severity || 'Medium',
        status: 'Open',
        initialNotes: dto.initialNotes,
        taskId: dto.taskId,
        observationId: dto.observationId,
        actionsTaken: toJsonValue(initialActionLog),
        vitalsSnapshot: dto.vitalsSnapshot
          ? toJsonValue(dto.vitalsSnapshot)
          : undefined,
      },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            dob: true,
            nhsNumber: true,
            dnarStatus: true,
            bed: { select: { room: { select: { roomNumber: true } } } },
          },
        },
        raisedBy: { select: { id: true, fullName: true } },
      },
    });

    // Notify on-duty Nurses and Admin/Manager oversight
    const notifyUsers = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: {
          name: { in: ['Nurse', 'Admin', 'SuperAdmin', 'Manager'] },
        },
      },
      select: { id: true, role: { select: { name: true } } },
    });

    const isUrgent = dto.severity === 'Critical' || dto.severity === 'High';
    const pseudonymized = formatPseudonymizedResident(
      resident.fullName,
      resident.id,
    );
    for (const recipient of notifyUsers) {
      const isNurse = recipient.role?.name === 'Nurse';
      const actionUrl = isNurse ? '/nurse/dashboard' : '/admin/escalations';
      await this.notificationsService.triggerAlert({
        tenantId,
        recipientId: recipient.id,
        title: `CLINICAL ALERT: ${pseudonymized}`,
        message: `${dto.severity} alert raised by ${raiserName} for ${pseudonymized}: ${dto.reason} - ${dto.initialNotes}`,
        category: 'CLINICAL',
        priority: isUrgent ? 'Urgent' : 'High',
        actionUrl,
        preferPushOverEmail: isUrgent,
        metadata: {
          branchId,
          escalationId: escalation.id,
          residentId: resident.id,
          severity: dto.severity,
          reason: dto.reason,
          tab: 'escalations',
        },
      });
    }

    return escalation;
  }

  async findAll(
    tenantId: string,
    userBranchId?: string,
    query?: EscalationQueryDTO,
  ) {
    const branchId = userBranchId ?? query?.branchId;

    const where: Prisma.ClinicalEscalationWhereInput = {
      tenantId,
      ...(branchId ? { branchId } : {}),
      ...(query?.residentId ? { residentId: query.residentId } : {}),
      ...(query?.severity ? { severity: query.severity } : {}),
    };

    if (query?.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    }

    const take = query?.limit ?? 50;
    const page = query?.page ?? 1;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      prisma.clinicalEscalation.findMany({
        where,
        take,
        skip,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          resident: {
            select: {
              id: true,
              fullName: true,
              photoUrl: true,
              dob: true,
              nhsNumber: true,
              dnarStatus: true,
              bed: { select: { room: { select: { roomNumber: true } } } },
            },
          },
          raisedBy: { select: { id: true, fullName: true } },
          resolvedBy: { select: { id: true, fullName: true } },
          dailyTask: {
            select: { id: true, title: true, category: true, status: true },
          },
        },
      }),
      prisma.clinicalEscalation.count({ where }),
    ]);

    return { items, total, page, limit: take };
  }

  async findOne(id: string, tenantId: string, userBranchId?: string) {
    const escalation = await prisma.clinicalEscalation.findFirst({
      where: {
        id,
        tenantId,
        ...(userBranchId ? { branchId: userBranchId } : {}),
      },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            dob: true,
            nhsNumber: true,
            dnarStatus: true,
            bed: { select: { room: { select: { roomNumber: true } } } },
          },
        },
        raisedBy: { select: { id: true, fullName: true } },
        resolvedBy: { select: { id: true, fullName: true } },
        dailyTask: true,
        observation: true,
      },
    });

    if (!escalation) {
      throw new NotFoundException('Clinical escalation record not found');
    }

    return escalation;
  }

  async triage(
    id: string,
    dto: TriageClinicalEscalationDTO,
    tenantId: string,
    nurseId: string,
    userBranchId?: string,
  ) {
    return this.triageService.triage(id, dto, tenantId, nurseId, userBranchId);
  }

  async managerSignOff(
    id: string,
    dto: ManagerSignOffEscalationDTO,
    tenantId: string,
    managerId: string,
  ) {
    const escalation = await prisma.clinicalEscalation.findFirst({
      where: { id, tenantId },
      include: {
        resident: { select: { id: true, fullName: true } },
      },
    });

    if (!escalation) {
      throw new NotFoundException('Clinical escalation record not found');
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { fullName: true, email: true },
    });
    const managerName = manager?.fullName || manager?.email || 'Manager';

    const previousActions: ActionTakenLog[] = Array.isArray(
      escalation.actionsTaken,
    )
      ? (escalation.actionsTaken as unknown as ActionTakenLog[])
      : [];

    const updatedActions: ActionTakenLog[] = [
      ...previousActions,
      {
        role: 'Manager',
        staffName: managerName,
        action: dto.cqcReportable
          ? 'ManagerSignedOff_CQCReportable'
          : 'ManagerSignedOff',
        timestamp: new Date().toISOString(),
        notes: dto.managerNotes,
      },
    ];

    return prisma.clinicalEscalation.update({
      where: { id },
      data: {
        status: 'Resolved',
        managerNotes: dto.managerNotes,
        managerSignedAt: new Date(),
        managerSignedById: managerId,
        resolvedAt: escalation.resolvedAt || new Date(),
        resolvedById: escalation.resolvedById || managerId,
        actionsTaken: toJsonValue(updatedActions),
      },
      include: {
        resident: { select: { id: true, fullName: true } },
        raisedBy: { select: { id: true, fullName: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async getShiftSummary(tenantId: string, branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, openToday, emergencyCount, triagedCount] =
      await Promise.all([
        prisma.clinicalEscalation.count({
          where: { tenantId, branchId, createdAt: { gte: today } },
        }),
        prisma.clinicalEscalation.count({
          where: { tenantId, branchId, status: 'Open' },
        }),
        prisma.clinicalEscalation.count({
          where: {
            tenantId,
            branchId,
            status: { in: ['EscalatedTo999', 'EscalatedToManager'] },
          },
        }),
        prisma.clinicalEscalation.count({
          where: {
            tenantId,
            branchId,
            status: { in: ['Triaged', 'ActionTaken', 'EscalatedToGP'] },
          },
        }),
      ]);

    return {
      totalToday,
      openToday,
      emergencyCount,
      triagedCount,
    };
  }
}
