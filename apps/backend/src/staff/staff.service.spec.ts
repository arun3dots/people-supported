/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { MailService } from '../common/mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { S3StorageService } from '../storage/s3.service';
import { GcsService } from '../storage/gcs.service';
import { PasswordGeneratorService } from '../common/services/password-generator.service';
import { prisma } from '@repo/db';
import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('@repo/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
    leaveRequest: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    shiftRequest: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
  emitDataAccess: jest.fn().mockResolvedValue(undefined),
};

const mockPasswordGeneratorService = {
  generate: jest.fn().mockReturnValue('TempP@ssw0rd123!'),
};

describe('StaffService', () => {
  let service: StaffService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: MailService,
          useValue: {
            sendStaffWelcomeEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: S3StorageService,
          useValue: {
            uploadFile: jest.fn(),
            uploadObject: jest.fn(),
            getObjectMetadata: jest.fn(),
            getFileStream: jest.fn(),
          },
        },
        {
          provide: GcsService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: PasswordGeneratorService,
          useValue: mockPasswordGeneratorService,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a staff member successfully with branch association', async () => {
      const createStaffDto = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '07123456789',
        roleId: 'role-1',
        dob: '1995-05-05',
        startDate: '2024-04-01',
        unitIds: ['wing-1'],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'role-1',
        name: 'Nurse',
      });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        ...createStaffDto,
        tenant: { name: 'Care Home' },
      });

      const result = await service.create(
        createStaffDto as any,
        'creator-1',
        'tenant-1',
        'branch-1',
      );

      expect(result.id).toBe('user-1');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullName: 'Jane Doe',
            branches: {
              create: {
                branchId: 'branch-1',
                isPrimary: true,
              },
            },
          }),
        }),
      );
      expect(mockAuditService.emit).toHaveBeenCalled();
      expect(mailService.sendStaffWelcomeEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'Jane Doe',
        'TempP@ssw0rd123!',
        'Care Home',
      );
    });

    it('should throw BadRequestException if role is SuperAdmin', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'role-superadmin',
        name: 'SuperAdmin',
      });
      const createStaffDto = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        roleId: 'role-superadmin',
      };
      await expect(
        service.create(createStaffDto as any, 'creator-1', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing',
      });
      const createStaffDto = { email: 'test@test.com' };
      await expect(
        service.create(createStaffDto as any, 'c', 't'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('should update role and log audit', async () => {
      const mockStaff = {
        id: 'user-1',
        tenantId: 'tenant-1',
        roleId: 'old-role',
        role: { name: 'Old Role' },
      };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({
        id: 'new-role',
        name: 'Nurse',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockStaff,
        roleId: 'new-role',
        role: { name: 'New Role' },
      });

      const result = await service.updateRole(
        'user-1',
        { roleId: 'new-role' },
        'updater-1',
        'tenant-1',
      );

      expect(result.roleId).toBe('new-role');
      expect(mockAuditService.emit).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update status and log audit', async () => {
      const mockStaff = { id: 'user-1', tenantId: 'tenant-1', isActive: true };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockStaff);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockStaff,
        isActive: false,
      });

      const result = await service.updateStatus(
        'user-1',
        { status: 'Inactive' },
        'updater-1',
        'tenant-1',
      );

      expect(result.isActive).toBe(false);
      expect(mockAuditService.emit).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if deactivating self', async () => {
      await expect(
        service.updateStatus('me', { status: 'Inactive' }, 'me', 't'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 'u1',
        fullName: 'Alice Smith',
        email: 'alice@example.com',
        isActive: true,
        tenantId: 'tenant-1',
        profile: {
          phoneNumber: '1234567890',
          startDate: new Date('2024-01-01'),
        },
      },
      {
        id: 'u2',
        fullName: 'Bob Jones',
        email: 'bob@example.com',
        isActive: true,
        tenantId: 'tenant-1',
        profile: {
          phoneNumber: '0987654321',
          startDate: new Date('2024-02-01'),
        },
      },
    ];

    it('should return paginated staff with default page 1 and limit 10, scoped by branchId only', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(25);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u2' },
      ]);

      const result = await service.findAll('branch-1', {}, 'actor-1');

      // The app is used by branches, not tenants — the UserBranch relation
      // is the whole scope, no tenantId column anywhere in the filter.
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branches: { some: { branchId: 'branch-1' } },
            deletedAt: null,
          }),
        }),
      );
      const countWhere = (prisma.user.count as jest.Mock).mock.calls[0][0]
        .where;
      expect(countWhere.tenantId).toBeUndefined();
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: expect.objectContaining({
            branches: { some: { branchId: 'branch-1' } },
            deletedAt: null,
          }),
        }),
      );
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.data).toHaveLength(2);
      expect(result.data[1].isOnLeave).toBe(true);
      expect(mockAuditService.emitDataAccess).toHaveBeenCalled();
    });

    it('should handle custom page, limit, and search filters', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(15);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('branch-1', {
        page: 2,
        limit: 5,
        search: 'Alice',
        status: 'Active',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            branches: { some: { branchId: 'branch-1' } },
            isActive: true,
            OR: expect.arrayContaining([
              { fullName: { contains: 'Alice', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('matches users across matching roles when filtered by roleId', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant-role-admin',
        name: 'Admin',
      });
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: 'tenant-role-admin' },
        { id: 'sys-role-admin' },
      ]);

      await service.findAll('branch-1', { roleId: 'tenant-role-admin' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roleId: { in: ['tenant-role-admin', 'sys-role-admin'] },
          }),
        }),
      );
    });

    it('scopes shift leave by branch and the listed staff tenants', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('branch-1', {});

      const shiftWhere = (prisma.shiftRequest.findMany as jest.Mock).mock
        .calls[0][0].where;
      expect(shiftWhere.branchId).toBe('branch-1');
      expect(shiftWhere.tenantId).toEqual({ in: ['tenant-1'] });
    });

    it('should return all records without skip/take when all is true', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(2);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.shiftRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('branch-1', { all: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({
          skip: expect.anything(),
          take: expect.anything(),
        }),
      );
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });
  });
});
