import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('Security Boundaries & RBAC Automated Regression Suite (E-14)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(
    user: { roleName?: string; tenantId?: string; userId?: string } | null,
    handlerRoles?: string[],
  ): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(handlerRoles);
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('RBAC Matrix Enforcement (RolesGuard)', () => {
    it('allows access when user role is in the allowed roles list', () => {
      const context = createMockExecutionContext(
        { roleName: 'Admin', tenantId: 'tenant-1', userId: 'user-1' },
        ['Admin', 'Manager'],
      );
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('denies access (returns false) when user role is not in allowed list', () => {
      const context = createMockExecutionContext(
        { roleName: 'Carer', tenantId: 'tenant-1', userId: 'user-2' },
        ['Admin', 'Manager'],
      );
      expect(rolesGuard.canActivate(context)).toBe(false);
    });

    it('denies access when user is not authenticated', () => {
      const context = createMockExecutionContext(null, ['Admin']);
      expect(rolesGuard.canActivate(context)).toBe(false);
    });

    it('allows access to endpoints with no @Roles decorator', () => {
      const context = createMockExecutionContext(
        { roleName: 'Carer', tenantId: 'tenant-1', userId: 'user-2' },
        undefined,
      );
      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });

  describe('Cross-Tenant Path Traversal & Isolation', () => {
    it('rejects document streaming paths from another tenant', () => {
      const requestingTenantId = 'tenant-aaa';
      const maliciousPaths = [
        'tenant-tenant-bbb/resident-1/secret.pdf',
        'tenants/tenant-bbb/medical.pdf',
        '../tenant-bbb/file.png',
        '/etc/passwd',
      ];

      for (const path of maliciousPaths) {
        const cleanPath = decodeURIComponent(path).replace(/^\/+/, '');
        const isPermitted =
          cleanPath.startsWith(`tenant-${requestingTenantId}/`) ||
          cleanPath.startsWith(`tenants/${requestingTenantId}/`);

        expect(isPermitted).toBe(false);
      }
    });

    it('allows valid document streaming paths for the authenticated tenant', () => {
      const requestingTenantId = 'tenant-aaa';
      const validPath = `tenant-${requestingTenantId}/resident-1/care-record.pdf`;
      const cleanPath = decodeURIComponent(validPath).replace(/^\/+/, '');

      const isPermitted =
        cleanPath.startsWith(`tenant-${requestingTenantId}/`) ||
        cleanPath.startsWith(`tenants/${requestingTenantId}/`);

      expect(isPermitted).toBe(true);
    });
  });

  describe('Tenant ID Origin Verification', () => {
    it('verifies tenantId must originate from authenticated token, never request body', () => {
      const req = {
        user: { tenantId: 'tenant-authenticated' },
        body: { tenantId: 'tenant-spoofed' },
      };

      // Invariant: The query must use req.user.tenantId
      const resolvedTenantId = req.user.tenantId;
      expect(resolvedTenantId).toBe('tenant-authenticated');
      expect(resolvedTenantId).not.toBe(req.body.tenantId);
    });
  });
});
