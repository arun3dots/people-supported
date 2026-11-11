import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EscalationsService } from './escalations.service';
import { EscalationsTriageService } from './escalations-triage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { prisma } from '@repo/db';
import { CreateClinicalEscalationDTO } from '@repo/schema';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    clinicalEscalation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('EscalationsService', () => {
  let service: EscalationsService;
  let notificationsService: NotificationsService;

  const mockNotificationsService = {
    triggerAlert: jest.fn().mockResolvedValue(undefined),
  };

  const mockTriageService = {
    triage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationsService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: EscalationsTriageService,
          useValue: mockTriageService,
        },
      ],
    }).compile();

    service = module.get<EscalationsService>(EscalationsService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if resident does not exist in tenant', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue(null);

      const dto: CreateClinicalEscalationDTO = {
        residentId: 'res-1',
        reason: 'AbnormalVitals',
        severity: 'High',
        initialNotes: 'High fever 39.1C and shivering',
      };

      await expect(
        service.create(dto, 'tenant-1', 'user-1', 'branch-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create an escalation and trigger notifications to branch nurses', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        id: 'res-1',
        fullName: 'Arthur Pendelton',
        branchId: 'branch-1',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        fullName: 'Carer Sarah',
      });
      (prisma.clinicalEscalation.create as jest.Mock).mockResolvedValue({
        id: 'esc-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        residentId: 'res-1',
        severity: 'High',
        status: 'Open',
        resident: { id: 'res-1', fullName: 'Arthur Pendelton' },
        raisedBy: { id: 'user-1', fullName: 'Carer Sarah' },
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'nurse-1' },
      ]);

      const dto: CreateClinicalEscalationDTO = {
        residentId: 'res-1',
        reason: 'AbnormalVitals',
        severity: 'High',
        initialNotes: 'High fever 39.1C and shivering',
      };

      const result = await service.create(
        dto,
        'tenant-1',
        'user-1',
        'branch-1',
      );

      expect(prisma.clinicalEscalation.create).toHaveBeenCalled();
      expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          recipientId: 'nurse-1',
          title: 'CLINICAL ALERT: A.P. (#res-1)',
          category: 'CLINICAL',
          priority: 'Urgent',
        }),
      );
      expect(result.id).toBe('esc-1');
    });
  });

  describe('findAll', () => {
    it('should filter by tenant and branch', async () => {
      (prisma.clinicalEscalation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.clinicalEscalation.count as jest.Mock).mockResolvedValue(0);

      const res = await service.findAll('tenant-1', 'branch-1', {
        page: 1,
        limit: 10,
        status: 'Open,Triaged',
      });

      expect(prisma.clinicalEscalation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            status: { in: ['Open', 'Triaged'] },
          }),
        }),
      );
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
    });
  });

  describe('managerSignOff', () => {
    it('should sign off and resolve escalation', async () => {
      (prisma.clinicalEscalation.findFirst as jest.Mock).mockResolvedValue({
        id: 'esc-1',
        tenantId: 'tenant-1',
        status: 'EscalatedToManager',
        actionsTaken: [],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'mgr-1',
        fullName: 'Manager David',
      });
      (prisma.clinicalEscalation.update as jest.Mock).mockResolvedValue({
        id: 'esc-1',
        status: 'Resolved',
        managerNotes: 'Reviewed with GP and documented in CQC log',
      });

      const result = await service.managerSignOff(
        'esc-1',
        {
          managerNotes: 'Reviewed with GP and documented in CQC log',
          cqcReportable: true,
        },
        'tenant-1',
        'mgr-1',
      );

      expect(prisma.clinicalEscalation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'esc-1' },
          data: expect.objectContaining({
            status: 'Resolved',
            managerNotes: 'Reviewed with GP and documented in CQC log',
          }),
        }),
      );
      expect(result.status).toBe('Resolved');
    });
  });
});
