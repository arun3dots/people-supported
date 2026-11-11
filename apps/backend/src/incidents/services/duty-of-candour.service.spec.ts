import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DutyOfCandourService } from './duty-of-candour.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    incident: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuditService = {
  emitSafeguarding: jest.fn().mockResolvedValue(undefined),
};

describe('DutyOfCandourService (G-13 CQC Reg 20 Duty of Candour & 10-day Notice SLA)', () => {
  let service: DutyOfCandourService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DutyOfCandourService(mockAuditService as any);
  });

  describe('evaluateComplianceFlags', () => {
    it('should trigger Duty of Candour and 10-day SLA for High severity incident', () => {
      const incidentDate = new Date('2026-11-01T10:00:00.000Z');
      const result = service.evaluateComplianceFlags({
        severity: 'High',
        incidentDate,
      });

      expect(result.dutyOfCandourApplicable).toBe(true);
      expect(result.dutyOfCandourStatus).toBe('PendingApology');
      expect(result.writtenNoticeDueAt).toEqual(
        new Date('2026-11-11T10:00:00.000Z'),
      );
      expect(result.cqcNotificationRequired).toBe(true);
    });

    it('should trigger Duty of Candour for severe harm level', () => {
      const incidentDate = new Date('2026-11-01T10:00:00.000Z');
      const result = service.evaluateComplianceFlags({
        severity: 'Medium',
        harmLevel: 'Level 4',
        incidentDate,
      });

      expect(result.dutyOfCandourApplicable).toBe(true);
      expect(result.dutyOfCandourStatus).toBe('PendingApology');
    });

    it('should trigger Duty of Candour when title mentions fracture', () => {
      const incidentDate = new Date('2026-11-01T10:00:00.000Z');
      const result = service.evaluateComplianceFlags({
        severity: 'Medium',
        title: 'Suspected fractured neck of femur after fall',
        incidentDate,
      });

      expect(result.dutyOfCandourApplicable).toBe(true);
    });

    it('should not trigger Duty of Candour for minor minor incidents', () => {
      const incidentDate = new Date('2026-11-01T10:00:00.000Z');
      const result = service.evaluateComplianceFlags({
        severity: 'Low',
        harmLevel: 'Level 1',
        category: 'MinorGraze',
        title: 'Superficial skin tear on forearm',
        incidentDate,
      });

      expect(result.dutyOfCandourApplicable).toBe(false);
      expect(result.dutyOfCandourStatus).toBeNull();
      expect(result.writtenNoticeDueAt).toBeNull();
    });
  });

  describe('recordDutyOfCandour', () => {
    it('should update Duty of Candour status and emit audit log', async () => {
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        tenantId: 'tenant-1',
        incidentNumber: 'INC-2026-001',
        status: 'Investigating',
        resident: { fullName: 'Charles Vance' },
      });
      (prisma.incident.update as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        dutyOfCandourStatus: 'ApologyGiven',
      });

      const res = await service.recordDutyOfCandour(
        'inc-1',
        'tenant-1',
        'user-1',
        {
          dutyOfCandourStatus: 'ApologyGiven',
          apologyDate: new Date().toISOString(),
          apologyMethod: 'InPerson',
          writtenNoticeSentAt: new Date().toISOString(),
        },
      );

      expect(res.id).toBe('inc-1');
      expect(mockAuditService.emitSafeguarding).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'INCIDENT_ACTIONED',
          metadata: expect.objectContaining({
            referralTarget: 'DutyOfCandour',
          }),
        }),
      );
    });

    it('should reject modification if incident is Closed', async () => {
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        tenantId: 'tenant-1',
        status: 'Closed',
      });

      await expect(
        service.recordDutyOfCandour('inc-1', 'tenant-1', 'user-1', {
          dutyOfCandourStatus: 'ApologyGiven',
          apologyDate: new Date().toISOString(),
          apologyMethod: 'InPerson',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if incident not found', async () => {
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.recordDutyOfCandour('missing-id', 'tenant-1', 'user-1', {
          dutyOfCandourStatus: 'ApologyGiven',
          apologyDate: new Date().toISOString(),
          apologyMethod: 'Phone',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordCqcNotification', () => {
    it('should record statutory CQC notice reference and emit audit log', async () => {
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        tenantId: 'tenant-1',
        incidentNumber: 'INC-2026-001',
        status: 'Investigating',
        resident: { fullName: 'Charles Vance' },
      });
      (prisma.incident.update as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        cqcReferenceNumber: 'CQC-NOTIF-998877',
      });

      const res = await service.recordCqcNotification(
        'inc-1',
        'tenant-1',
        'user-1',
        {
          cqcReferenceNumber: 'CQC-NOTIF-998877',
          cqcNotificationSubmittedAt: new Date().toISOString(),
        },
      );

      expect(res.id).toBe('inc-1');
      expect(mockAuditService.emitSafeguarding).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'REFERRAL_MADE',
          metadata: expect.objectContaining({
            referralTarget: 'CQC',
            cqcRef: 'CQC-NOTIF-998877',
          }),
        }),
      );
    });
  });

  describe('findPendingDutyOfCandourIncidents', () => {
    it('should categorize SLA status as Overdue when deadline has passed', async () => {
      const pastDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      (prisma.incident.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inc-overdue',
          incidentNumber: 'INC-2026-002',
          category: 'Fall',
          incidentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          dutyOfCandourStatus: 'PendingApology',
          writtenNoticeDueAt: pastDueDate,
          resident: { id: 'res-1', fullName: 'Charles Vance' },
        },
      ]);

      const pending =
        await service.findPendingDutyOfCandourIncidents('tenant-1');

      expect(pending.length).toBe(1);
      expect(pending[0].slaStatus).toBe('Overdue');
      expect(pending[0].daysRemaining).toBeLessThan(0);
    });

    it('should categorize SLA status as DueSoon when deadline is within 2 days', async () => {
      const dueSoonDate = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000);
      (prisma.incident.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inc-duesoon',
          incidentNumber: 'INC-2026-003',
          category: 'Fracture',
          incidentDate: new Date(Date.now() - 8.5 * 24 * 60 * 60 * 1000),
          dutyOfCandourStatus: 'PendingApology',
          writtenNoticeDueAt: dueSoonDate,
          resident: { id: 'res-2', fullName: 'Daisy Miller' },
        },
      ]);

      const pending =
        await service.findPendingDutyOfCandourIncidents('tenant-1');

      expect(pending.length).toBe(1);
      expect(pending[0].slaStatus).toBe('DueSoon');
    });
  });
});
