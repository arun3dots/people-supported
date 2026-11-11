import { NotFoundException } from '@nestjs/common';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    equipmentMaintenanceLog: {
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

describe('EquipmentMaintenanceService (G-03 CQC Reg 15)', () => {
  let service: EquipmentMaintenanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EquipmentMaintenanceService(mockAuditService as any);
  });

  it('should create equipment maintenance log', async () => {
    (prisma.equipmentMaintenanceLog.create as jest.Mock).mockResolvedValue({
      id: 'eq-1',
      equipmentName: 'Oxford Hoist A',
      category: 'Hoist',
      status: 'Pass',
      nextServiceDue: new Date(),
    });

    const res = await service.create(
      {
        equipmentName: 'Oxford Hoist A',
        location: 'Ground Floor Wing',
        category: 'Hoist',
        lastCheckedDate: new Date().toISOString(),
        nextServiceDue: new Date(Date.now() + 86400000 * 180).toISOString(),
        status: 'Pass',
        servicedBy: 'Apex Mobility Engineers Ltd',
      },
      'mgr-1',
      'ten-1',
    );

    expect(res.id).toBe('eq-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'SYSTEM',
        actionType: 'EQUIPMENT_LOGGED',
      }),
    );
  });

  it('should update equipment status', async () => {
    (prisma.equipmentMaintenanceLog.findFirst as jest.Mock).mockResolvedValue({
      id: 'eq-1',
      status: 'Pass',
      notes: 'Initial check ok',
    });
    (prisma.equipmentMaintenanceLog.update as jest.Mock).mockResolvedValue({
      id: 'eq-1',
      status: 'OutOfService',
      notes: 'Initial check ok\nBattery failing',
    });

    const res = await service.updateStatus(
      'eq-1',
      { status: 'OutOfService', notes: 'Battery failing' },
      'mgr-1',
      'ten-1',
    );

    expect(res.status).toBe('OutOfService');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'EQUIPMENT_STATUS_UPDATED',
      }),
    );
  });

  it('should throw NotFoundException if equipment log not found', async () => {
    (prisma.equipmentMaintenanceLog.findFirst as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.updateStatus('missing-eq', { status: 'Fail' }, 'mgr-1', 'ten-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
