import { NotFoundException } from '@nestjs/common';
import { StaffSupervisionService } from './staff-supervision.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    staffSupervision: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    staffAppraisal: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

describe('StaffSupervisionService (G-05 & G-11 CQC Reg 18)', () => {
  let service: StaffSupervisionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StaffSupervisionService(mockAuditService as any);
  });

  it('should create staff supervision record', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'staff-1',
      fullName: 'Emma Carer',
    });
    (prisma.staffSupervision.create as jest.Mock).mockResolvedValue({
      id: 'sup-1',
      staffId: 'staff-1',
      supervisionDate: new Date(),
      status: 'Completed',
    });

    const res = await service.createSupervision(
      {
        staffId: 'staff-1',
        supervisionDate: new Date().toISOString(),
        notes:
          'Monthly 1:1 supervision discussing medication rounds and PEG feeding.',
        actionAgreed: 'Complete updated dementia module by next month.',
        status: 'Completed',
      },
      'mgr-1',
      'ten-1',
    );

    expect(res.id).toBe('sup-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'STAFF_SUPERVISION_RECORDED',
      }),
    );
  });

  it('should create annual staff appraisal record', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'staff-1',
      fullName: 'Emma Carer',
    });
    (prisma.staffAppraisal.create as jest.Mock).mockResolvedValue({
      id: 'app-1',
      staffId: 'staff-1',
      appraisalPeriod: '2025-2026',
      overallRating: 'Meets',
      nextAppraisalDue: new Date(),
    });

    const res = await service.createAppraisal(
      {
        staffId: 'staff-1',
        appraisalPeriod: '2025-2026',
        appraisalDate: new Date().toISOString(),
        objectives:
          'Successfully attained Level 3 NVQ in Health and Social Care.',
        trainingNeeds: 'Fire warden refresher',
        overallRating: 'Meets',
        nextAppraisalDue: new Date(Date.now() + 86400000 * 365).toISOString(),
      },
      'mgr-1',
      'ten-1',
    );

    expect(res.id).toBe('app-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'STAFF_APPRAISAL_RECORDED',
      }),
    );
  });

  it('should throw NotFoundException if staff member not found', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createSupervision(
        {
          staffId: 'missing-staff',
          supervisionDate: new Date().toISOString(),
          notes: 'Detailed discussion notes for supervision session',
        },
        'mgr-1',
        'ten-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
