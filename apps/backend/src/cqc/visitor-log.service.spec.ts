import { NotFoundException } from '@nestjs/common';
import { VisitorLogService } from './visitor-log.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      findFirst: jest.fn(),
    },
    visitorLog: {
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

describe('VisitorLogService (G-02 CQC Reg 9A/10)', () => {
  let service: VisitorLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VisitorLogService(mockAuditService as any);
  });

  it('should create visitor log when resident exists', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
      id: 'res-1',
      fullName: 'Alice Smith',
    });
    (prisma.visitorLog.create as jest.Mock).mockResolvedValue({
      id: 'vis-1',
      visitorName: 'John Doe',
      residentId: 'res-1',
      tenantId: 'ten-1',
    });

    const res = await service.create(
      {
        residentId: 'res-1',
        visitorName: 'John Doe',
        relationship: 'Son',
        contactPhone: '07123456789',
        signInTime: new Date().toISOString(),
      },
      'user-1',
      'ten-1',
    );

    expect(res.id).toBe('vis-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'VISITOR_SIGNED_IN',
        entityId: 'vis-1',
      }),
    );
  });

  it('should throw NotFoundException if resident not found', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.create(
        {
          residentId: 'missing-res',
          visitorName: 'John Doe',
          relationship: 'Son',
          signInTime: new Date().toISOString(),
        },
        'user-1',
        'ten-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should sign out active visitor', async () => {
    (prisma.visitorLog.findFirst as jest.Mock).mockResolvedValue({
      id: 'vis-1',
      visitorName: 'John Doe',
      tenantId: 'ten-1',
      signOutTime: null,
    });
    (prisma.visitorLog.update as jest.Mock).mockResolvedValue({
      id: 'vis-1',
      signOutTime: new Date(),
    });

    const res = await service.signOut(
      'vis-1',
      { signOutTime: new Date().toISOString() },
      'user-1',
      'ten-1',
    );

    expect(res.id).toBe('vis-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'VISITOR_SIGNED_OUT',
      }),
    );
  });
});
