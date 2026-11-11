import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ResidentAccessService } from './resident-access.service';
import { prisma } from '@repo/db';
import { AuthenticatedUser } from '../../common/interfaces/request.interface';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      findFirst: jest.fn(),
    },
    breakGlassAccess: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    careTimeline: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

const mockNotificationsService = {
  triggerAlert: jest.fn().mockResolvedValue(undefined),
};

describe('ResidentAccessService (D-08 Need-to-Know, D-10 Break-Glass & C-10 Governance)', () => {
  let service: ResidentAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ResidentAccessService(
      mockAuditService as any,
      mockNotificationsService as any,
    );
  });

  it('rejects when resident does not belong to the user tenant', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const user: AuthenticatedUser = {
      userId: 'u1',
      email: 'carer@test.com',
      roleName: 'Carer',
      tenantId: 'tenant-1',
    };

    await expect(
      service.assertCanAccessResident(user, 'res-foreign'),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows Admin and Manager tenant-wide access across all branches', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-1',
      fullName: 'John Doe',
      tenantId: 'tenant-1',
      branchId: 'branch-b',
      status: 'Active',
      recordState: 'Active',
    });

    const adminUser: AuthenticatedUser = {
      userId: 'admin-1',
      email: 'admin@test.com',
      roleName: 'Admin',
      tenantId: 'tenant-1',
    };

    const result = await service.assertCanAccessResident(adminUser, 'res-1');
    expect(result.id).toBe('res-1');
  });

  it('allows Carer access when resident belongs to their assigned branch', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-1',
      fullName: 'John Doe',
      tenantId: 'tenant-1',
      branchId: 'branch-a',
      status: 'Active',
      recordState: 'Active',
    });

    const carerUser: AuthenticatedUser = {
      userId: 'carer-1',
      email: 'carer@test.com',
      roleName: 'Carer',
      tenantId: 'tenant-1',
      branchIds: ['branch-a', 'branch-b'],
      activeBranchId: 'branch-a',
    };

    const result = await service.assertCanAccessResident(carerUser, 'res-1');
    expect(result.id).toBe('res-1');
  });

  it('rejects Carer access when resident belongs to a different branch without break-glass (D-08)', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-99',
      fullName: 'Other Resident',
      tenantId: 'tenant-1',
      branchId: 'branch-z',
      status: 'Active',
      recordState: 'Active',
    });
    (prisma.breakGlassAccess.findFirst as jest.Mock).mockResolvedValueOnce(
      null,
    );

    const carerUser: AuthenticatedUser = {
      userId: 'carer-1',
      email: 'carer@test.com',
      roleName: 'Carer',
      tenantId: 'tenant-1',
      branchIds: ['branch-a'],
      activeBranchId: 'branch-a',
    };

    await expect(
      service.assertCanAccessResident(carerUser, 'res-99'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows Carer access to a different branch when active break-glass session exists (D-10)', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-99',
      fullName: 'Other Resident',
      tenantId: 'tenant-1',
      branchId: 'branch-z',
      status: 'Active',
      recordState: 'Active',
    });
    (prisma.breakGlassAccess.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'bg-1',
      expiresAt: new Date(Date.now() + 100000),
    });

    const carerUser: AuthenticatedUser = {
      userId: 'carer-1',
      email: 'carer@test.com',
      roleName: 'Carer',
      tenantId: 'tenant-1',
      branchIds: ['branch-a'],
      activeBranchId: 'branch-a',
    };

    const result = await service.assertCanAccessResident(carerUser, 'res-99');
    expect(result.id).toBe('res-99');
  });

  it('requests emergency break-glass access, logs audit and notifies managers (D-10)', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-99',
      fullName: 'Emergency Resident',
      tenantId: 'tenant-1',
      branchId: 'branch-z',
    });
    (prisma.breakGlassAccess.create as jest.Mock).mockResolvedValueOnce({
      id: 'bg-100',
    });
    (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'manager-1' },
    ]);

    const carerUser: AuthenticatedUser = {
      userId: 'carer-1',
      email: 'carer@test.com',
      fullName: 'Alice Carer',
      roleName: 'Carer',
      tenantId: 'tenant-1',
    };

    const response = await service.requestBreakGlassAccess(
      carerUser,
      'res-99',
      'Clinical emergency: resident collapsed, urgent vitals required',
    );

    expect(response.success).toBe(true);
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'BREAK_GLASS_ACCESS' }),
    );
    expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'EMERGENCY BREAK-GLASS ACCESS INVOKED',
      }),
    );
  });

  it('narrows access to Discharged or Deceased resident records away from normal Carers (C-10)', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'res-discharged',
      fullName: 'Former Resident',
      tenantId: 'tenant-1',
      branchId: 'branch-a',
      status: 'Discharged',
      recordState: 'Archived',
    });
    (prisma.breakGlassAccess.findFirst as jest.Mock).mockResolvedValueOnce(
      null,
    );

    const carerUser: AuthenticatedUser = {
      userId: 'carer-1',
      email: 'carer@test.com',
      roleName: 'Carer',
      tenantId: 'tenant-1',
      branchIds: ['branch-a'],
    };

    await expect(
      service.assertCanAccessResident(carerUser, 'res-discharged'),
    ).rejects.toThrow(ForbiddenException);
  });
});
