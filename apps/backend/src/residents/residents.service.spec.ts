import { Test, TestingModule } from '@nestjs/testing';
import { ResidentsService } from './residents.service';
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
import { AuditService } from '../audit/audit.service';
import { S3StorageService } from '../storage/s3.service';
import { GcsService } from '../storage/gcs.service';
import { CarePlanAutoDraftService } from '../care-plan/care-plan-auto-draft.service';
import { prisma } from '@repo/db';
import { NotFoundException, ConflictException } from '@nestjs/common';
import type { AdmitStep3DTO } from '@repo/schema';

jest.mock('../storage/s3.service', () => ({
  S3StorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn(),
    getFileStream: jest.fn(),
    uploadObject: jest.fn(),
    getObjectMetadata: jest.fn(),
  })),
}));

jest.mock('../storage/gcs.service', () => ({
  GcsService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn(),
    getFileStream: jest.fn(),
    uploadObject: jest.fn(),
    getObjectMetadata: jest.fn(),
  })),
}));

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    residentPreAdmission: {
      findFirst: jest.fn(),
    },
    residentProfile: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    residentAdmission: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    residentCareProfile: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    residentConsent: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    bed: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    careTimeline: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  },
  // residents.service re-exports these from @repo/db; mocking the module
  // wholesale would otherwise make them undefined.
  encrypt: jest.fn((value: string) => `enc:${value}`),
  decrypt: jest.fn((value: string) => value.replace(/^enc:/, '')),
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
  emitDataAccess: jest.fn().mockResolvedValue(undefined),
  emitClinicalDoc: jest.fn().mockResolvedValue(undefined),
  emitCarePlan: jest.fn().mockResolvedValue(undefined),
  emitMedication: jest.fn().mockResolvedValue(undefined),
};

const mockS3Service = {
  uploadFile: jest.fn(),
  getFileStream: jest.fn(),
  uploadObject: jest.fn(),
  getObjectMetadata: jest.fn(),
};

const mockGcsService = mockS3Service;

const mockCarePlanAutoDraftService = {
  generateDraftFromAdmission: jest.fn().mockResolvedValue(null),
};

