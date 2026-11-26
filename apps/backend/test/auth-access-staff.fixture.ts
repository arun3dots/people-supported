import { ServiceUnavailableException } from '@nestjs/common';
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { prisma } from '@repo/db';
import { accessConsoleSchema, managedAccountStatusSchema } from '@repo/schema';
import { randomUUID } from 'node:crypto';
import type request from 'supertest';
import { AccessClient } from '../src/auth-access/integration/access-client';
import {
  memberSubject,
  newStaffRoleId,
  queryAccessFixture,
} from './auth-access-db.fixture';
import { primaryBranchId, tenantId } from './cognito-db.fixture';

type MockIdentity = {
  Username: string;
  UserAttributes: AdminCreateUserCommand['input']['UserAttributes'];
  UserStatus: string;
};

export async function verifyStaffEnrollment(
  api: ReturnType<typeof request>,
  cookie: string,
  memberCookie: string,
  webOrigin: string,
  mockSend: jest.Mock,
  mail: jest.Mock,
) {
  const subject = randomUUID();
  const email = 'new-staff@example.invalid';
  const conflictEmail = 'conflict-staff@example.invalid';
  const longName = `New Staff ${'A'.repeat(120)}`;
  const account = {
    requestId: randomUUID(),
    email,
    fullName: longName,
    roleId: newStaffRoleId,
    branchId: primaryBranchId,
  };
  const identities = new Map<string, MockIdentity>();
  const messages: string[] = [];
  mockSend.mockImplementation((command: unknown) => {
    if (command instanceof AdminGetUserCommand) {
      expect(command.input.UserPoolId).toBe('eu-north-1_Fixture');
      const existing = command.input.Username
        ? identities.get(command.input.Username)
        : undefined;
      if (!existing)
        throw Object.assign(new Error('Fixture user is new.'), {
          name: 'UserNotFoundException',
        });
      return existing;
    }
    if (command instanceof AdminCreateUserCommand) {
      expect(command.input.UserPoolId).toBe('eu-north-1_Fixture');
      expect(command.input.ForceAliasCreation).toBe(false);
      const username = command.input.Username;
      if (
        command.input.MessageAction === 'SUPPRESS' &&
        username &&
        !identities.has(username)
      ) {
        const emailAttr = command.input.UserAttributes?.find(
          ({ Name }) => Name === 'email',
        )?.Value;
        const assignedSub =
          emailAttr === conflictEmail ? memberSubject : subject;
        const created: MockIdentity = {
          Username: username,
          UserAttributes: [
            ...(command.input.UserAttributes ?? []),
            { Name: 'sub', Value: assignedSub },
          ],
          UserStatus: 'FORCE_CHANGE_PASSWORD',
        };
        identities.set(username, created);
        messages.push('SUPPRESS');
        return {
          User: {
            Username: created.Username,
            Attributes: created.UserAttributes,
          },
        };
      }
      if (
        command.input.MessageAction === 'RESEND' &&
        username &&
        identities.has(username)
      ) {
        messages.push('RESEND');
        return {};
      }
    }
    throw new Error('Unexpected Cognito operation.');
  });
  const staffRoute = '/api/managed-staff/accounts';
  await api
    .post(staffRoute)
    .set('Cookie', memberCookie)
    .set('Origin', webOrigin)
    .send(account)
    .expect(403);
  expect(await prisma.user.count({ where: { email } })).toBe(0);
  expect(
    (
      await queryAccessFixture(`SELECT count(*) FROM "AccessStaffEnrollment"`)
    ).stdout.trim(),
  ).toBe('0');

  const create = (payload = account) =>
    api
      .post(staffRoute)
      .set('Cookie', cookie)
      .set('Origin', webOrigin)
      .send(payload)
      .expect(201);
  const reserveFail = jest
    .spyOn(AccessClient.prototype, 'reserveStaff')
    .mockRejectedValueOnce(new ServiceUnavailableException());
  let reservedId: string;
  try {
    await api
      .post(staffRoute)
      .set('Cookie', cookie)
      .set('Origin', webOrigin)
      .send(account)
      .expect(503);
    const failed = await prisma.cognitoProvisioning.findUniqueOrThrow({
      where: { requestId: account.requestId },
    });
    reservedId = failed.userId;
    expect(failed).toMatchObject({
      phase: 'VerifyEmail',
      verificationDelivery: 'NotSent',
      lastError: 'ACCESS_ENROLLMENT_FAILED',
    });
    expect(mail).not.toHaveBeenCalled();
    expect(
      (
        await queryAccessFixture(
          `SELECT count(*) FROM "AccessStaffEnrollment" WHERE "productUserId" = '${reservedId}'`,
        )
      ).stdout.trim(),
    ).toBe('0');
  } finally {
    reserveFail.mockRestore();
  }
  const output = await create();
  const staff = managedAccountStatusSchema.parse(output.body);
  expect(staff).toMatchObject({
    userId: reservedId,
    phase: 'VerifyEmail',
    verificationDelivery: 'Sent',
    lastError: null,
  });
  expect(
    (
      await queryAccessFixture(
        `SELECT "subject" IS NULL FROM "AccessStaffEnrollment" WHERE "productUserId" = '${staff.userId}'`,
      )
    ).stdout.trim(),
  ).toBe('t');
  const retry = await create();
  expect(retry.body).toMatchObject({
    userId: staff.userId,
    verificationDelivery: 'Sent',
  });
  expect(mail).toHaveBeenCalledTimes(1);
  expect(mockSend).not.toHaveBeenCalled();

  const link: unknown = mail.mock.calls[0][1];
  if (typeof link !== 'string') throw new Error('Missing verification link.');
  const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
  const sync = jest
    .spyOn(AccessClient.prototype, 'completeStaff')
    .mockRejectedValueOnce(new ServiceUnavailableException());
  try {
    await api
      .post('/api/auth/cognito/invitations/verify')
      .set('Origin', webOrigin)
      .send({ token })
      .expect(201);
    const pending = await prisma.cognitoProvisioning.findUniqueOrThrow({
      where: { userId: staff.userId },
    });
    expect(pending).toMatchObject({
      phase: 'ProvisionIdentity',
      lastError: 'ACCESS_ENROLLMENT_FAILED',
    });
    expect(messages).toEqual(['SUPPRESS']);
    expect(
      await prisma.user.findUnique({ where: { id: staff.userId, tenantId } }),
    ).toMatchObject({ cognitoSub: null, isActive: false });
    await api
      .post(`${staffRoute}/${staff.userId}/actions`)
      .set('Cookie', cookie)
      .set('Origin', webOrigin)
      .send({ action: 'retry' })
      .expect(201);
  } finally {
    sync.mockRestore();
  }
  expect(messages).toEqual(['SUPPRESS', 'RESEND']);
  expect(
    await prisma.user.findUnique({ where: { id: staff.userId, tenantId } }),
  ).toMatchObject({
    cognitoSub: subject,
    isActive: true,
    emailVerified: true,
    passwordHash: null,
  });
  const linked =
    await queryAccessFixture(`SELECT count(*) FROM "AccessStaffEnrollment" e
    JOIN "AccessUser" u ON u."subject" = e."subject"
    JOIN "AccessMembership" m ON m."userId" = u.id AND m."productKey" = e."productKey" AND m."tenantId" = e."tenantId"
    WHERE e."productUserId" = '${staff.userId}' AND e."subject" = '${subject}' AND m."roleKey" = 'carer' AND m.enabled AND NOT m."canManage"`);
  expect(linked.stdout.trim()).toBe('1');
  const consoleRes = await api
    .get('/api/access-admin')
    .set('Cookie', cookie)
    .expect(200);
  expect(accessConsoleSchema.parse(consoleRes.body).members).toContainEqual(
    expect.objectContaining({
      name: longName,
      roleKey: 'carer',
      enabled: true,
    }),
  );

  const conflictOutput = await create({
    ...account,
    requestId: randomUUID(),
    email: conflictEmail,
    fullName: 'Duplicate Staff',
  });
  const conflictStaff = managedAccountStatusSchema.parse(conflictOutput.body);
  expect(mail).toHaveBeenCalledTimes(2);
  const conflictLink: unknown = mail.mock.calls[1][1];
  if (typeof conflictLink !== 'string')
    throw new Error('Missing conflict verification link.');
  const conflictToken = new URLSearchParams(
    new URL(conflictLink).hash.slice(1),
  ).get('token');
  await api
    .post('/api/auth/cognito/invitations/verify')
    .set('Origin', webOrigin)
    .send({ token: conflictToken })
    .expect(201);
  expect(
    await prisma.cognitoProvisioning.findUniqueOrThrow({
      where: { userId: conflictStaff.userId },
    }),
  ).toMatchObject({
    phase: 'ProvisionIdentity',
    lastError: 'IDENTITY_CONFLICT',
  });
  expect(
    await prisma.user.findUnique({
      where: { id: conflictStaff.userId, tenantId },
    }),
  ).toMatchObject({ cognitoSub: null, isActive: false });
  return subject;
}
