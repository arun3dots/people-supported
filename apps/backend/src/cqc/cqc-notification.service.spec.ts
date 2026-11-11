import { NotFoundException } from '@nestjs/common';
import { CqcNotificationService } from './cqc-notification.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      findFirst: jest.fn(),
    },
    cqcNotification: {
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

describe('CqcNotificationService (G-14 CQC Reg 16/18 Statutory Notices)', () => {
  let service: CqcNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CqcNotificationService(mockAuditService as any);
  });

  it('should record statutory CQC notice with resident link', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
      id: 'res-1',
      fullName: 'Alice Smith',
    });
    (prisma.cqcNotification.create as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      noticeType: 'SeriousInjury',
      status: 'Pending',
    });

    const res = await service.recordNotice(
      {
        residentId: 'res-1',
        noticeType: 'SeriousInjury',
        incidentDate: new Date().toISOString(),
        summary: 'Fractured clavicle following unwitnessed fall in room.',
        actionTaken:
          'First aid rendered, 999 paramedic called, transferred to A&E, family notified.',
      },
      'nurse-1',
      'ten-1',
    );

    expect(res.id).toBe('notif-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'SYSTEM',
        actionType: 'CQC_NOTIFICATION_RECORDED',
      }),
    );
  });

  it('should throw NotFoundException if residentId specified but not found', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.recordNotice(
        {
          residentId: 'missing-res',
          noticeType: 'DeathOfResident',
          incidentDate: new Date().toISOString(),
          summary:
            'Expected death of resident receiving end of life palliative care.',
          actionTaken: 'GP attended, verified, family supported.',
        },
        'nurse-1',
        'ten-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should mark notice as submitted with CQC reference number', async () => {
    (prisma.cqcNotification.findFirst as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      status: 'Pending',
    });
    (prisma.cqcNotification.update as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      status: 'Submitted',
      cqcReferenceNo: 'CQC-NOTIF-2026-98765',
    });

    const res = await service.markSubmitted(
      'notif-1',
      { cqcReferenceNo: 'CQC-NOTIF-2026-98765' },
      'mgr-1',
      'ten-1',
    );

    expect(res.status).toBe('Submitted');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'SYSTEM',
        actionType: 'CQC_NOTIFICATION_SUBMITTED',
      }),
    );
  });
});
