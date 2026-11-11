import { prisma } from '@repo/db';
import { RolesService } from './roles.service';

jest.mock('@repo/db', () => ({
  prisma: {
    role: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('RolesService.findAll', () => {
  const auditService = {
    emit: jest.fn(),
    emitSystem: jest.fn(),
  };
  const service = new RolesService(auditService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters Resident and platform-only role variants from tenant role management', async () => {
    (prisma.role.findMany as jest.Mock).mockResolvedValue([
      { id: 'resident', name: 'Resident', isSystem: true },
      { id: 'resident-space', name: ' Resident Role ', isSystem: true },
      { id: 'super', name: 'Super_Admin', isSystem: true },
      { id: 'admin', name: 'Admin', isSystem: true },
      { id: 'nurse', name: 'Nurse', isSystem: true },
      { id: 'resident-custom', name: 'Resident', tenantId: 'tenant-1' },
    ]);

    const result = await service.findAll('tenant-1');

    expect(result.map((role) => role.name)).toEqual(['Admin', 'Nurse']);
  });

  it('does not filter ordinary tenant staff roles', async () => {
    (prisma.role.findMany as jest.Mock).mockResolvedValue([
      { id: 'manager', name: 'Manager', tenantId: 'tenant-1' },
      { id: 'carer', name: 'Carer', tenantId: 'tenant-1' },
    ]);

    const result = await service.findAll('tenant-1');

    expect(result.map((role) => role.name)).toEqual(['Manager', 'Carer']);
  });
});
