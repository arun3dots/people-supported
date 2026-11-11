import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma, PrismaTransactionClient } from '@repo/db';
import {
  CreateBodyMapAssessmentDTO,
  ResolveBodyMapFindingDTO,
  ANATOMY_BY_ID,
} from '@repo/schema';
import { S3StorageService } from '../storage/s3.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/request.interface';
import { BodyMapPhotoService } from './body-map-photo.service';

@Injectable()
export class BodyMapService {
  private readonly logger = new Logger(BodyMapService.name);

  constructor(
    private readonly s3Service: S3StorageService,
    private readonly auditService: AuditService,
    private readonly photoService: BodyMapPhotoService,
  ) {}

  /**
   * Creates a new assessment with its findings in a single transaction.
   * Concurrency-safe: atomically increments resident.bodyMapSequence per finding
   * to guarantee sequential unique tracking IDs (BMF-001, BMF-002, ...).
   * Also writes a CareTimeline entry and emits an audit event.
   */
  async createAssessment(
    dto: CreateBodyMapAssessmentDTO,
    residentId: string,
    tenantId: string,
    user: AuthenticatedUser,
  ) {
    const userId = user.userId;
    // Validate resident belongs to tenant
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    if (resident.status === 'Discharged') {
      throw new BadRequestException(
        'Body Map findings cannot be recorded for discharged residents',
      );
    }
    if (resident.recordState && resident.recordState !== 'Active') {
      throw new BadRequestException(
        `Body Map findings cannot be recorded when resident record state is "${resident.recordState}"`,
      );
    }

    // Validate that all anatomyIds exist in the canonical anatomy catalogue
    for (const finding of dto.findings) {
      if (!ANATOMY_BY_ID.has(finding.anatomyId)) {
        throw new BadRequestException(
          `Invalid anatomyId: "${finding.anatomyId}". Must be registered in the canonical anatomy catalogue.`,
        );
      }
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // 1. Create the assessment record
      const assessment = await tx.bodyMapAssessment.create({
        data: {
          tenantId,
          residentId,
          notes: dto.notes,
          createdById: userId,
        },
      });

      // 2. Concurrency-safe sequential trackingId generation per resident
      const findingsToCreate = [];
      for (const f of dto.findings) {
        // Atomic increment on resident row
        const updatedResident = await tx.resident.update({
          where: { id: residentId },
          data: { bodyMapSequence: { increment: 1 } },
          select: { bodyMapSequence: true },
        });

        const trackingId = `BMF-${String(updatedResident.bodyMapSequence).padStart(3, '0')}`;

        const createdFinding = await tx.bodyMapFinding.create({
          data: {
            assessmentId: assessment.id,
            residentId,
            trackingId,
            view: f.view,
            bodyMapVariant: f.bodyMapVariant,
            anatomyId: f.anatomyId,
            anatomicalRegion: f.anatomicalRegion,
            bodyPart: f.bodyPart,
            subPart: f.subPart,
            detail: f.detail,
            laterality: f.laterality,
            locationLabel: f.locationLabel,
            exactX: f.exactPoint?.x ?? null,
            exactY: f.exactPoint?.y ?? null,
            findingType: f.findingType,
            severity: f.severity,
            description: f.description,
            onsetDate: new Date(f.onsetDate),
            linkedIncidentId: f.linkedIncidentId,
            pressureUlcerCategory: f.pressureUlcerCategory ?? null,
            lengthMm: f.lengthMm ?? null,
            widthMm: f.widthMm ?? null,
            depthMm: f.depthMm ?? null,
            exudateLevel: f.exudateLevel ?? null,
            tissueType: f.tissueType ?? null,
            dressingApplied: f.dressingApplied ?? null,
            nextDressingDueAt: f.nextDressingDueAt
              ? new Date(f.nextDressingDueAt)
              : null,
            createdById: userId,
          },
          include: {
            photos: true,
            actions: { orderBy: { createdAt: 'desc' } },
          },
        });

        findingsToCreate.push(createdFinding);
      }

      const findingsSummary = findingsToCreate
        .map((f) => `${f.trackingId}: ${f.findingType} on ${f.locationLabel}`)
        .join(', ');

      await tx.careTimeline.create({
        data: {
          residentId,
          eventType: 'BODY_MAP',
          summary: `Body Map Assessment: ${findingsSummary}`,
          carerId: userId,
          createdById: userId,
          updatedById: userId,
        },
      });

      // 4. Audit event (fire-and-forget)
      void this.auditService
        .emitClinicalDoc({
          actionType: 'BODY_MAP_UPDATED',
          tenantId,
          userId,
          userEmail: user.email,
          userFullName: user.fullName,
          userRoleName: user.roleName,
          residentId,
          entityType: 'BodyMapAssessment',
          entityId: assessment.id,
          entityLabel: `Body Map Assessment for ${resident.fullName}`,
          newValue: {
            findingCount: findingsToCreate.length,
            findings: findingsToCreate.map((f) => ({
              trackingId: f.trackingId,
              anatomyId: f.anatomyId,
              locationLabel: f.locationLabel,
              findingType: f.findingType,
              severity: f.severity,
            })),
          },
        })
        .catch(() => {});

      return { ...assessment, findings: findingsToCreate };
    });
  }

  /**
   * Returns all assessments for a resident, ordered by most recent.
   * Includes findings with photo counts and normalized exact points.
   */
  async listAssessments(residentId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId, deletedAt: null },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    return prisma.bodyMapAssessment.findMany({
      where: { residentId, tenantId },
      orderBy: { assessedAt: 'desc' },
      include: {
        findings: {
          include: {
            photos: true,
            actions: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Returns a single assessment with full detail.
   */
  async getAssessment(id: string, tenantId: string) {
    const assessment = await prisma.bodyMapAssessment.findFirst({
      where: { id, tenantId },
      include: {
        findings: {
          include: {
            photos: true,
            actions: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  /**
   * Marks a finding as resolved.
   */
  async resolveFinding(
    findingId: string,
    dto: ResolveBodyMapFindingDTO,
    tenantId: string,
    user: AuthenticatedUser,
  ) {
    const userId = user.userId;
    const finding = await prisma.bodyMapFinding.findFirst({
      where: { id: findingId },
      include: {
        assessment: {
          select: { tenantId: true, residentId: true },
        },
      },
    });

    if (!finding) throw new NotFoundException('Finding not found');
    if (finding.assessment.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');
    if (finding.status === 'Resolved')
      throw new BadRequestException('Finding is already resolved');

    const updated = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const resolved = await tx.bodyMapFinding.update({
          where: { id: findingId },
          data: {
            status: 'Resolved',
            resolvedAt: new Date(),
            resolvedById: userId,
            resolutionNote: dto.resolutionNote,
          },
          include: {
            photos: true,
            actions: { orderBy: { createdAt: 'desc' } },
          },
        });

        // Timeline entry for resolution
        await tx.careTimeline.create({
          data: {
            residentId: finding.assessment.residentId,
            eventType: 'BODY_MAP',
            summary: `Body Map Finding Resolved (${finding.trackingId}): ${finding.findingType} on ${finding.locationLabel}`,
            carerId: userId,
            createdById: userId,
            updatedById: userId,
          },
        });

        return resolved;
      },
    );

    // Audit (fire-and-forget)
    void this.auditService
      .emitClinicalDoc({
        actionType: 'BODY_MAP_UPDATED',
        tenantId,
        userId,
        userEmail: user.email,
        userFullName: user.fullName,
        userRoleName: user.roleName,
        residentId: finding.assessment.residentId,
        entityType: 'BodyMapFinding',
        entityId: findingId,
        entityLabel: `Resolved: ${finding.findingType} on ${finding.locationLabel} (${finding.trackingId})`,
        newValue: { status: 'Resolved', resolutionNote: dto.resolutionNote },
      })
      .catch(() => {});

    return updated;
  }

  /**
   * Uploads a photo for a finding to S3 and creates a BodyMapPhoto record.
   */
  uploadPhoto(
    findingId: string,
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ) {
    return this.photoService.uploadPhoto(findingId, file, tenantId, userId);
  }

  streamPhoto(photoId: string, tenantId: string) {
    return this.photoService.streamPhoto(photoId, tenantId);
  }
}
