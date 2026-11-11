import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import {
  CreateIncidentDTO,
  UpdateIncidentDTO,
  NotifyNextOfKinDTO,
  IncidentListQueryDTO,
} from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { paginate, resolvePagination } from '../common/utils/pagination.util';
import { DutyOfCandourService } from './services/duty-of-candour.service';
import { IncidentNotificationService } from './services/incident-notification.service';
import { IncidentMetricsService } from './services/incident-metrics.service';
import { S3StorageService } from '../storage/s3.service';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly dutyOfCandourService: DutyOfCandourService,
    private readonly incidentNotificationService: IncidentNotificationService,
    private readonly incidentMetricsService: IncidentMetricsService,
    private readonly s3Service: S3StorageService,
  ) {}

  private ensureEditable(incident: {
    status?: string | null;
    id: string;
  }): void {
    if (incident.status === 'Closed') {
      throw new BadRequestException(
        'Closed incidents are read-only and cannot be modified',
      );
    }
  }

  /**
   * Generate an auto-incrementing incident number per tenant.
   * Format: INC-YYYY-NNNN
   */
  private async generateIncidentNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;

    const lastIncident = await prisma.incident.findFirst({
      where: {
        tenantId,
        incidentNumber: { startsWith: prefix },
      },
      orderBy: { incidentNumber: 'desc' },
      select: { incidentNumber: true },
    });

    let nextSeq = 1;
    if (lastIncident?.incidentNumber) {
      const parts = lastIncident.incidentNumber.split('-');
      const lastSeq = parseInt(parts[2] ?? '0', 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  async create(
    dto: CreateIncidentDTO,
    tenantId: string,
    userId: string,
    branchId: string,
  ) {
    const incidentDate = new Date(`${dto.incidentDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(incidentDate.getTime()) || incidentDate > today) {
      throw new BadRequestException(
        'Incident date and time cannot be in the future',
      );
    }

    const incidentNumber = await this.generateIncidentNumber(tenantId);

    // If the incident is tied to a resident, the resident's own branch wins
    // over the caller's scope, so the incident can never disagree with the
    // resident it's about.
    let resolvedBranchId = branchId;
    if (dto.residentId) {
      const resident = await prisma.resident.findFirst({
        where: { id: dto.residentId, tenantId },
        select: { branchId: true },
      });
      if (!resident) throw new NotFoundException('Resident not found');
      resolvedBranchId = resident.branchId;
    }

    const compliance = this.dutyOfCandourService.evaluateComplianceFlags({
      severity: dto.severity,
      harmLevel: dto.harmLevel,
      category: dto.category,
      title: dto.title,
      incidentDate: new Date(dto.incidentDate),
    });

    const incident = await prisma.incident.create({
      data: {
        tenantId,
        branchId: resolvedBranchId,
        incidentNumber,
        title: dto.title,
        category: dto.category,
        incidentDate: new Date(dto.incidentDate),
        incidentTime: dto.incidentTime || null,
        residentId: dto.residentId || null,
        roomNumber: dto.roomNumber || null,
        bedNumber: dto.bedNumber || null,
        harmLevel: dto.harmLevel || null,
        severity: dto.severity ?? 'Medium',
        priority: dto.priority ?? 'Medium',
        location: dto.location || null,
        initialAssessment: dto.initialAssessment || null,
        immediateActions: toJsonValue(dto.immediateActions ?? []),
        investigationDetails: dto.investigationDetails
          ? toJsonValue(dto.investigationDetails)
          : Prisma.JsonNull,
        tasks: dto.tasks ? toJsonValue(dto.tasks) : Prisma.JsonNull,
        attachments: dto.attachments
          ? toJsonValue(dto.attachments)
          : Prisma.JsonNull,
        complianceItems: dto.complianceItems
          ? toJsonValue(dto.complianceItems)
          : Prisma.JsonNull,
        managerNotes: dto.managerNotes || null,
        notes: dto.notes || null,
        reportedById: userId,
        status: 'Open',
        dutyOfCandourApplicable: compliance.dutyOfCandourApplicable,
        dutyOfCandourStatus: compliance.dutyOfCandourStatus,
        writtenNoticeDueAt: compliance.writtenNoticeDueAt,
        cqcNotificationRequired: compliance.cqcNotificationRequired,
      },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            nextOfKin: true,
            gpDetails: true,
            bed: { include: { room: true } },
          },
        },
        reportedBy: { select: { id: true, fullName: true } },
      },
    });

    // Clinical and Safety Push Alert Dispatch for high-severity/fall incidents
    const isCritical =
      dto.severity === 'High' ||
      dto.category === 'Fall' ||
      compliance.cqcNotificationRequired ||
      compliance.dutyOfCandourApplicable;

    if (
      isCritical ||
      ['Medication', 'Safeguarding', 'Restraint', 'Equipment'].includes(
        dto.category,
      )
    ) {
      this.incidentNotificationService
        .triggerIncidentAlert(incident, dto)
        .catch(() => {});
    }

    return incident;
  }

  async findAll(tenantId: string, query: Partial<IncidentListQueryDTO> = {}) {
    const slice = resolvePagination(query);

    const where: Prisma.IncidentWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.residentId) {
      where.residentId = query.residentId;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { incidentNumber: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { resident: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.IncidentOrderByWithRelationInput =
      query.sortBy === 'incidentNumber'
        ? { incidentNumber: sortOrder }
        : query.sortBy === 'priority'
          ? { priority: sortOrder }
          : { createdAt: sortOrder };

    return paginate(
      slice,
      (args: { skip: number | undefined; take: number | undefined }) =>
        prisma.incident.findMany({
          where,
          ...args,
          include: {
            resident: {
              select: {
                id: true,
                fullName: true,
                photoUrl: true,
                nextOfKin: true,
                gpDetails: true,
                bed: { include: { room: true } },
              },
            },
            reportedBy: { select: { id: true, fullName: true } },
            assignedTo: { select: { id: true, fullName: true } },
          },
          orderBy,
        }),
      () => prisma.incident.count({ where }),
    );
  }

  async findOne(id: string, tenantId: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            nextOfKin: true,
            gpDetails: true,
            bed: { include: { room: true } },
          },
        },
        reportedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async getMetrics(tenantId?: string) {
    return this.incidentMetricsService.getMetrics(tenantId);
  }

  async update(id: string, dto: UpdateIncidentDTO, tenantId: string) {
    const incident = await this.findOne(id, tenantId);
    this.ensureEditable(incident);

    if (
      dto.status === 'Closed' &&
      !(dto.managerNotes ?? incident.managerNotes ?? '').trim()
    ) {
      throw new BadRequestException(
        'Management Response Notes are required before resolving an incident',
      );
    }

    const data: Record<string, unknown> = { ...dto };

    // Handle status change to Closed
    if (dto.status === 'Closed' && incident.status !== 'Closed') {
      data.closedAt = new Date();
    }

    if (dto.incidentDate) {
      data.incidentDate = new Date(dto.incidentDate);
    }

    if (dto.immediateActions !== undefined) {
      data.immediateActions = toJsonValue(dto.immediateActions);
    }

    if (dto.investigationDetails !== undefined) {
      data.investigationDetails = dto.investigationDetails
        ? toJsonValue(dto.investigationDetails)
        : Prisma.JsonNull;
    }

    if (dto.tasks !== undefined) {
      data.tasks = dto.tasks ? toJsonValue(dto.tasks) : Prisma.JsonNull;
    }

    if (dto.attachments !== undefined) {
      data.attachments = dto.attachments
        ? toJsonValue(dto.attachments)
        : Prisma.JsonNull;
    }

    if (dto.complianceItems !== undefined) {
      data.complianceItems = dto.complianceItems
        ? toJsonValue(dto.complianceItems)
        : Prisma.JsonNull;
    }

    return prisma.incident.update({
      where: { id: incident.id },
      data,
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            nextOfKin: true,
            gpDetails: true,
            bed: { include: { room: true } },
          },
        },
        reportedBy: { select: { id: true, fullName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });
  }

  async uploadAttachment(
    id: string,
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ) {
    if (!file) throw new NotFoundException('Attachment file is required');
    const incident = await this.findOne(id, tenantId);
    this.ensureEditable(incident);
    const upload = await this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `tenant-${tenantId}/incidents/${id}`,
    );
    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    return {
      id: upload.fileUrl,
      name: file.originalname,
      type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
      fileUrl: upload.fileUrl,
      previewUrl: `${baseUrl}/documents/stream?path=${encodeURIComponent(upload.fileUrl)}`,
    };
  }

  async remove(id: string, tenantId: string) {
    const incident = await this.findOne(id, tenantId);
    this.ensureEditable(incident);

    return prisma.incident.update({
      where: { id: incident.id },
      data: { deletedAt: new Date() },
    });
  }

  async notifyNextOfKin(
    id: string,
    dto: NotifyNextOfKinDTO,
    tenantId: string,
    _userId: string,
  ) {
    const incident = await this.findOne(id, tenantId);
    this.ensureEditable(incident);
    return this.incidentNotificationService.notifyNextOfKin(incident, dto);
  }
}
