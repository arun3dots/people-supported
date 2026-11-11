/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { ForbiddenException } from '@nestjs/common';
import type { StaffListQueryDTO } from '@repo/schema';

describe('StaffController', () => {
  let controller: StaffController;
  let service: StaffService;

  const mockStaffService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [
        {
          provide: StaffService,
          useValue: mockStaffService,
        },
      ],
    }).compile();

    controller = module.get<StaffController>(StaffController);
    service = module.get<StaffService>(StaffService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call staffService.create', async () => {
      const dto = { fullName: 'Test' };
      const req = {
        user: { userId: '1', tenantId: 't1', activeBranchId: 'branch-1' },
      };
      await controller.create(dto as any, req as any);
      expect(service.create).toHaveBeenCalledWith(dto, '1', 't1', 'branch-1');
    });

    it('should throw ForbiddenException if no tenantId', async () => {
      const dto = { fullName: 'Test' };
      const req = { user: { userId: '1' } }; // SuperAdmin likely
      await expect(controller.create(dto as any, req as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should call staffService.findAll with actor context and default query', async () => {
      const req = {
        user: {
          tenantId: 't1',
          activeBranchId: 'branch-1',
          userId: '1',
          email: 'admin@home.co.uk',
          fullName: 'Jane Doe',
          roleName: 'Admin',
        },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };
      await controller.findAll(req as any);
      // Scoped by branchId, not tenantId — the app is used by branches.
      expect(service.findAll).toHaveBeenCalledWith(
        'branch-1',
        {},
        '1',
        expect.objectContaining({
          tenantId: 't1',
          userId: '1',
          userEmail: 'admin@home.co.uk',
          userFullName: 'Jane Doe',
          roleName: 'Admin',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      );
    });

    it('should pass pagination and filter query to staffService.findAll', async () => {
      const req = {
        user: {
          tenantId: 't1',
          activeBranchId: 'branch-1',
          userId: '1',
        },
        ip: '127.0.0.1',
        headers: {},
      };
      const query: StaffListQueryDTO = {
        page: 2,
        limit: 20,
        search: 'Nurse',
        sortOrder: 'desc',
        sortBy: 'createdAt',
      };
      await controller.findAll(req as any, query);
      expect(service.findAll).toHaveBeenCalledWith(
        'branch-1',
        query,
        '1',
        expect.anything(),
      );
    });

    it('should throw ForbiddenException when no branch can be resolved', async () => {
      const req = {
        user: { tenantId: 't1', userId: '1' },
        ip: '127.0.0.1',
        headers: {},
      };
      await expect(controller.findAll(req as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
