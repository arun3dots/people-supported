import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  Resident,
  CarePlan,
  Prisma,
  PrismaTransactionClient,
} from '@repo/db';
import {
  CarePlanDTO,
  DischargeResidentDTO,
  CreateMedicationRoundBulkDTO,
  ChangeMedicationPrescriptionDTO,
  PauseMedicationPrescriptionDTO,
  StopMedicationPrescriptionDTO,
  AdministerMedicationDTO,
  AdministerAdHocMedicationDTO,
  AmendMedAdministrationDTO,
  AdmitStep1DTO,
  UpdateResidentFundingDTO,
  AdmitStep3DTO,
  AdmitConfirmDTO,
  ResidentMetricsDTO,
  ResidentInsightsDTO,
  SaveDocumentDTO,
  ResidentListQueryDTO,
  PaginatedResponse,
  CreateCareNoteDTO,
  UpdateCareNoteDTO,
  CreateResidentConsentItemDTO,
  WithdrawResidentConsentItemDTO,
  UpdateResidentRecordStateDTO,
  UpdateSupportedLivingDetailsDTO,
} from '@repo/schema';
import type { ActorContext } from '../common/interfaces/actor.interface';
import { toJsonValue } from '../common/utils/json.util';
import { ResidentAdmissionService } from './services/resident-admission.service';
import { ResidentProfileUpdateService } from './services/resident-profile-update.service';
import { ResidentQueryService } from './services/resident-query.service';
import { ResidentAnalyticsService } from './services/resident-analytics.service';
import { ResidentCareService } from './services/resident-care.service';
import { ResidentTimelineService } from './services/resident-timeline.service';
import { ResidentMedicationRoundsService } from './services/resident-medication-rounds.service';
import { ResidentMedicationPrescriptionsService } from './services/resident-medication-prescriptions.service';
import { ResidentMedicationAdminService } from './services/resident-medication-admin.service';
import { ResidentMedicationAmendService } from './services/resident-medication-amend.service';
import { ResidentDocumentService } from './services/resident-document.service';
import { ResidentLifecycleService } from './services/resident-lifecycle.service';
import { ResidentConsentService } from './services/resident-consent.service';

/**
 * ResidentsService acts as a high-level facade coordinating specialized
 * resident domain services while keeping resident admission on the pre-admission flow.
 */
@Injectable()
export class ResidentsService {
  constructor(
    private readonly admissionService: ResidentAdmissionService,
    private readonly residentProfileUpdateService: ResidentProfileUpdateService,
    private readonly queryService: ResidentQueryService,
    private readonly analyticsService: ResidentAnalyticsService,
    private readonly careService: ResidentCareService,
    private readonly timelineService: ResidentTimelineService,
    private readonly medicationRoundsService: ResidentMedicationRoundsService,
    private readonly medicationPrescriptionsService: ResidentMedicationPrescriptionsService,
    private readonly medicationAdminService: ResidentMedicationAdminService,
    private readonly medicationAmendService: ResidentMedicationAmendService,
    private readonly documentService: ResidentDocumentService,
    private readonly lifecycleService: ResidentLifecycleService,
    private readonly consentService: ResidentConsentService,
  ) {}

  // --- Admission & Onboarding ---

  updateResidentPersonalInfo(
    id: string,
    dto: Partial<AdmitStep1DTO>,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    return this.residentProfileUpdateService.updateResidentPersonalInfo(
      id,
      dto,
      updaterId,
      tenantId,
    );
  }

  async updateFunding(
    id: string,
    dto: UpdateResidentFundingDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!resident) throw new NotFoundException('Resident not found');

    const admissionData = {
      localAuthority: dto.localAuthority,
      payer: dto.payer,
      secondaryCoverage: dto.secondaryCoverage,
      insurancePolicyNumber: dto.insurancePolicyNumber,
      benefitId: dto.benefitId,
      billingResponsibleParty:
        dto.billingResponsibleParty === undefined
          ? undefined
          : (toJsonValue(dto.billingResponsibleParty) as object),
      agreedRoomRate: dto.agreedRoomRate,
      agreedRoomRatePeriod: dto.agreedRoomRatePeriod,
      depositAmount: dto.depositAmount,
      depositDate:
        dto.depositDate === undefined
          ? undefined
          : dto.depositDate
            ? new Date(dto.depositDate)
            : null,
      paymentSchedule: dto.paymentSchedule,
      directDebitDetails: dto.directDebitDetails,
    };

    await prisma.$transaction([
      prisma.resident.update({
        where: { id },
        data: { fundingType: dto.fundingType, updatedById: updaterId },
      }),
      prisma.residentAdmission.upsert({
        where: { residentId: id },
        create: { residentId: id, ...admissionData },
        update: admissionData,
      }),
    ]);

