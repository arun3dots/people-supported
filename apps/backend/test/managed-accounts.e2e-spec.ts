import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS } from '@repo/schema';
import { randomUUID } from 'node:crypto';
import { reserveManagedAccount } from '../src/auth/cognito/provisioning/managed-account-reservation';
import {
  sendManagedAccountVerification,
  verifyManagedAccountMailbox,
} from '../src/auth/cognito/provisioning/managed-account-verification';

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;

describeFixture(
  'Managed Cognito account reservations on disposable PostgreSQL',
  () => {
    const [
      tenantId,
      otherTenantId,
      branchId,
      otherBranchId,
      roleId,
      adminRole,
      otherAdminRole,
      adminId,
    ] = Array.from({ length: 8 }, randomUUID);
    const actor = {
      userId: adminId,
      email: 'manager@example.invalid',
      roleName: 'Admin',
      tenantId,
      activeBranchId: branchId,
    };
    const poolId = 'eu-north-1_Fixture';
    const origin = 'http://localhost:3000';
    const input = (email: string) => ({
      requestId: randomUUID(),
      email,
      fullName: 'Managed Fixture',
      branchId,
      roleId,
    });

    beforeAll(async () => {
      const database = new URL(process.env.DATABASE_URL ?? 'http://invalid');
      if (
        database.protocol !== 'postgresql:' ||
        database.host !== process.env.COGNITO_DISPOSABLE_DB ||
        database.hostname !== '127.0.0.1' ||
        database.username !== 'cognito_fixture' ||
        database.pathname !== '/postgres' ||
        database.search
      ) {
        throw new Error(
          'Use verify:cognito:backend with its disposable PostgreSQL cluster.',
        );
      }
      await prisma.tenant.createMany({
        data: [
          {
            id: tenantId,
            name: 'Managed fixture',
            subdomain: `managed-${tenantId}`,
            status: 'Active',
          },
          {
            id: otherTenantId,
            name: 'Other fixture',
            subdomain: `managed-${otherTenantId}`,
            status: 'Active',
          },
        ],
      });
      await prisma.branch.createMany({
        data: [
          { id: branchId, tenantId, name: 'Fixture branch' },
          { id: otherBranchId, tenantId: otherTenantId, name: 'Other branch' },
        ],
      });
      await prisma.role.createMany({
        data: [
          {
            id: roleId,
            name: 'Carer',
            isSystem: true,
            permissions: EMPTY_ROLE_PERMISSIONS,
          },
          {
            id: adminRole,
            name: 'Admin',
            isSystem: true,
            permissions: EMPTY_ROLE_PERMISSIONS,
          },
          {
            id: otherAdminRole,
            name: 'SuperAdmin',
            isSystem: true,
            permissions: EMPTY_ROLE_PERMISSIONS,
          },
        ],
      });
      await prisma.user.create({
        data: {
          id: adminId,
          email: actor.email,
          fullName: 'Fixture administrator',
          tenantId,
          roleId: adminRole,
          passwordHash: 'fixture-legacy-hash',
          branches: { create: { branchId, isPrimary: true } },
        },
      });
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it('serializes identical retries and prevents a second request from claiming the same normalized email', async () => {
      const choice = input('FIRST@example.invalid');
      const [one, two] = await Promise.all([
        reserveManagedAccount(actor, tenantId, choice, poolId),
        reserveManagedAccount(actor, tenantId, choice, poolId),
      ]);
      expect(one).toEqual(two);
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: one.userId, tenantId },
      });
      expect(user).toMatchObject({
        authMode: 'Cognito',
        passwordHash: null,
        cognitoSub: null,
        emailVerified: false,
        isActive: false,
      });
      await expect(
        reserveManagedAccount(
          actor,
          tenantId,
          {
            ...choice,
            requestId: randomUUID(),
            email: 'first@example.invalid',
          },
          poolId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        reserveManagedAccount(
          actor,
          tenantId,
          { ...choice, email: 'second@example.invalid' },
          poolId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('denies role escalation and cross-tenant requests before inserting a user', async () => {
      const choice = input('forbidden@example.invalid');
      await expect(
        reserveManagedAccount(
          actor,
          tenantId,
          { ...choice, roleId: otherAdminRole },
          poolId,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        reserveManagedAccount(
          actor,
          otherTenantId,
          { ...choice, branchId: otherBranchId },
          poolId,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        prisma.user.count({ where: { email: choice.email } }),
      ).resolves.toBe(0);
    });

    it('makes mail failure visible without marking the mailbox verified', async () => {
      const entry = await reserveManagedAccount(
        actor,
        tenantId,
        input('mail-failure@example.invalid'),
        poolId,
      );
      const mail = {
        sendManagedAccountVerification: jest
          .fn()
          .mockRejectedValue(new Error('mock transport failure')),
      };
      await expect(
        sendManagedAccountVerification(mail, entry.userId, poolId, origin),
      ).resolves.toBe('Failed');
      const state = await prisma.cognitoProvisioning.findUniqueOrThrow({
        where: { userId: entry.userId },
      });
      expect(state).toMatchObject({
        verificationDelivery: 'Failed',
        verifiedAt: null,
        lastError: 'VERIFICATION_DELIVERY_FAILED',
      });
    });

    it('consumes the proof once when two confirmation requests race', async () => {
      const entry = await reserveManagedAccount(
        actor,
        tenantId,
        input('verify@example.invalid'),
        poolId,
      );
      const sent: string[] = [];
      const mail = {
        async sendManagedAccountVerification(_email: string, url: string) {
          sent.push(url);
        },
      };
      await sendManagedAccountVerification(mail, entry.userId, poolId, origin);
      const url = new URL(sent[0]);
      expect(url.search).toBe('');
      const token = new URLSearchParams(url.hash.slice(1)).get('token');
      if (!token) throw new Error('Fixture verification token missing.');
      const results = await Promise.allSettled([
        verifyManagedAccountMailbox(token, poolId),
        verifyManagedAccountMailbox(token, poolId),
      ]);
      expect(results).toContainEqual({
        status: 'fulfilled',
        value: entry.userId,
      });
      expect(results.filter((result) => result.status === 'rejected')).toEqual([
        { status: 'rejected', reason: expect.any(UnauthorizedException) },
      ]);
      const state = await prisma.cognitoProvisioning.findUniqueOrThrow({
        where: { userId: entry.userId },
      });
      expect(state).toMatchObject({
        phase: 'ProvisionIdentity',
        verificationHash: null,
        verifiedAt: expect.any(Date),
      });
    });
  },
);
