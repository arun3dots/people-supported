import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Branch } from '@repo/db';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BranchesService {
  constructor(private auditService: AuditService) {}

  async createBranch(
    dto: CreateBranchDto,
    tenantId: string,
    userId: string,
  ): Promise<Branch> {
    const branch = await prisma.branch.create({
      data: {
        ...dto,
        tenantId,
        createdById: userId,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'CREATE',
      entityType: 'Branch',
      entityId: branch.id,
      tenantId,
      userId,
      newValue: toJsonValue(branch) as Record<string, unknown>,
    });

    return branch;
  }

  async findAllBranches(tenantId: string): Promise<Branch[]> {
    return prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findBranchById(id: string, tenantId: string): Promise<Branch> {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async updateBranch(
    id: string,
    dto: UpdateBranchDto,
    tenantId: string,
    userId: string,
  ): Promise<Branch> {
    const oldBranch = await prisma.branch.findFirst({
      where: { id, tenantId },
    });

    const branch = await prisma.branch.update({
      where: { id, tenantId },
      data: {
        ...dto,
        updatedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Branch',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldBranch) as Record<string, unknown>,
      newValue: toJsonValue(branch) as Record<string, unknown>,
    });

    return branch;
  }

  async deleteBranch(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const wingsCount = await prisma.wing.count({
      where: { branchId: id, deletedAt: null },
    });
    if (wingsCount > 0) {
      throw new ConflictException('Cannot delete branch with existing wings');
    }
    const residentsCount = await prisma.resident.count({
      where: { branchId: id, deletedAt: null },
    });
    if (residentsCount > 0) {
      throw new ConflictException(
        'Cannot delete branch with existing residents',
      );
    }

    const oldBranch = await prisma.branch.findFirst({
      where: { id, tenantId },
    });

    await prisma.branch.update({
      where: { id, tenantId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'Branch',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(oldBranch) as Record<string, unknown>,
    });
  }
}
