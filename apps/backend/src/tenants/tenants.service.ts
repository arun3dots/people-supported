import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma, Tenant, PrismaTransactionClient } from '@repo/db';
import type {
  CreateTenantDTO,
  UpdateTenantDTO,
  SuperAdminCreateTenantDTO,
  PublicOnboardingDTO,
  CustomPackageDTO,
  TenantStatus,
} from '@repo/schema';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../common/mail/mail.service';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';
import { PaymentService } from '../payments/payment.service';

/** Tenant augmented with the subscription payment link (when one was created). */
type TenantWithPayment = Tenant & { paymentUrl?: string };

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private mailService: MailService,
    private auditService: AuditService,
    private paymentService: PaymentService,
  ) {}

  /**
   * SuperAdmin tenant creation. Optionally accepts a one-off `customPackage`
   * (becomes a hidden, tenant-specific SubscriptionPackage). After provisioning,
   * a payment link is generated for the chosen package and emailed.
   */
  async create(
    dto: SuperAdminCreateTenantDTO,
    adminId: string,
  ): Promise<TenantWithPayment> {
    let packageId = dto.packageId ?? undefined;

    if (dto.customPackage) {
      const custom = await this.createCustomPackage(dto.customPackage, adminId);
      packageId = custom.id;
    }

    const tenant = await this.provisionTenant(dto, packageId, adminId);
    const { paymentUrl } = await this.startSubscriptionPayment(
      tenant,
      packageId,
    );
    return { ...tenant, paymentUrl };
  }

  /**
   * Public, self-serve onboarding. A valid public package must be chosen. Creates
   * the tenant + Admin user, then emails a payment link.
   */
  async publicOnboard(dto: PublicOnboardingDTO): Promise<{
    tenantId: string;
    subdomain: string;
    paymentUrl?: string;
    paymentToken?: string;
  }> {
    const pkg = await prisma.subscriptionPackage.findFirst({
      where: {
        id: dto.packageId,
        isActive: true,
        isPublic: true,
        isCustom: false,
        deletedAt: null,
      },
    });
    if (!pkg) {
      throw new BadRequestException('Selected package is not available');
    }

    const tenant = await this.provisionTenant(dto, pkg.id);
    const { paymentUrl, paymentToken } = await this.startSubscriptionPayment(
      tenant,
      pkg.id,
    );
    return {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      paymentUrl,
      paymentToken,
    };
  }

  /** Creates a hidden, tenant-specific custom package. */
  private async createCustomPackage(custom: CustomPackageDTO, adminId: string) {
    return prisma.subscriptionPackage.create({
      data: {
        name: custom.name,
        priceMonthly: custom.priceMonthly,
        residentLimit: custom.residentLimit,
        staffLimit: custom.staffLimit,
        featureFlags: toJsonValue(custom.featureFlags),
        currency: custom.currency,
        isCustom: true,
        isPublic: false,
        createdById: adminId,
      },
    });
  }

  /**
   * Generates + emails a subscription payment link for a tenant's package.
   * Best-effort: never fails tenant creation (a link can be regenerated later
   * via /billing/payment-link). Returns the link URL and token when available.
   */
  private async startSubscriptionPayment(
    tenant: Tenant,
    packageId?: string,
  ): Promise<{ paymentUrl?: string; paymentToken?: string }> {
    if (!packageId) return {};
    try {
      const pkg = await prisma.subscriptionPackage.findUnique({
        where: { id: packageId },
      });
      if (!pkg) return {};
      const payment = await this.paymentService.createPaymentForTenant(
        tenant.id,
        pkg,
        {
          name: tenant.primaryContactName ?? tenant.name,
          email: tenant.primaryContactEmail ?? '',
          phone: tenant.primaryContactPhone ?? undefined,
        },
      );
      if (payment.shortUrl && tenant.primaryContactEmail) {
        await this.paymentService.emailPaymentLink(
          tenant.primaryContactEmail,
          tenant.name,
          payment.shortUrl,
        );
      }
      return {
        paymentUrl: payment.shortUrl ?? undefined,
        paymentToken: payment.token,
      };
    } catch (error) {
      this.logger.error(
        'Tenant created but payment link generation failed:',
        error,
      );
      return {};
    }
  }

  /**
   * Core provisioning: uniqueness checks + Tenant + default Admin Role + Admin
   * User + verification email, in one transaction. Shared by SuperAdmin create
   * and public onboarding. Tenant starts `status:'Pending'`,
   * `subscriptionStatus:'unpaid'`.
   */
  private async provisionTenant(
    dto: CreateTenantDTO,
    packageId: string | undefined,
    adminId?: string,
  ): Promise<Tenant> {
    try {
      // Normalise optional fields: a blank string would otherwise be stored as
      // "" and collide on the unique cqcNumber index (Postgres allows many
      // NULLs but only one ""). Treat blank as "not provided".
      const cqcNumber = dto.cqcNumber?.trim() ? dto.cqcNumber.trim() : null;
      const cqcProviderId = dto.cqcProviderId?.trim()
        ? dto.cqcProviderId.trim()
        : null;
      const cqcLocationId = dto.cqcLocationId?.trim()
        ? dto.cqcLocationId.trim()
        : null;
      const addressLine2 = dto.addressLine2?.trim()
        ? dto.addressLine2.trim()
        : null;

      const existingTenant = await prisma.tenant.findUnique({
        where: { subdomain: dto.subdomain },
      });
      if (existingTenant) {
        throw new ConflictException('Subdomain already exists');
      }

      if (cqcNumber) {
        const existingCqc = await prisma.tenant.findUnique({
          where: { cqcNumber },
        });
        if (existingCqc) {
          throw new ConflictException('CQC number already registered');
        }
      }

      // Check if the primary contact email is already used by any user
      const existingUser = await prisma.user.findUnique({
        where: { email: dto.primaryContactEmail },
      });
      if (existingUser) {
        throw new ConflictException(
          'Primary contact email is already registered to another account',
        );
      }

      // Hash the provided password
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      return await prisma.$transaction(async (tx: PrismaTransactionClient) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            name: dto.name,
            subdomain: dto.subdomain,
            cqcNumber,
            cqcProviderId,
            cqcLocationId,
            addressLine1: dto.addressLine1,
            addressLine2,
            city: dto.city,
            postcode: dto.postcode,
            primaryContactName: dto.primaryContactName,
            primaryContactEmail: dto.primaryContactEmail,
            primaryContactPhone: dto.primaryContactPhone,
            status: 'Pending',
            subscriptionStatus: 'unpaid',
            ...(dto.agreeTerms && {
              dpaVersion: dto.dpaVersion || 'v1.0-2026-10',
              dpaAcceptedAt: new Date(),
              dpaAcceptedByEmail: dto.primaryContactEmail,
              privacyNoticeVersion: dto.privacyNoticeVersion || 'v1.0-2026-10',
              termsAcceptedAt: new Date(),
            }),
            ...(dto.enforceMfaForAllStaff !== undefined && {
              enforceMfaForAllStaff: dto.enforceMfaForAllStaff,
            }),
            ...(dto.enablePageViewGeolocation !== undefined && {
              enablePageViewGeolocation: dto.enablePageViewGeolocation,
            }),
            packageId,
            ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
          },
        });

        // 2. Create default Branch for the tenant
        const defaultBranch = await tx.branch.create({
          data: {
            tenantId: tenant.id,
            name: 'Main Branch',
            code: 'MAIN',
            addressLine1: dto.addressLine1,
            addressLine2,
            city: dto.city,
            postcode: dto.postcode,
            status: 'Active',
          },
        });

        // 3. Resolve Admin Role for the tenant (reuse System Admin role if available)
        const systemAdminRole = await tx.role.findFirst({
          where: { name: 'Admin', isSystem: true, tenantId: null },
        });

        const adminRoleId = systemAdminRole
          ? systemAdminRole.id
          : (
              await tx.role.create({
                data: {
                  name: 'Admin',
                  tenantId: tenant.id,
                  permissions: ['*'],
                  isSystem: false,
                },
              })
            ).id;

        // 4. Create default Admin user
        const adminUser = await tx.user.create({
          data: {
            email: dto.primaryContactEmail,
            passwordHash,
            fullName: dto.primaryContactName,
            tenantId: tenant.id,
            roleId: adminRoleId,
            isActive: true,
            emailVerified: false,
            verificationToken,
          },
        });

        // 5. Assign default Admin user to the default branch
        await tx.userBranch.create({
          data: {
            userId: adminUser.id,
            branchId: defaultBranch.id,
            isPrimary: true,
          },
        });

        // 6. Log to CQC Audit DB (fire-and-forget, won't block transaction)
        void this.auditService.emit({
          categoryType: 'SYSTEM',
          actionType: 'TENANT_CREATED',
          entityType: 'Tenant',
          entityId: tenant.id,
          tenantId: tenant.id,
          userId: adminId ?? adminUser.id,
          newValue: toJsonValue(tenant) as Record<string, unknown>,
        });

        // 5. Send verification email (don't block the transaction if mail fails)
        try {
          await this.mailService.sendVerificationEmail(
            dto.primaryContactEmail,
            verificationToken,
            dto.name,
            dto.subdomain,
          );
        } catch (error) {
          this.logger.error(
            'Failed to send verification email, but tenant was created:',
            error,
          );
        }

        return tenant;
      });
    } catch (error) {
      this.logger.error('CRITICAL: Tenant creation failed:', error);
      throw error;
    }
  }

  async verifyTenant(token: string) {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    return prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // 1. Verify user email
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });

      // 2. Update tenant status to Active if it was Pending
      if (user.tenant && user.tenant.status === 'Pending') {
        await tx.tenant.update({
          where: { id: user.tenant.id },
          data: { status: 'Active' },
        });
      }

      return { success: true, email: user.email };
    });
  }

  async findAll(): Promise<Tenant[]> {
    return prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            verificationToken: true,
          },
          where: {
            verificationToken: { not: null },
          },
          take: 1,
        },
        _count: {
          select: {
            residents: true,
            users: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            residents: true,
            users: true,
          },
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDTO,
    adminId: string,
  ): Promise<Tenant> {
    const oldTenant = await this.findOne(id);
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(updateTenantDto.name && { name: updateTenantDto.name }),
        ...(updateTenantDto.subdomain && {
          subdomain: updateTenantDto.subdomain,
        }),
        ...(updateTenantDto.cqcNumber !== undefined && {
          cqcNumber: updateTenantDto.cqcNumber,
        }),
        ...(updateTenantDto.addressLine1 !== undefined && {
          addressLine1: updateTenantDto.addressLine1,
        }),
        ...(updateTenantDto.addressLine2 !== undefined && {
          addressLine2: updateTenantDto.addressLine2,
        }),
        ...(updateTenantDto.city !== undefined && {
          city: updateTenantDto.city,
        }),
        ...(updateTenantDto.postcode !== undefined && {
          postcode: updateTenantDto.postcode,
        }),
        ...(updateTenantDto.primaryContactName !== undefined && {
          primaryContactName: updateTenantDto.primaryContactName,
        }),
        ...(updateTenantDto.primaryContactEmail !== undefined && {
          primaryContactEmail: updateTenantDto.primaryContactEmail,
        }),
        ...(updateTenantDto.primaryContactPhone !== undefined && {
          primaryContactPhone: updateTenantDto.primaryContactPhone,
        }),
        ...(updateTenantDto.packageId !== undefined && {
          packageId: updateTenantDto.packageId,
        }),
        ...(updateTenantDto.logoUrl !== undefined && {
          logoUrl: updateTenantDto.logoUrl,
        }),
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'TENANT_UPDATED',
      entityType: 'Tenant',
      entityId: id,
      tenantId: id,
      userId: adminId,
      oldValue: toJsonValue(oldTenant) as Record<string, unknown>,
      newValue: toJsonValue(updatedTenant) as Record<string, unknown>,
    });

    return updatedTenant;
  }

  async updateOwnProfile(
    tenantId: string,
    updateDto: UpdateTenantDTO,
    userId: string,
  ): Promise<Tenant> {
    const oldTenant = await this.findOne(tenantId);
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.subdomain && { subdomain: updateDto.subdomain }),
        ...(updateDto.cqcNumber !== undefined && {
          cqcNumber: updateDto.cqcNumber,
        }),
        ...(updateDto.addressLine1 !== undefined && {
          addressLine1: updateDto.addressLine1,
        }),
        ...(updateDto.addressLine2 !== undefined && {
          addressLine2: updateDto.addressLine2,
        }),
        ...(updateDto.city !== undefined && { city: updateDto.city }),
        ...(updateDto.postcode !== undefined && {
          postcode: updateDto.postcode,
        }),
        ...(updateDto.primaryContactName !== undefined && {
          primaryContactName: updateDto.primaryContactName,
        }),
        ...(updateDto.primaryContactEmail !== undefined && {
          primaryContactEmail: updateDto.primaryContactEmail,
        }),
        ...(updateDto.primaryContactPhone !== undefined && {
          primaryContactPhone: updateDto.primaryContactPhone,
        }),
        ...(updateDto.packageId !== undefined && {
          packageId: updateDto.packageId,
        }),
        ...(updateDto.logoUrl !== undefined && { logoUrl: updateDto.logoUrl }),
        ...(updateDto.enforceMfaForAllStaff !== undefined && {
          enforceMfaForAllStaff: updateDto.enforceMfaForAllStaff,
        }),
        ...(updateDto.enablePageViewGeolocation !== undefined && {
          enablePageViewGeolocation: updateDto.enablePageViewGeolocation,
        }),
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'UPDATE',
      entityType: 'Organization',
      entityId: tenantId,
      tenantId,
      userId,
      oldValue: toJsonValue(oldTenant) as Record<string, unknown>,
      newValue: toJsonValue(updatedTenant) as Record<string, unknown>,
    });

    return updatedTenant;
  }

  async setStatus(
    id: string,
    status: TenantStatus,
    adminId: string,
  ): Promise<Tenant> {
    const oldTenant = await this.findOne(id);
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: { status },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: `TENANT_STATUS_CHANGED_${status}`,
      entityType: 'Tenant',
      entityId: id,
      tenantId: id,
      userId: adminId,
      oldValue: { status: oldTenant.status },
      newValue: { status: updatedTenant.status },
    });

    // Handle session invalidation if suspended
    if (status === 'Suspended' || status === 'Inactive') {
      // TODO: Invalidate all JWTs for this tenantId
      this.logger.log(
        `[Session Manager] Invalidating all sessions for tenant: ${id}`,
      );
    }

    return updatedTenant;
  }
}
