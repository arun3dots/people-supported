import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { UpdateProfileDTO } from '@repo/schema';
import { AuditService } from '../audit/audit.service';
import { S3StorageService } from '../storage/s3.service';
import { ActorContext } from '../common/interfaces/actor.interface';
import { toJsonValue } from '../common/utils/json.util';

/**
 * Flattened view of the current user's own profile. Combines the `User` record
 * with its `UserProfile` relation. Encrypted fields (phoneNumber, addressLine1)
 * are decrypted transparently by the `prisma` client.
 */
export interface MyProfile {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  mfaEnabled: boolean;
  emailVerified: boolean;
  role: { id: string; name: string } | null;
  dob: Date | null;
  dbsNumber: string | null;
  dbsExpiryDate: Date | null;
  startDate: Date | null;
  department: string | null;
  preferredLanguage: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  profilePhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt: Date | null;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly auditService: AuditService,
    private readonly s3Service: S3StorageService,
  ) {}

  async getMyProfile(userId: string, tenantId: string): Promise<MyProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: { role: true, profile: true },
    });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const qualifications =
      (user.profile?.qualifications as Record<string, unknown>) || {};
    const preferredLanguage =
      typeof qualifications.preferredLanguage === 'string'
        ? qualifications.preferredLanguage
        : 'English (UK)';

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      dob: user.dob,
      dbsNumber: user.dbsNumber,
      dbsExpiryDate: user.dbsExpiryDate,
      startDate: user.profile?.startDate ?? null,
      department: user.profile?.department ?? null,
      preferredLanguage,
      phoneNumber: user.profile?.phoneNumber ?? null,
      addressLine1: user.profile?.addressLine1 ?? null,
      addressLine2: user.profile?.addressLine2 ?? null,
      city: user.profile?.city ?? null,
      postcode: user.profile?.postcode ?? null,
      profilePhotoUrl: user.profile?.profilePhotoUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordChangedAt: user.passwordChangedAt ?? user.createdAt,
    };
  }

  /**
   * Update the caller's own profile and contact details. Tenant-scoped so a user can
   * never touch another tenant's record.
   */
  async updateMyContact(
    userId: string,
    tenantId: string,
    dto: UpdateProfileDTO,
    actor: ActorContext,
  ): Promise<MyProfile> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: { profile: true },
    });
    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    const constructedFullName =
      dto.fullName?.trim() ||
      [dto.firstName, dto.middleName, dto.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      undefined;

    if (
      dto.email &&
      dto.email.trim().toLowerCase() !== existing.email.toLowerCase()
    ) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: { equals: dto.email.trim(), mode: 'insensitive' },
          id: { not: userId },
        },
      });
      if (emailConflict) {
        throw new BadRequestException('Email address is already in use');
      }
    }

    const currentQuals =
      (existing.profile?.qualifications as Record<string, unknown>) || {};
    const updatedQuals =
      dto.preferredLanguage !== undefined
        ? { ...currentQuals, preferredLanguage: dto.preferredLanguage }
        : undefined;

    const contact = {
      phoneNumber:
        dto.phoneNumber !== undefined
          ? dto.phoneNumber?.trim() || null
          : undefined,
      addressLine1: dto.addressLine1 ?? undefined,
      addressLine2: dto.addressLine2 ?? undefined,
      city: dto.city ?? undefined,
      postcode: dto.postcode ?? undefined,
      department:
        dto.department !== undefined ? dto.department || null : undefined,
      startDate:
        dto.startDate !== undefined
          ? dto.startDate
            ? new Date(dto.startDate)
            : null
          : undefined,
      qualifications: updatedQuals ? (updatedQuals as any) : undefined,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: constructedFullName,
        email: dto.email ? dto.email.trim().toLowerCase() : undefined,
        profile: {
          upsert: {
            create: { ...contact, createdById: userId, updatedById: userId },
            update: { ...contact, updatedById: userId },
          },
        },
      },
    });

    const updated = await this.getMyProfile(userId, tenantId);

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'SELF_PROFILE_UPDATED',
      entityType: 'Staff',
      entityId: userId,
      tenantId: actor.tenantId,
      userId: actor.userId,
      oldValue: toJsonValue({
        fullName: existing.fullName,
        email: existing.email,
        department: existing.profile?.department ?? null,
        startDate: existing.profile?.startDate ?? null,
        phoneNumber: existing.profile?.phoneNumber ?? null,
        addressLine1: existing.profile?.addressLine1 ?? null,
        addressLine2: existing.profile?.addressLine2 ?? null,
        city: existing.profile?.city ?? null,
        postcode: existing.profile?.postcode ?? null,
      }) as Record<string, unknown>,
      newValue: toJsonValue({
        fullName: constructedFullName ?? existing.fullName,
        email: dto.email ?? existing.email,
        ...contact,
      }) as Record<string, unknown>,
    });

    // Notify tenant admins about the staff profile update (BUG-043)
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          role: { name: { in: ['Admin', 'SuperAdmin', 'Manager'] } },
        },
        select: { id: true },
      });
      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((admin) => ({
            tenantId,
            recipientId: admin.id,
            title: 'Staff Profile Updated',
            message: `${updated.fullName || existing.fullName} updated their personal details through the mobile app.`,
            category: 'STAFF',
            priority: 'Normal',
            actionUrl: `/admin/staff/${userId}`,
            channels: ['IN_APP'],
          })),
        });
      }
    } catch {
      // Non-blocking notification dispatch
    }

    return updated;
  }

  async uploadPhoto(
    userId: string,
    tenantId: string,
    file: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<{ photoUrl: string }> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const photoKey = `tenants/${tenantId}/staff/${userId}/profile-photo`;
    await this.s3Service.uploadObject(file, photoKey, contentType);

    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const photoUrl = `${baseUrl}/profile/photo?v=${Date.now()}`;

    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        profilePhotoUrl: photoUrl,
      },
      update: {
        profilePhotoUrl: photoUrl,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'StaffProfilePhoto',
      entityId: userId,
      tenantId,
      userId,
      newValue: { photoUrl },
    });

    return { photoUrl };
  }

  async getPhoto(
    userId: string,
    tenantId: string,
  ): Promise<{ stream: NodeJS.ReadableStream; contentType: string }> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const photoKey = `tenants/${tenantId}/staff/${userId}/profile-photo`;
    const metadata = await this.s3Service.getObjectMetadata(photoKey);
    if (!metadata.exists) {
      throw new NotFoundException('Profile photo not found');
    }

    const stream = this.s3Service.getFileStream(photoKey);
    return { stream, contentType: metadata.contentType || 'image/jpeg' };
  }
}
