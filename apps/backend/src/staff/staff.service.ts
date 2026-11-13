import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  prisma,
  User,
  PrismaTransactionClient,
  UserProfile,
  Role,
  Wing,
  Prisma,
} from '@repo/db';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateStaffRoleDto,
  UpdateStaffStatusDto,
} from './dto/staff.dto';
import type { StaffListQueryDTO, PaginatedResponse, ReassignStaffWorkDTO } from '@repo/schema';
import * as bcrypt from 'bcrypt';
import { MailService } from '../common/mail/mail.service';
import { encrypt, decrypt } from '@repo/db';
import { toJsonValue } from '../common/utils/json.util';
import { AuditService } from '../audit/audit.service';
import { paginate, resolvePagination } from '../common/utils/pagination.util';
import { S3StorageService } from '../storage/s3.service';
import type { ActorContext } from '../common/interfaces/actor.interface';
import { PasswordGeneratorService } from '../common/services/password-generator.service';

/**
 * A staff record flattened for the frontend: the `UserProfile` contact fields
 * are lifted to the top level and `niNumber` is decrypted to plaintext so the
 * view/edit screens read (and round-trip) the same shape the forms submit.
 */
export interface StaffDetail extends User {
  avatarUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  startDate: Date | null;
  department: string | null;
  emergencyContacts?: any[] | null;
  isOnLeave?: boolean;
}

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private mailService: MailService,
    private auditService: AuditService,
    private s3Service: S3StorageService,
    private passwordGeneratorService: PasswordGeneratorService,
  ) { }

  /** Decrypt a stored value, tolerating legacy/plaintext rows. */
  private safeDecrypt(value: string | null): string | null {
    if (!value) return null;
    try {
      return decrypt(value) ?? null;
    } catch {
      return value;
    }
  }

  /**
   * Map a Prisma User (with `profile` included) to the flattened StaffDetail the
   * frontend consumes. Other includes (role, assignments) pass straight through.
   */
  private toStaffDetail(
    user: Record<string, any>,
    isOnLeave?: boolean,
  ): StaffDetail {
    const profile = user.profile as UserProfile | null | undefined;
    const quals = (profile?.qualifications as Record<string, any>) || {};
    const { profile: _p, niNumber, ...rest } = user;

    return {
      ...rest,
      niNumber: this.safeDecrypt(niNumber ?? null),
      avatarUrl: profile?.profilePhotoUrl ?? null,
      phoneNumber: profile?.phoneNumber ?? null,
      address: profile?.addressLine1 ?? null,
      startDate: profile?.startDate ?? null,
      department: profile?.department ?? null,
      contractType: profile?.contractType ?? null,
      contractedHoursPerWeek: profile?.contractedHoursPerWeek ?? null,
      schemeId: profile?.schemeId ?? null,
      propertyId: profile?.propertyId ?? (user.assignedWings?.[0]?.id ?? null),
      employmentDetails: profile?.employmentDetails ?? null,
      emergencyContacts: quals.emergencyContacts ?? null,
      isOnLeave: !!isOnLeave,
    } as unknown as StaffDetail;
  }

  async create(
    createStaffDto: CreateStaffDto,
    creatorId: string,
    tenantId: string,
    branchId?: string,
  ): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: createStaffDto.email },
    });
    if (existingUser) {
      if (existingUser.deletedAt) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { email: `deleted_${Date.now()}_${existingUser.email}` },
        });
      } else {
        throw new ConflictException('Email already registered');
      }
    }

    let targetBranchId = branchId;
    if (!targetBranchId && createStaffDto.unitIds?.length) {
      const wing = await prisma.wing.findFirst({
        where: { id: { in: createStaffDto.unitIds }, tenantId },
        select: { branchId: true },
      });
      targetBranchId = wing?.branchId;
    }
    if (!targetBranchId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      targetBranchId = defaultBranch?.id;
    }

    // Tenant staff cannot be assigned the platform-level SuperAdmin role or Resident role
    const targetRole = await prisma.role.findFirst({
      where: {
        id: createStaffDto.roleId,
        OR: [
          { tenantId, deletedAt: null },
          { isSystem: true, tenantId: null },
        ],
      },
      select: { id: true, name: true },
    });
    if (!targetRole || targetRole.name.toLowerCase() === 'superadmin') {
      throw new BadRequestException(
        'SuperAdmin role cannot be assigned to tenant staff',
      );
    }
    if (targetRole.name.toLowerCase() === 'resident') {
      throw new BadRequestException(
        'Cannot assign the Resident role to a staff member',
      );
    }

    const tempPassword = this.passwordGeneratorService.generate();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const niNumberEncrypted = createStaffDto.niNumber
      ? encrypt(createStaffDto.niNumber)
      : null;

    const user = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        // 1. Create User with Branch Association
        const newUser = await tx.user.create({
          data: {
            email: createStaffDto.email,
            passwordHash,
            fullName: createStaffDto.fullName,
            tenantId: tenantId,
            roleId: createStaffDto.roleId,
            dob: createStaffDto.dob ? new Date(createStaffDto.dob) : null,
            niNumber: niNumberEncrypted,
            dbsNumber: createStaffDto.dbsNumber,
            dbsExpiryDate: createStaffDto.dbsExpiryDate
              ? new Date(createStaffDto.dbsExpiryDate)
              : null,
            isActive: true,
            emailVerified: true,
            assignedWings: {
              connect: createStaffDto.unitIds?.map((id) => ({ id })) || [],
            },
            branches: targetBranchId
              ? {
                create: {
                  branchId: targetBranchId,
                  isPrimary: true,
                },
              }
              : undefined,
            // Persist contact/employment details entered on the add form so they
            // are available on the view/edit screens (previously dropped).
            profile: {
              create: {
                phoneNumber: createStaffDto.phone,
                addressLine1: createStaffDto.address ?? undefined,
                department: createStaffDto.department ?? undefined,
                contractType: createStaffDto.contractType ?? undefined,
                contractedHoursPerWeek: createStaffDto.contractedHoursPerWeek ?? undefined,
                schemeId: createStaffDto.schemeId ?? undefined,
                propertyId: createStaffDto.propertyId ?? undefined,
                startDate: createStaffDto.startDate
                  ? new Date(createStaffDto.startDate)
                  : undefined,
                createdById: creatorId,
                updatedById: creatorId,
              },
            },
            createdById: creatorId,
            updatedById: creatorId,
          },
          include: {
            role: true,
            tenant: true,
            branches: true,
          },
        });

        return newUser;
      },
    );

    // 2. Send welcome email after the transaction has committed successfully
    // (avoid holding DB transaction open during third-party email API calls to prevent timeouts)
    try {
      await this.mailService.sendStaffWelcomeEmail(
        user.email,
        user.fullName,
        tempPassword,
        user.tenant?.name || 'Supported Living',
      );
    } catch (mailError: unknown) {
      this.logger.error('Error sending staff welcome email:', mailError);
    }

    // 3. Log to CQC Audit DB (fire-and-forget, outside transaction)
    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CREATE',
      entityType: 'Staff',
      entityId: user.id,
      tenantId,
      userId: creatorId,
      newValue: toJsonValue(user) as Record<string, unknown>,
    });

    return user;
  }

  async findAll(
    branchId: string,
    filters: Partial<StaffListQueryDTO> = {},
    userId?: string,
    actor?: ActorContext,
  ): Promise<PaginatedResponse<StaffDetail>> {
    const slice = resolvePagination(filters);

    // The app is used by branches, not tenants — every fetch is scoped to a
    // single, resolved branchId. Staff <-> branch is the UserBranch join
    // (a staff member has no single branchId column of their own), so this
    // relation check IS the branch scope; no tenantId anywhere here.
    const where: Prisma.UserWhereInput = {
      branches: { some: { branchId } },
      deletedAt: null,
    };

    if (filters.status === 'Active') {
      where.isActive = true;
    } else if (filters.status === 'Inactive') {
      where.isActive = false;
    }

    if (filters.roleId) {
      const selectedRole = await prisma.role.findUnique({
        where: { id: filters.roleId },
        select: { id: true, name: true },
      });
      const roleName = selectedRole?.name ?? filters.roleId;
      const matchingRoles = await prisma.role.findMany({
        where: {
          name: { equals: roleName, mode: 'insensitive' },
          deletedAt: null,
        },
        select: { id: true },
      });
      const roleIds = Array.from(
        new Set([
          ...(selectedRole ? [selectedRole.id] : []),
          ...matchingRoles.map((r) => r.id),
        ]),
      );
      where.roleId = roleIds.length > 0 ? { in: roleIds } : filters.roleId;
    }

    const wingOrUnitId = filters.wingId || filters.unitId;
    if (wingOrUnitId) {
      where.assignedWings = {
        some: { id: wingOrUnitId },
      };
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      // NOTE: `profile.phoneNumber` is deliberately NOT searched here.
      // It is encrypted at rest by the Prisma extension in packages/db/src/index.ts
      // and only decrypted as a *result* computed field, so a `contains` predicate
      // compares the search term against ciphertext and can never match.
      // Phone search returns once the searchable derived column lands.
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { dbsNumber: { contains: term, mode: 'insensitive' } },
        { role: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: sortOrder };
    if (filters.sortBy === 'fullName') {
      orderBy = { fullName: sortOrder };
    } else if (filters.sortBy === 'startDate') {
      orderBy = { profile: { startDate: sortOrder } };
    }

    const pageResult = await paginate(
      slice,
      (args) =>
        prisma.user.findMany({
          where,
          ...args,
          orderBy,
          include: {
            role: true,
            assignedWings: true,
            assignedRooms: true,
            assignedBeds: true,
            assignedResidents: true,
            profile: true,
          },
        }),
      () => prisma.user.count({ where }),
    );

    const users = pageResult.data;

    const now = new Date();
    const userIds = users.map((u) => u.id);
    const activeLeaves =
      userIds.length > 0
        ? await prisma.shiftRequest.findMany({
          where: {
            branchId,
            type: 'Leave',
            status: 'Approved',
            userId: { in: userIds },
            startTime: { lte: now },
            endTime: { gte: now },
          },
          select: { userId: true },
        })
        : [];
    const onLeaveUserIds = new Set(activeLeaves.map((l) => l.userId));

    const staffDetails = users.map((user) =>
      this.toStaffDetail(user, onLeaveUserIds.has(user.id)),
    );

    if (userId) {
      void this.auditService.emitDataAccess({
        userId: actor?.userId ?? userId,
        tenantId: actor?.tenantId,
        userEmail: actor?.userEmail,
        userFullName: actor?.userFullName,
        userRoleName: actor?.roleName,
        actionType: 'STAFF_LIST_VIEWED',
        entityType: 'Staff',
        metadata: {
          count: staffDetails.length,
          total: pageResult.total,
          page: pageResult.page,
          limit: pageResult.limit,
        },
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      });
    }

    return { ...pageResult, data: staffDetails };
  }

  /** Fetch the raw User entity (with relations). Used internally. */
  private async findUserEntity(id: string, tenantId: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        role: true,
        assignedWings: true,
        assignedRooms: true,
        assignedBeds: true,
        assignedResidents: true,
        profile: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    return user;
  }

  async findOne(
    id: string,
    tenantId: string,
    userId?: string,
    actor?: ActorContext,
  ): Promise<User> {
    const user = await this.findUserEntity(id, tenantId);

    if (userId) {
      void this.auditService.emitDataAccess({
        userId: actor?.userId ?? userId,
        tenantId: actor?.tenantId ?? tenantId,
        userEmail: actor?.userEmail,
        userFullName: actor?.userFullName,
        userRoleName: actor?.roleName,
        actionType: 'STAFF_RECORD_VIEWED',
        entityType: 'Staff',
        entityId: id,
        entityLabel: user.fullName,
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      });
    }

    return user;
  }

  /** Flattened, decrypted staff record for the view/edit screens. */
  async getStaffDetail(
    id: string,
    tenantId: string,
    userId?: string,
    actor?: ActorContext,
  ): Promise<StaffDetail> {
    const user = await this.findOne(id, tenantId, userId, actor);
    const now = new Date();
    const activeLeave = await prisma.shiftRequest.findFirst({
      where: {
        tenantId,
        userId: id,
        type: 'Leave',
        status: 'Approved',
        startTime: { lte: now },
        endTime: { gte: now },
      },
    });
    return this.toStaffDetail(user, !!activeLeave);
  }

  async update(
    id: string,
    updateStaffDto: UpdateStaffDto,
    updaterId: string,
    tenantId: string,
  ): Promise<User> {
    const staff = await this.findOne(id, tenantId);

    if (updateStaffDto.roleId) {
      const targetRole = await prisma.role.findFirst({
        where: {
          id: updateStaffDto.roleId,
          OR: [
            { tenantId, deletedAt: null },
            { isSystem: true, tenantId: null },
          ],
        },
      });
      if (!targetRole || targetRole.name.toLowerCase() === 'superadmin') {
        throw new BadRequestException(
          'SuperAdmin role cannot be assigned to tenant staff',
        );
      }
    }

    const niNumberEncrypted =
      updateStaffDto.niNumber !== undefined
        ? updateStaffDto.niNumber
          ? encrypt(updateStaffDto.niNumber)
          : null
        : undefined;

    const currentQuals =
      ((staff as any).profile?.qualifications as Record<string, any>) || {};
    const updatedQualifications =
      updateStaffDto.emergencyContacts !== undefined
        ? {
          ...currentQuals,
          emergencyContacts: updateStaffDto.emergencyContacts,
        }
        : undefined;

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        fullName: updateStaffDto.fullName,
        email: updateStaffDto.email,
        roleId: updateStaffDto.roleId,
        dob: updateStaffDto.dob ? new Date(updateStaffDto.dob) : undefined,
        niNumber: niNumberEncrypted,
        dbsNumber: updateStaffDto.dbsNumber,
        dbsExpiryDate: updateStaffDto.dbsExpiryDate
          ? new Date(updateStaffDto.dbsExpiryDate)
          : undefined,
        updatedById: updaterId,
        profile: {
          upsert: {
            create: {
              phoneNumber: updateStaffDto.phone,
              addressLine1: updateStaffDto.address,
              department: updateStaffDto.department ?? undefined,
              startDate: updateStaffDto.startDate
                ? new Date(updateStaffDto.startDate)
                : undefined,
              qualifications: updatedQualifications
                ? toJsonValue(updatedQualifications)
                : undefined,
              createdById: updaterId,
              updatedById: updaterId,
            },
            update: {
              phoneNumber: updateStaffDto.phone,
              addressLine1: updateStaffDto.address,
              ...(updateStaffDto.department !== undefined
                ? { department: updateStaffDto.department }
                : {}),
              startDate: updateStaffDto.startDate
                ? new Date(updateStaffDto.startDate)
                : undefined,
              ...(updatedQualifications
                ? { qualifications: toJsonValue(updatedQualifications) }
                : {}),
              updatedById: updaterId,
            },
          },
        },
      },
      include: {
        role: true,
        profile: true,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'Staff',
      entityId: id,
      tenantId,
      userId: updaterId,
      oldValue: toJsonValue(staff) as Record<string, unknown>,
      newValue: toJsonValue(updatedStaff) as Record<string, unknown>,
    });

    if (!updatedStaff.isActive) {
      await prisma.refreshToken.deleteMany({ where: { userId: id } });
    }
    return updatedStaff;
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateStaffRoleDto,
    updaterId: string,
    tenantId: string,
  ): Promise<User> {
    const staff = await this.findOne(id, tenantId);

    const targetRole = await prisma.role.findFirst({
      where: {
        id: updateRoleDto.roleId,
        OR: [
          { tenantId, deletedAt: null },
          { isSystem: true, tenantId: null },
        ],
      },
    });
    if (!targetRole || targetRole.name.toLowerCase() === 'superadmin') {
      throw new BadRequestException(
        'SuperAdmin role cannot be assigned to tenant staff',
      );
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        roleId: updateRoleDto.roleId,
        updatedById: updaterId,
      },
      include: { role: true },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'Staff',
      entityId: id,
      tenantId,
      userId: updaterId,
      oldValue: toJsonValue({
        roleId: staff.roleId,
        roleName: (staff as User & { role?: { name: string } }).role?.name,
      }) as Record<string, unknown>,
      newValue: toJsonValue({
        roleId: updatedStaff.roleId,
        roleName: (updatedStaff as User & { role?: { name: string } }).role
          ?.name,
      }) as Record<string, unknown>,
    });

    if (!updatedStaff.isActive) {
      await prisma.refreshToken?.deleteMany?.({ where: { userId: id } });
    }
    return updatedStaff;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStaffStatusDto,
    updaterId: string,
    tenantId: string,
  ): Promise<User> {
    if (id === updaterId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const staff = await this.findOne(id, tenantId);

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        isActive: updateStatusDto.status === 'Active',
        updatedById: updaterId,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'Staff',
      entityId: id,
      tenantId,
      userId: updaterId,
      oldValue: { isActive: staff.isActive },
      newValue: { isActive: updatedStaff.isActive },
    });

    if (!updatedStaff.isActive) {
      await prisma.refreshToken?.deleteMany?.({ where: { userId: id } });
    }
    return updatedStaff;
  }

  async delete(id: string, deleterId: string, tenantId: string): Promise<void> {
    if (id === deleterId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const staff = await this.findOne(id, tenantId);

    const archivedEmail = `deleted_${Date.now()}_${staff.email}`;

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: deleterId,
        isActive: false,
        email: archivedEmail,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'Staff',
      entityId: id,
      tenantId,
      userId: deleterId,
      oldValue: { email: staff.email, isActive: staff.isActive },
      newValue: { email: archivedEmail, isActive: false },
    });

    await prisma.refreshToken?.deleteMany?.({ where: { userId: id } });
  }

  async updateAssignments(
    userId: string,
    tenantId: string,
    assignments: {
      wingIds?: string[];
      roomIds?: string[];
      bedIds?: string[];
      residentIds?: string[];
    },
    updaterId: string,
  ): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        assignedWings: assignments.wingIds
          ? { set: assignments.wingIds.map((id) => ({ id })) }
          : undefined,
        assignedRooms: assignments.roomIds
          ? { set: assignments.roomIds.map((id) => ({ id })) }
          : undefined,
        assignedBeds: assignments.bedIds
          ? { set: assignments.bedIds.map((id) => ({ id })) }
          : undefined,
        assignedResidents: assignments.residentIds
          ? { set: assignments.residentIds.map((id) => ({ id })) }
          : undefined,
        updatedById: updaterId,
      },
      include: {
        assignedWings: true,
        assignedRooms: true,
        assignedBeds: true,
        assignedResidents: true,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'StaffAssignment',
      entityId: userId,
      tenantId,
      userId: updaterId,
      newValue: toJsonValue(assignments) as Record<string, unknown>,
    });

    return updatedUser;
  }

  async reassignStaff(
    staffId: string,
    data: ReassignStaffWorkDTO,
    tenantId: string,
    userId: string,
  ): Promise<StaffDetail> {
    const existing = await prisma.user.findFirst({
      where: { id: staffId, tenantId, deletedAt: null },
      include: { profile: true },
    });
    if (!existing) throw new NotFoundException('Staff member not found');

    const updatedUser = await prisma.user.update({
      where: { id: staffId },
      data: {
        profile: {
          upsert: {
            create: {
              schemeId: data.schemeId,
              propertyId: data.propertyId,
              employmentDetails: {
                assignmentType: data.assignmentType,
                effectiveFrom: data.effectiveFrom,
                endDate: data.endDate,
                reassignmentReason: data.reason,
                notes: data.notes,
              },
            },
            update: {
              schemeId: data.schemeId,
              propertyId: data.propertyId,
              employmentDetails: {
                assignmentType: data.assignmentType,
                effectiveFrom: data.effectiveFrom,
                endDate: data.endDate,
                reassignmentReason: data.reason,
                notes: data.notes,
              },
            },
          },
        },
        assignedWings: {
          connect: [{ id: data.propertyId }],
        },
        updatedById: userId,
      },
      include: {
        role: true,
        assignedWings: true,
        assignedRooms: true,
        assignedBeds: true,
        assignedResidents: true,
        profile: true,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'StaffReassignment',
      entityId: staffId,
      tenantId,
      userId,
      newValue: {
        schemeId: data.schemeId,
        propertyId: data.propertyId,
        reason: data.reason,
      },
    });

    return this.toStaffDetail(updatedUser);
  }

  async uploadStaffPhoto(
    staffId: string,
    file: Buffer,
    fileName: string,
    contentType: string,
    tenantId: string,
    updaterId: string,
  ): Promise<{ photoUrl: string }> {
    const user = await prisma.user.findFirst({
      where: { id: staffId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    const photoKey = `tenants/${tenantId}/staff/${staffId}/profile-photo`;
    await this.s3Service.uploadObject(file, photoKey, contentType);

    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const photoUrl = `${baseUrl}/staff/${staffId}/photo?v=${Date.now()}`;

    await prisma.userProfile.upsert({
      where: { userId: staffId },
      create: {
        userId: staffId,
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
      entityId: staffId,
      tenantId,
      userId: updaterId,
      newValue: { photoUrl },
    });

    return { photoUrl };
  }

  async getStaffPhoto(
    staffId: string,
    tenantId: string,
  ): Promise<{ stream: NodeJS.ReadableStream; contentType: string }> {
    const user = await prisma.user.findFirst({
      where: { id: staffId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    const photoKey = `tenants/${tenantId}/staff/${staffId}/profile-photo`;
    const metadata = await this.s3Service.getObjectMetadata(photoKey);

    if (!metadata.exists) {
      throw new NotFoundException('Profile photo not found');
    }

    const stream = this.s3Service.getFileStream(photoKey);
    return { stream, contentType: metadata.contentType || 'image/jpeg' };
  }
}
