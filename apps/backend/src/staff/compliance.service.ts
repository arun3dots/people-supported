import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { S3StorageService } from '../storage/s3.service';
import {
  CreateRtwDto,
  UpdateRtwDto,
  CreateDbsCheckDto,
  UpdateDbsCheckDto,
  CreateCertificationDto,
  UpdateCertificationDto,
  CreateHealthClearanceDto,
  UpdateHealthClearanceDto,
  CreateImmunisationDto,
  UpdateImmunisationDto,
} from './dto/compliance.dto';
import { AuditService } from '../audit/audit.service';
import { ActorContext } from '../common/interfaces/actor.interface';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly s3Service: S3StorageService,
    private readonly auditService: AuditService,
  ) {}
  // ──────────────── RTW ────────────────

  // ──────────────── RTW ────────────────

  async upsertRtw(
    userId: string,
    dto: CreateRtwDto | UpdateRtwDto,
    actor: ActorContext,
  ) {
    const existing = await this.getRtw(userId);
    // Compute follow-up date (1 month before expiry)
    let followUpDate: Date | null = null;
    if (dto.expiryDate) {
      const expiry = new Date(dto.expiryDate);
      followUpDate = new Date(expiry);
      followUpDate.setMonth(followUpDate.getMonth() - 1);
    }

    const result = await prisma.rightToWorkCheck.upsert({
      where: { userId },
      create: {
        userId,
        verificationType: dto.verificationType,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        shareCode: dto.shareCode,
        idvtProvider: dto.idvtProvider,
        transactionRef: dto.transactionRef,
        rtwStatus: dto.rtwStatus || 'Pending',
        verificationDate: dto.verificationDate
          ? new Date(dto.verificationDate)
          : null,
        verifierName: dto.verifierName,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        followUpDate,
        workRestrictions: dto.workRestrictions,
        documentUrl: dto.documentUrl,
      },
      update: {
        verificationType: dto.verificationType,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        shareCode: dto.shareCode,
        idvtProvider: dto.idvtProvider,
        transactionRef: dto.transactionRef,
        rtwStatus: dto.rtwStatus,
        verificationDate: dto.verificationDate
          ? new Date(dto.verificationDate)
          : undefined,
        verifierName: dto.verifierName,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        followUpDate: followUpDate ?? undefined,
        workRestrictions: dto.workRestrictions,
        documentUrl: dto.documentUrl,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'RTW_UPDATED',
      entityType: 'RightToWorkCheck',
      entityId: userId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: existing
        ? (toJsonValue(existing) as Record<string, unknown>)
        : undefined,
      newValue: toJsonValue(result) as Record<string, unknown>,
    });

    return result;
  }

  async getRtw(userId: string) {
    return prisma.rightToWorkCheck.findUnique({ where: { userId } });
  }

  // ──────────────── DBS ────────────────

  async upsertDbs(
    userId: string,
    dto: CreateDbsCheckDto | UpdateDbsCheckDto,
    actor: ActorContext,
  ) {
    const existing = await this.getDbs(userId);
    const result = await prisma.dbsCheck.upsert({
      where: { userId },
      create: {
        userId,
        certificateNumber: dto.certificateNumber,
        type: dto.type,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        updateService: dto.updateService ?? false,
        status: dto.status || 'Pending',
        documentUrl: dto.documentUrl,
      },
      update: {
        certificateNumber: dto.certificateNumber,
        type: dto.type,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        updateService: dto.updateService,
        status: dto.status,
        documentUrl: dto.documentUrl,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        dbsExpiryDate: result.expiryDate,
        dbsNumber: result.certificateNumber,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DBS_UPDATED',
      entityType: 'DbsCheck',
      entityId: userId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: existing
        ? (toJsonValue(existing) as Record<string, unknown>)
        : undefined,
      newValue: toJsonValue(result) as Record<string, unknown>,
    });

    return result;
  }

  async getDbs(userId: string) {
    return prisma.dbsCheck.findUnique({ where: { userId } });
  }

  // ──────────────── Certifications ────────────────

  async createCertification(
    userId: string,
    dto: CreateCertificationDto,
    actor: ActorContext,
  ) {
    const cert = await prisma.staffCertification.create({
      data: {
        userId,
        name: dto.name,
        skills: dto.skills || [],
        issueDate: new Date(dto.issueDate),
        expiryDate: new Date(dto.expiryDate),
        status: dto.status || 'Valid',
        certificateUrl: dto.certificateUrl,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CERTIFICATION_CREATED',
      entityType: 'StaffCertification',
      entityId: cert.id,
      tenantId: actor.tenantId,
      userId: actor.userId,
      newValue: toJsonValue(cert) as Record<string, unknown>,
    });

    return cert;
  }

  async updateCertification(
    certId: string,
    dto: UpdateCertificationDto,
    actor: ActorContext,
  ) {
    const existing = await prisma.staffCertification.findUnique({
      where: { id: certId },
    });
    if (!existing) throw new NotFoundException('Certification not found');

    const updated = await prisma.staffCertification.update({
      where: { id: certId },
      data: {
        name: dto.name,
        skills: dto.skills !== undefined ? dto.skills : undefined,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        status: dto.status,
        certificateUrl: dto.certificateUrl,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'StaffCertification',
      entityId: certId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(updated) as Record<string, unknown>,
    });

    return updated;
  }

  async getCertifications(userId: string) {
    return prisma.staffCertification.findMany({
      where: { userId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async deleteCertification(certId: string, actor: ActorContext) {
    const existing = await prisma.staffCertification.findUnique({
      where: { id: certId },
    });
    if (!existing) throw new NotFoundException('Certification not found');
    await prisma.staffCertification.delete({ where: { id: certId } });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'StaffCertification',
      entityId: certId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
    });
  }

  // ──────────────── Health Clearance ────────────────

  async upsertHealthClearance(
    userId: string,
    dto: CreateHealthClearanceDto | UpdateHealthClearanceDto,
    actor: ActorContext,
  ) {
    const existing = await this.getHealthClearance(userId);
    const health = await prisma.healthClearance.upsert({
      where: { userId },
      create: {
        userId,
        clearanceDate: dto.clearanceDate ? new Date(dto.clearanceDate) : null,
        status: dto.status || 'Pending',
        notes: dto.notes,
        documentUrl: dto.documentUrl,
      },
      update: {
        clearanceDate: dto.clearanceDate
          ? new Date(dto.clearanceDate)
          : undefined,
        status: dto.status,
        notes: dto.notes,
        documentUrl: dto.documentUrl,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'HEALTH_CLEARANCE_UPDATED',
      entityType: 'HealthClearance',
      entityId: userId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: existing
        ? (toJsonValue(existing) as Record<string, unknown>)
        : undefined,
      newValue: toJsonValue(health) as Record<string, unknown>,
    });

    return health;
  }

  async getHealthClearance(userId: string) {
    return prisma.healthClearance.findUnique({ where: { userId } });
  }

  // ──────────────── Immunisations ────────────────

  async createImmunisation(
    userId: string,
    dto: CreateImmunisationDto,
    actor: ActorContext,
  ) {
    try {
      this.logger.log(`Creating immunisation for user ${userId}`, { dto });
      const imm = await prisma.immunisation.create({
        data: {
          userId,
          name: dto.name,
          dateAdministered: new Date(dto.dateAdministered),
          status: dto.status || 'Up to date',
        },
      });

      void this.auditService.emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'IMMUNISATION_CREATED',
        entityType: 'Immunisation',
        entityId: imm.id,
        tenantId: actor.tenantId,
        userId: actor.userId,
        newValue: toJsonValue(imm) as Record<string, unknown>,
      });

      return imm;
    } catch (error) {
      const err = error as Error & { code?: string };
      this.logger.error(
        `Failed to create immunisation for user ${userId}: ${err.message}`,
        err.stack,
      );
      if (err.code === 'P2003') {
        throw new BadRequestException('Invalid staff member ID');
      }
      throw new InternalServerErrorException(
        `Failed to create immunisation: ${err.message}`,
      );
    }
  }

  async updateImmunisation(
    immId: string,
    dto: UpdateImmunisationDto,
    actor: ActorContext,
  ) {
    const existing = await prisma.immunisation.findUnique({
      where: { id: immId },
    });
    if (!existing) throw new NotFoundException('Immunisation not found');

    const imm = await prisma.immunisation.update({
      where: { id: immId },
      data: {
        name: dto.name,
        dateAdministered: dto.dateAdministered
          ? new Date(dto.dateAdministered)
          : undefined,
        status: dto.status,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'IMMUNISATION_UPDATED',
      entityType: 'Immunisation',
      entityId: immId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(imm) as Record<string, unknown>,
    });

    return imm;
  }

  async getImmunisations(userId: string) {
    return prisma.immunisation.findMany({
      where: { userId },
      orderBy: { dateAdministered: 'desc' },
    });
  }

  async deleteImmunisation(immId: string, actor: ActorContext) {
    const existing = await prisma.immunisation.findUnique({
      where: { id: immId },
    });
    if (!existing) throw new NotFoundException('Immunisation not found');
    await prisma.immunisation.delete({ where: { id: immId } });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'IMMUNISATION_DELETED',
      entityType: 'Immunisation',
      entityId: immId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
    });
  }

  // ──────────────── Aggregated Compliance ────────────────

  async getFullCompliance(userId: string) {
    const [rtw, dbs, certifications, health, immunisations] = await Promise.all(
      [
        this.getRtw(userId),
        this.getDbs(userId),
        this.getCertifications(userId),
        this.getHealthClearance(userId),
        this.getImmunisations(userId),
      ],
    );

    return { rtw, dbs, certifications, health, immunisations };
  }

  // ──────────────── Compliance Report ────────────────

  async getComplianceReport(tenantId: string) {
    // Get all staff for the tenant
    const users = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        rightToWork: true,
        dbsCheck: true,
        certifications: true,
        healthClearance: true,
      },
    });

    return users.map((user) => ({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      rtwStatus: user.rightToWork?.rtwStatus || 'Not Submitted',
      rtwExpiry: user.rightToWork?.expiryDate,
      dbsStatus: user.dbsCheck?.status || 'Not Submitted',
      dbsExpiry: user.dbsCheck?.expiryDate,
      healthStatus: user.healthClearance?.status || 'Not Submitted',
      expiredCertifications: user.certifications.filter(
        (c) => c.status === 'Expired',
      ).length,
      totalCertifications: user.certifications.length,
    }));
  }

  // ──────────────── Document Upload ────────────────

  async uploadComplianceDocument(
    userId: string,
    domain: 'rtw' | 'dbs' | 'certification' | 'health',
    file: Buffer,
    fileName: string,
    contentType: string,
    actor: ActorContext,
    certId?: string,
  ) {
    const path = `staff/${userId}/compliance/${domain}`;
    const result = await this.s3Service.uploadFile(
      file,
      fileName,
      contentType,
      path,
    );

    const documentUrl = result.fileUrl;

    // Update the relevant record with the document URL
    switch (domain) {
      case 'rtw':
        await prisma.rightToWorkCheck.update({
          where: { userId },
          data: { documentUrl },
        });
        break;
      case 'dbs':
        await prisma.dbsCheck.update({
          where: { userId },
          data: { documentUrl },
        });
        break;
      case 'certification':
        if (!certId)
          throw new BadRequestException(
            'certId is required for certification uploads',
          );
        await prisma.staffCertification.update({
          where: { id: certId },
          data: { certificateUrl: documentUrl },
        });
        break;
      case 'health': {
        await prisma.healthClearance.upsert({
          where: { userId },
          create: {
            userId,
            status: 'Pending',
            documentUrl,
          },
          update: {
            documentUrl,
          },
        });
        break;
      }
    }

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'COMPLIANCE_DOC_UPLOADED',
      entityType: 'ComplianceDocument',
      entityId: userId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      metadata: { domain, fileName, certId },
    });

    return { documentUrl, fileUrl: result.fileUrl };
  }

  async getSignedDocumentUrl(s3FileName: string, staffId?: string) {
    if (!s3FileName) {
      throw new BadRequestException('Document path is required');
    }
    const meta = await this.s3Service.getObjectMetadata(s3FileName);
    if (!meta.exists) {
      throw new NotFoundException('Document file not found in storage');
    }
    const cleanPath = encodeURIComponent(s3FileName);
    const id = staffId || 'view';
    return `/api/staff/${id}/compliance/document-stream?path=${cleanPath}`;
  }

  getFileStream(s3FileName: string) {
    return this.s3Service.getFileStream(s3FileName);
  }

  async getObjectMetadata(s3FileName: string) {
    return this.s3Service.getObjectMetadata(s3FileName);
  }
}
