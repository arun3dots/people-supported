import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS } from '@repo/schema';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import type { CognitoConfig } from '../src/auth/cognito/cognito-config';
import type { CognitoProvider } from '../src/auth/cognito/cognito-provider.service';
import { CognitoSessions } from '../src/auth/cognito/cognito-sessions.service';
import {
  linkManagedIdentity,
  sendManagedInvitation,
  updateManagedAccess,
} from '../src/auth/cognito/provisioning/managed-account-lifecycle';
import type { ManagedCognitoDirectory } from '../src/auth/cognito/provisioning/managed-cognito-directory';

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;

describeFixture('Managed Cognito lifecycle with a mocked AWS directory', () => {
  const [tenantId, branchId, roleId] = Array.from({ length: 3 }, () =>
    randomUUID(),
  );
  const poolId = 'eu-north-1_LifecycleFixture';
  const issuer = 'https://issuer.example.invalid';
  const settings = {
    poolId,
    issuer,
    pilotIds: new Set<string>(),
    managedUsersEnabled: true,
  };
  const ensureIdentity = jest.fn();
  const operate = jest.fn();
  const directory = {
    requireSettings: () => settings,
    ensureIdentity,
    operate,
  } as unknown as ManagedCognitoDirectory;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? 'http://invalid');
    if (
      url.protocol !== 'postgresql:' ||
      url.host !== process.env.COGNITO_DISPOSABLE_DB ||
      url.hostname !== '127.0.0.1' ||
      url.username !== 'cognito_fixture' ||
      url.pathname !== '/postgres' ||
      url.search
    ) {
      throw new Error(
        'Use verify:cognito:backend with its disposable PostgreSQL cluster.',
      );
    }
    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Lifecycle fixture',
        subdomain: `lifecycle-${tenantId}`,
        status: 'Active',
      },
    });
    await prisma.branch.create({
      data: { id: branchId, tenantId, name: 'Fixture branch' },
    });
    await prisma.role.create({
      data: {
        id: roleId,
        name: 'Carer',
        isSystem: true,
        permissions: EMPTY_ROLE_PERMISSIONS,
      },
    });
  });

  beforeEach(() => {
    ensureIdentity.mockReset();
    operate.mockReset().mockResolvedValue(undefined);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function verifiedReservation() {
    const email = `${randomUUID()}@example.invalid`;
    return prisma.cognitoProvisioning.create({
      data: {
        email,
        poolId,
        requestId: randomUUID(),
        phase: 'ProvisionIdentity',
        verifiedAt: new Date(),
        user: {
          create: {
            email,
            tenantId,
            roleId,
            fullName: 'Managed fixture',
            authMode: 'Cognito',
            emailVerified: false,
            isActive: false,
            branches: { create: { branchId, isPrimary: true } },
          },
        },
      },
    });
  }

  it('persists provider and invitation failures, then retries without creating two local links', async () => {
    const { userId } = await verifiedReservation();
    const subject = randomUUID();
    ensureIdentity
      .mockRejectedValueOnce(new Error('mock IAM denied'))
      .mockResolvedValue({ subject, username: 'owned-fixture' });
    await expect(linkManagedIdentity(directory, userId)).resolves.toBe(false);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ).toMatchObject({ cognitoSub: null, emailVerified: false });
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({ where: { userId } }),
    ).toMatchObject({
      phase: 'ProvisionIdentity',
      lastError: 'IDENTITY_PROVISIONING_FAILED',
    });
    await expect(
      Promise.all([
        linkManagedIdentity(directory, userId),
        linkManagedIdentity(directory, userId),
      ]),
    ).resolves.toEqual([true, true]);
    expect(ensureIdentity).toHaveBeenCalledTimes(2);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ).toMatchObject({
      cognitoSub: subject,
      passwordHash: null,
      emailVerified: true,
    });

    operate.mockRejectedValueOnce(new Error('mock invite delivery failure'));
    await sendManagedInvitation(directory, userId, false);
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({ where: { userId } }),
    ).toMatchObject({
      phase: 'Invite',
      invitationDelivery: 'Failed',
      lastError: 'INVITATION_DELIVERY_FAILED',
    });
    await prisma.cognitoProvisioning.update({
      where: { userId },
      data: { lastActionAt: new Date(0) },
    });
    await sendManagedInvitation(directory, userId, true);
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({ where: { userId } }),
    ).toMatchObject({ phase: 'Invited', invitationDelivery: 'Sent' });
  });

  it('rolls back a duplicate subject link and preserves the first account', async () => {
    const first = await verifiedReservation();
    const duplicate = await verifiedReservation();
    const subject = randomUUID();
    ensureIdentity.mockResolvedValue({ subject, username: 'owned-fixture' });
    await expect(linkManagedIdentity(directory, first.userId)).resolves.toBe(
      true,
    );
    await expect(
      linkManagedIdentity(directory, duplicate.userId),
    ).resolves.toBe(false);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { cognitoSub: subject } }),
    ).toMatchObject({ id: first.userId });
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: duplicate.userId } }),
    ).toMatchObject({ cognitoSub: null, emailVerified: false });
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({
        where: { userId: duplicate.userId },
      }),
    ).toMatchObject({
      phase: 'ProvisionIdentity',
      providerUsername: null,
      lastError: 'IDENTITY_CONFLICT',
    });
  });

  it('starts a managed session with MFA, resets it and keeps local disablement when Cognito fails', async () => {
    const { userId } = await verifiedReservation();
    const subject = randomUUID();
    ensureIdentity.mockResolvedValue({ subject, username: 'owned-fixture' });
    await linkManagedIdentity(directory, userId);
    await sendManagedInvitation(directory, userId, false);

    const key = generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString();
    const config = {
      require: () => ({ ...settings, privateKey: key }),
    } as unknown as CognitoConfig;
    const sessions = new CognitoSessions(
      config,
      {} as CognitoProvider,
      new JwtService(),
    );
    const identity = {
      subject,
      authenticatedAt: new Date(),
      refreshToken: 'mock-provider-refresh',
      mfaVerified: true,
    };
    await expect(
      sessions.create({ ...identity, mfaVerified: false }),
    ).rejects.toThrow();
    await expect(sessions.create(identity)).resolves.toMatchObject({
      accessToken: expect.any(String),
      user: { userId, mfaVerified: true },
    });
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({ where: { userId } }),
    ).toMatchObject({ phase: 'Activated', activatedAt: expect.any(Date) });
    const issued = await prisma.cognitoSession.findFirstOrThrow({
      where: { userId },
    });

    await updateManagedAccess(directory, userId, 'reset-password');
    expect(operate).toHaveBeenLastCalledWith(
      expect.objectContaining({ subject }),
      'reset-password',
    );
    await expect(
      sessions.authenticate(issued.id, userId),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    operate.mockRejectedValueOnce(new Error('mock disable failed'));
    await updateManagedAccess(directory, userId, 'disable');
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ).toMatchObject({ isActive: false });
    expect(
      await prisma.cognitoProvisioning.findUniqueOrThrow({ where: { userId } }),
    ).toMatchObject({ lastError: 'PROVIDER_ACTION_FAILED' });
    await updateManagedAccess(directory, userId, 'enable');
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ).toMatchObject({ isActive: true });
    await expect(
      sessions.authenticate(issued.id, userId),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