    return (await prisma.resident.findUniqueOrThrow({
      where: { id },
    })) as Resident;
  }

  updateResidentCareProfile(
    id: string,
    dto: AdmitStep3DTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    return this.residentProfileUpdateService.updateResidentCareProfile(
      id,
      dto,
      updaterId,
      tenantId,
    );
  }

  updateSupportedLivingDetails(
    id: string,
    dto: UpdateSupportedLivingDetailsDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    return this.residentProfileUpdateService.updateSupportedLivingDetails(
      id,
      dto,
      updaterId,
      tenantId,
    );
  }

  confirmAdmission(
    id: string,
    dto: AdmitConfirmDTO,
    creatorId: string,
    tenantId: string,
  ): Promise<Resident> {
    return this.admissionService.confirmAdmission(id, dto, creatorId, tenantId);
  }

  // --- Lifecycle & Assignments ---

  dischargeResident(
    id: string,
    dto: DischargeResidentDTO,
    updaterId: string,
    tenantId: string,
  ): Promise<Resident> {
    return this.lifecycleService.dischargeResident(
      id,
      dto,
      updaterId,
      tenantId,
    );
  }

  suggestSuitableCarers(residentId: string, tenantId: string) {
    return this.lifecycleService.suggestSuitableCarers(residentId, tenantId);
  }

  assignCarerToResident(
    residentId: string,
    carerId: string,
    tenantId: string,
    assignerId: string,
  ) {
    return this.lifecycleService.assignCarerToResident(
      residentId,
      carerId,
      tenantId,
      assignerId,
    );
  }

  assignResidentToBed(
    residentId: string,
    bedId: string,
    tenantId: string,
    assignerId: string,
  ) {
    return this.lifecycleService.assignResidentToBed(
      residentId,
      bedId,
      tenantId,
      assignerId,
    );
  }

  findAll(
    tenantId: string,
    userId?: string,
    query: Partial<ResidentListQueryDTO> = {},
    actor?: ActorContext,
  ): Promise<PaginatedResponse<Resident>> {
    return this.queryService.findAll(tenantId, userId, query, actor);
  }

  findOne(
    id: string,
    tenantId: string,
    userId?: string,
    actor?: ActorContext,
  ): Promise<Resident> {
    return this.queryService.findOne(id, tenantId, userId, actor);
  }

  // --- Analytics & Insights ---

  getMetrics(tenantId: string): Promise<ResidentMetricsDTO> {
    return this.analyticsService.getMetrics(tenantId);
  }

  getInsights(tenantId: string): Promise<ResidentInsightsDTO> {
    return this.analyticsService.getInsights(tenantId);
  }

  // --- Clinical & Care ---

  addObservation(
    residentId: string,
    observationDto: {
      temp?: number;
      pulse?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
      oxygen?: number;
      news2Score?: number;
      isAbnormal?: boolean;
    },
    creatorId: string,
    tenantId: string,
  ) {
    return this.careService.addObservation(
      residentId,
      observationDto,
      creatorId,
      tenantId,
    );
  }

  saveCarePlan(
    residentId: string,
    carePlanDto: CarePlanDTO,
    updaterId: string,
    tenantId: string,
  ) {
    return this.careService.saveCarePlan(
      residentId,
      carePlanDto,
      updaterId,
      tenantId,
    );
  }

  getTimeline(residentId: string, tenantId: string) {
    return this.timelineService.getTimeline(residentId, tenantId);
  }

  addCareNote(
    residentId: string,
    dto: CreateCareNoteDTO,
    creatorId: string,
    tenantId: string,
  ) {
    return this.careService.addCareNote(residentId, dto, creatorId, tenantId);
  }

  updateCareNote(
    residentId: string,
    noteId: string,
    dto: UpdateCareNoteDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.careService.updateCareNote(
      residentId,
      noteId,
      dto,
      userId,
      tenantId,
    );
  }

  deleteCareNote(
    residentId: string,
    noteId: string,
    userId: string,
    tenantId: string,
  ) {
    return this.careService.deleteCareNote(
      residentId,
      noteId,
      userId,
      tenantId,
    );
  }

  // --- Medications ---

  getMedicationRounds(residentId: string, tenantId: string) {
    return this.medicationRoundsService.getMedicationRounds(
      residentId,
      tenantId,
    );
  }

  createMedicationRound(
    residentId: string,
    data: Record<string, unknown>,
    creatorId: string,
    tenantId: string,
  ) {
    return this.medicationRoundsService.createMedicationRound(
      residentId,
      data as unknown as Prisma.MedicationRoundUncheckedCreateInput,
      creatorId,
      tenantId,
    );
  }

  listMedicationPrescriptions(residentId: string, tenantId: string) {
    return this.medicationPrescriptionsService.listPrescriptions(
      residentId,
      tenantId,
    );
  }

  createMedicationPrescription(
    residentId: string,
    data: CreateMedicationRoundBulkDTO,
    creatorId: string,
    tenantId: string,
  ) {
    return this.medicationPrescriptionsService.createPrescription(
      residentId,
      data,
      creatorId,
      tenantId,
    );
  }

  stopMedicationPrescription(
    prescriptionId: string,
    data: StopMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.medicationPrescriptionsService.stopPrescription(
      prescriptionId,
      data,
      userId,
      tenantId,
    );
  }

  changeMedicationPrescription(
    prescriptionId: string,
    data: ChangeMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.medicationPrescriptionsService.changePrescription(
      prescriptionId,
      data,
      userId,
      tenantId,
    );
  }

  pauseMedicationPrescription(
    prescriptionId: string,
    data: PauseMedicationPrescriptionDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.medicationPrescriptionsService.pausePrescription(
      prescriptionId,
      data,
      userId,
      tenantId,
    );
  }

  updateMedicationRound(
    roundId: string,
    data: Record<string, unknown>,
    updaterId: string,
    tenantId: string,
  ) {
    return this.medicationRoundsService.updateMedicationRound(
      roundId,
      data,
      updaterId,
      tenantId,
    );
  }

  deleteMedicationRound(
    roundId: string,
    deleterId: string,
    tenantId: string,
    reason: string,
  ) {
    return this.medicationRoundsService.deleteMedicationRound(
      roundId,
      deleterId,
      tenantId,
      reason,
    );
  }

  administerMedication(
    data: AdministerMedicationDTO,
    carerId: string,
    tenantId: string,
  ) {
    return this.medicationAdminService.administerMedication(
      data,
      carerId,
      tenantId,
    );
  }

  amendMedicationAdministration(
    administrationId: string,
    data: AmendMedAdministrationDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.medicationAmendService.amendMedicationAdministration(
      administrationId,
      data,
      userId,
      tenantId,
    );
  }

  administerAdHocMedication(
    residentId: string,
    data: AdministerAdHocMedicationDTO,
    carerId: string,
    tenantId: string,
  ) {
    return this.medicationAdminService.administerAdHocMedication(
      residentId,
      data,
      carerId,
      tenantId,
    );
  }

  // --- Documents & Photos ---

  getResidentDocuments(residentId: string, tenantId: string) {
    return this.documentService.getResidentDocuments(residentId, tenantId);
  }

  getDocumentById(id: string, tenantId: string) {
    return this.documentService.getDocumentById(id, tenantId);
  }

  getDocumentStream(s3FileName: string) {
    return this.documentService.getDocumentStream(s3FileName);
  }

  getDocumentUploadUrl(
    residentId: string,
    fileName: string,
    contentType: string,
    tenantId: string,
  ) {
    return this.documentService.getDocumentUploadUrl(
      residentId,
      fileName,
      contentType,
      tenantId,
    );
  }

  uploadDocumentFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    path: string,
  ) {
    return this.documentService.uploadDocumentFile(
      file,
      fileName,
      contentType,
      path,
    );
  }

  saveDocumentRecord(
    residentId: string,
    data: SaveDocumentDTO,
    creatorId: string,
    tenantId: string,
  ) {
    return this.documentService.saveDocumentRecord(
      residentId,
      data,
      creatorId,
      tenantId,
    );
  }

  getObjectMetadata(s3FileName: string) {
    return this.documentService.getObjectMetadata(s3FileName);
  }

  deleteDocument(documentId: string, deleterId: string, tenantId: string) {
    return this.documentService.deleteDocument(documentId, deleterId, tenantId);
  }

  archiveDocument(documentId: string, archiverId: string, tenantId: string) {
    return this.documentService.archiveDocument(
      documentId,
      archiverId,
      tenantId,
    );
  }

  restoreDocument(documentId: string, restorerId: string, tenantId: string) {
    return this.documentService.restoreDocument(
      documentId,
      restorerId,
      tenantId,
    );
  }

  verifyDocument(
    documentId: string,
    verifierId: string,
    tenantId: string,
    status = 'Verified',
  ) {
    return this.documentService.verifyDocument(
      documentId,
      verifierId,
      tenantId,
      status,
    );
  }

  uploadResidentPhoto(
    residentId: string,
    file: Buffer,
    fileName: string,
    contentType: string,
    tenantId: string,
    updaterId: string,
  ): Promise<Resident> {
    return this.documentService.uploadResidentPhoto(
      residentId,
      file,
      fileName,
      contentType,
      tenantId,
      updaterId,
    );
  }

  getResidentPhoto(residentId: string, tenantId: string) {
    return this.documentService.getResidentPhoto(residentId, tenantId);
  }

  updateRecordState(
    residentId: string,
    dto: UpdateResidentRecordStateDTO,
    updaterId: string,
    tenantId: string,
  ) {
    return this.lifecycleService.updateRecordState(
      residentId,
      dto,
      updaterId,
      tenantId,
    );
  }

  createConsentItem(
    dto: CreateResidentConsentItemDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.consentService.createConsentItem(dto, userId, tenantId);
  }

  listConsentItems(residentId: string, tenantId: string) {
    return this.consentService.listConsentItems(residentId, tenantId);
  }

  withdrawConsentItem(
    consentItemId: string,
    dto: WithdrawResidentConsentItemDTO,
    userId: string,
    tenantId: string,
  ) {
    return this.consentService.withdrawConsentItem(
      consentItemId,
      dto,
      userId,
      tenantId,
    );
  }
}
