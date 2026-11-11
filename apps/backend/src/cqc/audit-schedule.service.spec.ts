import { NotFoundException } from '@nestjs/common';
import { AuditScheduleService } from './audit-schedule.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    auditSchedule: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

describe('AuditScheduleService (G-10 CQC Reg 17 Good Governance)', () => {
  let service: AuditScheduleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditScheduleService(mockAuditService as any);
  });

  it('should schedule clinical governance audit', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'auditor-1',
      fullName: 'Dr. Lead Auditor',
    });
    (prisma.auditSchedule.create as jest.Mock).mockResolvedValue({
      id: 'audit-1',
      auditType: 'MedicationAudit',
      frequency: 'Monthly',
      scheduledDate: new Date(),
      status: 'Scheduled',
    });

    const res = await service.createSchedule(
      {
        auditType: 'MedicationAudit',
        frequency: 'Monthly',
        scheduledDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        auditorId: '11111111-1111-1111-1111-111111111111',
      },
      'mgr-1',
      'ten-1',
    );

    expect(res.id).toBe('audit-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'SYSTEM',
        actionType: 'AUDIT_SCHEDULED',
      }),
    );
  });

  it('should complete an audit with score and findings', async () => {
    (prisma.auditSchedule.findFirst as jest.Mock).mockResolvedValue({
      id: 'audit-1',
      status: 'Scheduled',
    });
    (prisma.auditSchedule.update as jest.Mock).mockResolvedValue({
      id: 'audit-1',
      status: 'Completed',
      scorePercentage: 94.5,
      findingsSummary:
        'All MAR charts signed and witnessed according to standard operating procedure.',
    });

    const res = await service.completeAudit(
      'audit-1',
      {
        scorePercentage: 94.5,
        findingsSummary:
          'All MAR charts signed and witnessed according to standard operating procedure.',
        actionPlan: 'Continue monthly random sample checks.',
      },
      'nurse-1',
      'ten-1',
    );

    expect(res.status).toBe('Completed');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'SYSTEM',
        actionType: 'AUDIT_COMPLETED',
      }),
    );
  });

  it('should throw NotFoundException if audit schedule not found', async () => {
    (prisma.auditSchedule.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.completeAudit(
        'missing-audit',
        {
          scorePercentage: 80,
          findingsSummary: 'Audit findings summary',
        },
        'nurse-1',
        'ten-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
