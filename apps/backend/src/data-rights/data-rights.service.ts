import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import type {
  CreateDataRightsRequestDTO,
  SarExportQueryDTO,
} from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DataRightsService {
  constructor(private readonly auditService: AuditService) {}

  async listRequests(tenantId: string) {
    return prisma.dataRightsRequest.findMany({
      where: { tenantId },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async createRequest(
    tenantId: string,
    userId: string,
    dto: CreateDataRightsRequestDTO,
  ) {
    const receivedAt = new Date();
    // UK GDPR Art 12(3): 1 calendar month statutory response window
    const dueAt = new Date(receivedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    return prisma.dataRightsRequest.create({
      data: {
        tenantId,
        subjectType: dto.subjectType,
        residentId: dto.residentId ?? null,
        staffUserId: dto.staffUserId ?? null,
        requestType: dto.requestType,
        requesterName: dto.requesterName,
        requesterRelationship: dto.requesterRelationship ?? null,
        identityVerified: dto.identityVerified,
        authorityVerified: dto.authorityVerified,
        status: 'Open',
        receivedAt,
        dueAt,
        notes: dto.notes ?? null,
        createdById: userId,
      },
    });
  }

  /**
   * B-05 & B-08: Compile complete Resident Subject Access Request (SAR) and
   * Article 20 Data Portability dossier across all resident-scoped tables.
   */
  async buildResidentSarBundle(
    residentId: string,
    tenantId: string,
    actor: {
      userId: string;
      email: string;
      fullName?: string;
      roleName: string;
      ipAddress?: string;
      userAgent?: string;
    },
    query: SarExportQueryDTO,
  ) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      include: {
        profile: true,
        admission: true,
        careProfile: true,
        consent: true,
        bed: { include: { room: { include: { wing: true } } } },
        carePlans: { orderBy: { createdAt: 'desc' } },
        carePlanReviews: { orderBy: { createdAt: 'desc' } },
        carePlanTasks: { include: { dailyTasks: { take: 200 } } },
        observations: { orderBy: { timestamp: 'desc' } },
        medicationRounds: {
          include: { administrations: { orderBy: { administeredAt: 'desc' } } },
        },
        riskAssessments: { include: { controls: true } },
        mentalCapacityAssessments: true,
        dolsAuthorizations: true,
        bodyMapAssessments: { include: { findings: true } },
        incidents: true,
        clinicalEscalations: true,
        foodFluidLogs: { orderBy: { timestamp: 'desc' }, take: 500 },
        careTimelines: { orderBy: { timestamp: 'desc' }, take: 500 },
        documents: {
          select: {
            id: true,
            name: true,
            category: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        belongings: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found in this supported living service');
    }

    const now = new Date();
    await prisma.dataRightsRequest.create({
      data: {
        tenantId,
        subjectType: 'Resident',
        residentId: resident.id,
        requestType: 'SAR',
        requesterName: query.requesterName || actor.fullName || actor.email,
        requesterRelationship:
          query.requesterRelationship || 'Data Controller Export',
        identityVerified: true,
        authorityVerified: true,
        status: 'Completed',
        receivedAt: now,
        dueAt: now,
        completedAt: now,
        redactionConfirmed: Boolean(query.redactionConfirmed),
        createdById: actor.userId,
      },
    });

    void this.auditService.emitDataAccess({
      tenantId,
      userId: actor.userId,
      userEmail: actor.email,
      userFullName: actor.fullName,
      userRoleName: actor.roleName,
      actionType: 'DATA_EXPORTED',
      entityType: 'Resident',
      entityId: resident.id,
      entityLabel: resident.fullName,
      metadata: {
        exportType: 'SAR_PORTABILITY_DOSSIER',
        format: query.format,
        redactionConfirmed: Boolean(query.redactionConfirmed),
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return {
      schemaVersion: 'MODS-DAPB4102-1.0 / UK-GDPR-Art15-Art20',
      exportedAt: now.toISOString(),
      exportedBy: actor.email,
      subjectType: 'Resident',
      redactionGuidance: {
        statutoryReference:
          'UK GDPR Article 15(4) & DPA 2018 Schedule 2 Part 3',
        redactionConfirmedByExporter: Boolean(query.redactionConfirmed),
        checklist: [
          'Verify identity of requester and LPA/Deputy authority (Mental Capacity Act 2005) before disclosure.',
          'Redact names/identifiers of other residents or third-party family informants in incident/timeline notes.',
          'Apply Serious Harm Test (DPA 2018 Sch 3 Part 2) Review by appropriate health professional if applicable.',
        ],
      },
      identityAndDemographics: {
        id: resident.id,
        fullName: resident.fullName,
        dob: resident.dob,
        nhsNumber: resident.nhsNumber,
        status: resident.status,
        admissionDate: resident.admissionDate,
        dnarStatus: resident.dnarStatus,
        profile: resident.profile,
        nextOfKin: resident.nextOfKin,
        gpDetails: resident.gpDetails,
        location: resident.bed,
      },
      admissionAndFunding: resident.admission,
      clinicalCareProfile: resident.careProfile,
      consentsAndCapacity: {
        consent: resident.consent,
        mentalCapacityAssessments: resident.mentalCapacityAssessments,
        dolsAuthorizations: resident.dolsAuthorizations,
      },
      carePlansAndReviews: {
        carePlans: resident.carePlans,
        reviews: resident.carePlanReviews,
        tasks: resident.carePlanTasks,
      },
      observationsAndVitals: resident.observations,
      medicationAdministrationRecords: resident.medicationRounds,
      riskAssessments: resident.riskAssessments,
      skinIntegrityAndBodyMaps: resident.bodyMapAssessments,
      incidentsAndEscalations: {
        incidents: resident.incidents,
        clinicalEscalations: resident.clinicalEscalations,
      },
      nutritionAndHydrationLogs: resident.foodFluidLogs,
      contemporaneousCareTimeline: resident.careTimelines,
      attachedDocumentsInventory: resident.documents,
      belongingsInventory: resident.belongings,
    };
  }

  /**
   * B-05: Compile complete Staff Subject Access Request (SAR) dossier.
   */
  async buildStaffSarBundle(
    staffUserId: string,
    tenantId: string,
    actor: {
      userId: string;
      email: string;
      fullName?: string;
      roleName: string;
      ipAddress?: string;
      userAgent?: string;
    },
    query: SarExportQueryDTO,
  ) {
    const staff = await prisma.user.findFirst({
      where: { id: staffUserId, tenantId },
      include: {
        role: { select: { id: true, name: true } },
        profile: true,
        branches: { include: { branch: { select: { id: true, name: true } } } },
        rightToWork: true,
        dbsCheck: true,
        certifications: true,
        healthClearance: true,
        immunisations: true,
        staffTrainings: true,
        staffExpenses: true,
        shiftAssignments: { include: { shift: true }, take: 500 },
        shiftRequests: { take: 500 },
        staffShiftLogs: { take: 500 },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this supported living service');
    }

    const now = new Date();
    await prisma.dataRightsRequest.create({
      data: {
        tenantId,
        subjectType: 'Staff',
        staffUserId: staff.id,
        requestType: 'SAR',
        requesterName: query.requesterName || staff.fullName,
        requesterRelationship:
          query.requesterRelationship || 'Employee / Staff',
        identityVerified: true,
        authorityVerified: true,
        status: 'Completed',
        receivedAt: now,
        dueAt: now,
        completedAt: now,
        redactionConfirmed: Boolean(query.redactionConfirmed),
        createdById: actor.userId,
      },
    });

    void this.auditService.emitDataAccess({
      tenantId,
      userId: actor.userId,
      userEmail: actor.email,
      userFullName: actor.fullName,
      userRoleName: actor.roleName,
      actionType: 'DATA_EXPORTED',
      entityType: 'User',
      entityId: staff.id,
      entityLabel: staff.fullName,
      metadata: {
        exportType: 'STAFF_SAR_DOSSIER',
        format: query.format,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return {
      schemaVersion: 'UK-GDPR-Art15-Staff-Dossier-1.0',
      exportedAt: now.toISOString(),
      exportedBy: actor.email,
      subjectType: 'Staff',
      identityAndEmployment: {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        dob: staff.dob,
        niNumber: staff.niNumber,
        role: staff.role?.name,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        profile: staff.profile,
        branches: staff.branches,
      },
      recruitmentAndPreEmploymentChecks: {
        rightToWork: staff.rightToWork,
        dbsCheck: staff.dbsCheck,
        healthClearance: staff.healthClearance,
        immunisations: staff.immunisations,
      },
      trainingAndCertifications: {
        certifications: staff.certifications,
        trainings: staff.staffTrainings,
      },
      rotaAndShiftHistory: {
        shiftAssignments: staff.shiftAssignments,
        shiftRequests: staff.shiftRequests,
        shiftAttendanceLogs: staff.staffShiftLogs,
      },
      expenses: staff.staffExpenses,
    };
  }
}