describe('ResidentsService - Step-by-Step Admission Flow', () => {
  let service: ResidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentsService,
        ResidentAdmissionService,
        ResidentProfileUpdateService,
        ResidentQueryService,
        ResidentAnalyticsService,
        ResidentCareService,
        ResidentTimelineService,
        ResidentMedicationRoundsService,
        ResidentMedicationPrescriptionsService,
        ResidentMedicationAdminService,
        ResidentMedicationAmendService,
        ResidentDocumentService,
        ResidentLifecycleService,
        ResidentConsentService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: S3StorageService,
          useValue: mockS3Service,
        },
        {
          provide: GcsService,
          useValue: mockGcsService,
        },
        {
          provide: CarePlanAutoDraftService,
          useValue: mockCarePlanAutoDraftService,
        },
      ],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateResidentCareProfile', () => {
    it('should update care and medical details', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        id: 'res-101',
        tenantId: 'tenant-1',
        admissionStep: 2,
      });
      (prisma.residentCareProfile.upsert as jest.Mock).mockResolvedValue({
        id: 'care-101',
        residentId: 'res-101',
      });
      (prisma.resident.update as jest.Mock).mockResolvedValue({
        id: 'res-101',
        admissionStep: 3,
      });
      (prisma.resident.findUnique as jest.Mock).mockResolvedValue({
        id: 'res-101',
        admissionStep: 3,
      });

      const dto = {
        careCategory: 'Residential Care',
        primaryCareNeed: 'Physical Support',
        supportRequired: ['Personal Care', 'Mobility Support'],
        medicalConditions: ['Hypertension'],
      };

      const result = await service.updateResidentCareProfile(
        'res-101',
        dto as unknown as AdmitStep3DTO,
        'user-1',
        'tenant-1',
      );

      expect(result.admissionStep).toBe(3);
      expect(prisma.residentCareProfile.upsert).toHaveBeenCalled();
    });
  });

  describe('confirmAdmission', () => {
    // confirmAdmission only runs the bed logic when bedId is a real UUID
    // (this.isUuid); a slug like 'bed-1' is treated as "no bed".
    const BED_UUID = '11111111-1111-1111-1111-111111111111';

    it('should finalize resident admission, update the bed and add a timeline entry', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        id: 'res-101',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        admissionStep: 8,
      });
      (prisma.bed.findFirst as jest.Mock).mockResolvedValue({
        id: BED_UUID,
        status: 'Available',
        residentId: null,
      });
      (prisma.resident.update as jest.Mock).mockResolvedValue({
        id: 'res-101',
        isDraft: false,
        status: 'Active',
        admissionStep: 9,
      });

      const dto = {
        bedId: BED_UUID,
        notes: 'Confirmed admission',
      };

      const result = await service.confirmAdmission(
        'res-101',
        dto,
        'user-1',
        'tenant-1',
      );

      expect(result.isDraft).toBe(false);
      expect(result.status).toBe('Active');
      expect(prisma.bed.update).toHaveBeenCalledWith({
        where: { id: BED_UUID },
        data: expect.objectContaining({
          status: 'Occupied',
          residentId: 'res-101',
        }),
      });
      // Admission is recorded on the care timeline, not the audit log.
      expect(prisma.careTimeline.create).toHaveBeenCalled();
    });

    it('uses the saved pre-admission bed when confirmation omits a bed id', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        id: 'res-101',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        admissionStep: 8,
      });
      (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue({
        roomAllocation: { bedId: BED_UUID },
      });
      (prisma.bed.findFirst as jest.Mock).mockResolvedValue({
        id: BED_UUID,
        status: 'Available',
        residentId: null,
      });
      (prisma.resident.update as jest.Mock).mockResolvedValue({
        id: 'res-101',
        isDraft: false,
        status: 'Active',
        admissionStep: 9,
      });

      await service.confirmAdmission(
        'res-101',
        { bedId: '' },
        'user-1',
        'tenant-1',
      );

      expect(prisma.bed.update).toHaveBeenCalledWith({
        where: { id: BED_UUID },
        data: expect.objectContaining({
          status: 'Occupied',
          residentId: 'res-101',
        }),
      });
    });

    it('should throw ConflictException if requested bed is occupied', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        id: 'res-101',
        tenantId: 'tenant-1',
      });
      (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.bed.findFirst as jest.Mock).mockResolvedValue({
        id: BED_UUID,
        status: 'Occupied',
        residentId: 'other-resident',
      });

      await expect(
        service.confirmAdmission(
          'res-101',
          { bedId: BED_UUID },
          'user-1',
          'tenant-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    describe('resident profile bed lookup', () => {
      const residentWithoutBed = {
        id: 'res-101',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        fullName: 'Resident Example',
        dob: null,
        nhsNumber: null,
        profile: null,
      };

      it('resolves bed details from the current pre-admission room allocation', async () => {
        (prisma.resident.findFirst as jest.Mock).mockResolvedValue(
          residentWithoutBed,
        );
        (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue({
          roomAllocation: { bedId: BED_UUID },
        });
        (prisma.bed.findFirst as jest.Mock).mockResolvedValue({
          id: BED_UUID,
          number: 'B-12',
          room: {
            roomNumber: '101',
            wing: { name: 'East Wing', branch: { name: 'Main Branch' } },
          },
        });

        const result = await service.findOne('res-101', 'tenant-1');

        expect(result).toMatchObject({
          bed: {
            id: BED_UUID,
            number: 'B-12',
            wingName: 'East Wing',
            branchName: 'Main Branch',
            room: { roomNumber: '101' },
          },
        });
      });

      it('does not fall back to the legacy resident bed relation', async () => {
        (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
          ...residentWithoutBed,
          bed: { id: 'legacy-bed', number: 'OLD-1' },
        });
        (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue(
          null,
        );

        const result = await service.findOne('res-101', 'tenant-1');

        expect(result.bed).toBeNull();
        expect(prisma.bed.findFirst).not.toHaveBeenCalled();
      });
    });
  });
});
