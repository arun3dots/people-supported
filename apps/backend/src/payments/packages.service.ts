import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, SubscriptionPackage } from '@repo/db';
import type { CreatePackageDTO, UpdatePackageDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class PackagesService {
  constructor(private readonly auditService: AuditService) {}

  /** All non-deleted packages (public + custom), newest first. SuperAdmin view. */
  async findAll(): Promise<SubscriptionPackage[]> {
    return prisma.subscriptionPackage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Active, public, non-custom packages — for the public onboarding page. */
  async findPublic(): Promise<SubscriptionPackage[]> {
    return prisma.subscriptionPackage.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isPublic: true,
        isCustom: false,
      },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async create(
    dto: CreatePackageDTO,
    adminId: string,
  ): Promise<SubscriptionPackage> {
    const pkg = await prisma.subscriptionPackage.create({
      data: {
        name: dto.name,
        priceMonthly: dto.priceMonthly,
        residentLimit: dto.residentLimit,
        staffLimit: dto.staffLimit,
        featureFlags: toJsonValue(dto.featureFlags),
        currency: dto.currency,
        isPublic: dto.isPublic,
        isCustom: false,
        createdById: adminId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'SUBSCRIPTION_PACKAGE_CREATED',
      entityType: 'SubscriptionPackage',
      entityId: pkg.id,
      userId: adminId,
      newValue: toJsonValue(pkg) as Record<string, unknown>,
    });

    return pkg;
  }

  async update(
    id: string,
    dto: UpdatePackageDTO,
    adminId: string,
  ): Promise<SubscriptionPackage> {
    await this.ensureExists(id);
    const pkg = await prisma.subscriptionPackage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.priceMonthly !== undefined && {
          priceMonthly: dto.priceMonthly,
        }),
        ...(dto.residentLimit !== undefined && {
          residentLimit: dto.residentLimit,
        }),
        ...(dto.staffLimit !== undefined && { staffLimit: dto.staffLimit }),
        ...(dto.featureFlags !== undefined && {
          featureFlags: toJsonValue(dto.featureFlags),
        }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedById: adminId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'SUBSCRIPTION_PACKAGE_UPDATED',
      entityType: 'SubscriptionPackage',
      entityId: pkg.id,
      userId: adminId,
      newValue: toJsonValue(pkg) as Record<string, unknown>,
    });

    return pkg;
  }

  async deactivate(id: string, adminId: string): Promise<SubscriptionPackage> {
    await this.ensureExists(id);
    const pkg = await prisma.subscriptionPackage.update({
      where: { id },
      data: { isActive: false, updatedById: adminId },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'SUBSCRIPTION_PACKAGE_DEACTIVATED',
      entityType: 'SubscriptionPackage',
      entityId: pkg.id,
      userId: adminId,
    });

    return pkg;
  }

  private async ensureExists(id: string): Promise<void> {
    const existing = await prisma.subscriptionPackage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Package not found');
  }
}
