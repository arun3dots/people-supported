import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateEquipmentLogDTO, UpdateEquipmentStatusDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EquipmentMaintenanceService {
  constructor(private readonly auditService: AuditService) {}

  async create(dto: CreateEquipmentLogDTO, userId: string, tenantId: string) {
    const record = await prisma.equipmentMaintenanceLog.create({
      data: {
        tenantId,
        equipmentName: dto.equipmentName,
        serialNumber: dto.serialNumber || null,
        location: dto.location,
        category: dto.category,
        lastCheckedDate: new Date(dto.lastCheckedDate),
        nextServiceDue: new Date(dto.nextServiceDue),
        status: dto.status,
        servicedBy: dto.servicedBy,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'EQUIPMENT_LOGGED',
      entityType: 'EquipmentMaintenanceLog',
      entityId: record.id,
      tenantId,
      userId,
      newValue: {
        equipmentName: record.equipmentName,
        category: record.category,
        status: record.status,
        nextServiceDue: record.nextServiceDue,
      },
    });

    return record;
  }

  async findAll(tenantId: string, category?: string, status?: string) {
    return prisma.equipmentMaintenanceLog.findMany({
      where: {
        tenantId,
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { nextServiceDue: 'asc' },
    });
  }

  async findDueSoon(tenantId: string, daysAhead: number = 30) {
    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + daysAhead);

    return prisma.equipmentMaintenanceLog.findMany({
      where: {
        tenantId,
        nextServiceDue: {
          lte: futureLimit,
        },
      },
      orderBy: { nextServiceDue: 'asc' },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateEquipmentStatusDTO,
    userId: string,
    tenantId: string,
  ) {
    const existing = await prisma.equipmentMaintenanceLog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Equipment log not found');
    }

    const updated = await prisma.equipmentMaintenanceLog.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes
          ? `${existing.notes ? existing.notes + '\n' : ''}[${new Date().toISOString()}] ${dto.notes}`
          : existing.notes,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'EQUIPMENT_STATUS_UPDATED',
      entityType: 'EquipmentMaintenanceLog',
      entityId: updated.id,
      tenantId,
      userId,
      oldValue: { status: existing.status },
      newValue: { status: updated.status, notes: dto.notes },
    });

    return updated;
  }
}
