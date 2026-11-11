import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EscalationsTriageService } from './escalations-triage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { prisma } from '@repo/db';
import { TriageClinicalEscalationDTO } from '@repo/schema';

jest.mock('@repo/db', () => ({
  prisma: {
    clinicalEscalation: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    observation: {
      create: jest.fn(),
    },
  },
}));

describe('EscalationsTriageService', () => {
  let service: EscalationsTriageService;
  let notificationsService: NotificationsService;

  const mockNotificationsService = {
    triggerAlert: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationsTriageService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<EscalationsTriageService>(EscalationsTriageService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triage', () => {
    it('should throw NotFoundException if escalation does not exist', async () => {
      (prisma.clinicalEscalation.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const dto: TriageClinicalEscalationDTO = {
        decision: 'CallGP',
        sbarSituation: 'Resident fever',
        sbarBackground: 'COPD history',
        sbarAssessment: 'Suspected LRTI',
        sbarRecommendation: 'Prescribe antibiotics',
      };

      await expect(
        service.triage('esc-none', dto, 'tenant-1', 'nurse-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should triage escalation, create observation when vitals present, and update status', async () => {
      (prisma.clinicalEscalation.findFirst as jest.Mock).mockResolvedValue({
        id: 'esc-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        residentId: 'res-1',
        status: 'Open',
        actionsTaken: [],
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'nurse-1',
        fullName: 'Nurse Jackie',
      });

      (prisma.observation.create as jest.Mock).mockResolvedValue({
        id: 'obs-1',
      });

      (prisma.clinicalEscalation.update as jest.Mock).mockResolvedValue({
        id: 'esc-1',
        status: 'EscalatedToGP',
        sbarSituation: 'Resident has fever 38.6C',
        sbarBackground: 'COPD patient',
        sbarAssessment: 'NEWS2 elevated',
        sbarRecommendation: 'Urgent GP consultation',
      });

      const dto: TriageClinicalEscalationDTO = {
        decision: 'CallGP',
        sbarSituation: 'Resident has fever 38.6C',
        sbarBackground: 'COPD patient',
        sbarAssessment: 'NEWS2 elevated',
        sbarRecommendation: 'Urgent GP consultation',
        vitals: {
          respiration: 22,
          spo2: 94,
          bpSystolic: 105,
          pulse: 102,
          temp: 38.6,
        },
      };

      const result = await service.triage('esc-1', dto, 'tenant-1', 'nurse-1');

      expect(prisma.observation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            residentId: 'res-1',
            temp: 38.6,
            pulse: 102,
            bpSystolic: 105,
          }),
        }),
      );

      expect(prisma.clinicalEscalation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'esc-1' },
          data: expect.objectContaining({
            status: 'EscalatedToGP',
            sbarSituation: 'Resident has fever 38.6C',
            observationId: 'obs-1',
          }),
        }),
      );

      expect(result.status).toBe('EscalatedToGP');
    });

    it('should calculate NEWS2 correctly and alert managers when decision is EscalateToManager', async () => {
      (prisma.clinicalEscalation.findFirst as jest.Mock).mockResolvedValue({
        id: 'esc-2',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        residentId: 'res-1',
        status: 'Open',
        actionsTaken: [],
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'nurse-1',
        fullName: 'Nurse Jackie',
      });

      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'mgr-1' }]);

      (prisma.clinicalEscalation.update as jest.Mock).mockResolvedValue({
        id: 'esc-2',
        status: 'EscalatedToManager',
      });

      const dto: TriageClinicalEscalationDTO = {
        decision: 'EscalateToManager',
        sbarSituation: 'Safeguarding and clinical concern',
        sbarBackground: 'Unexplained bruising and deterioration',
        sbarAssessment: 'Requires manager review',
        sbarRecommendation: 'Notify safeguarding lead',
      };

      const result = await service.triage('esc-2', dto, 'tenant-1', 'nurse-1');

      expect(prisma.clinicalEscalation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EscalatedToManager',
          }),
        }),
      );

      expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'mgr-1',
          category: 'CLINICAL',
          priority: 'Urgent',
        }),
      );

      expect(result.status).toBe('EscalatedToManager');
    });
  });
});
