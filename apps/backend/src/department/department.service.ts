import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '@repo/schema';

@Injectable()
export class DepartmentService {
  async getDepartments(tenantId: string, branchId?: string) {
    return prisma.department.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        // branchId is nullable — a department with no branch is tenant-wide
        // and stays visible everywhere; one tied to a branch is only
        // visible in that branch.
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createDepartment(
    tenantId: string,
    userId: string,
    data: CreateDepartmentDTO,
  ) {
    return prisma.department.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
      },
    });
  }

  async updateDepartment(
    id: string,
    tenantId: string,
    userId: string,
    data: UpdateDepartmentDTO,
  ) {
    const department = await prisma.department.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return prisma.department.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId,
      },
    });
  }

  async deleteDepartment(id: string, tenantId: string, userId: string) {
    const department = await prisma.department.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return prisma.department.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }
}
