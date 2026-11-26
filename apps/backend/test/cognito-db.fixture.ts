import { prisma } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS } from '@repo/schema';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { email, subject } from './cognito-provider.fixture';

export const userId = randomUUID();
export const tenantId = randomUUID();
export const primaryBranchId = randomUUID();
export const otherBranchId = randomUUID();
export const initialRoleId = randomUUID();
export const newRoleId = randomUUID();
export const password = 'LocalFixturePassword123!';

export async function seedCognitoFixture(
  identity = { subject, email, subdomain: 'cognito-fixture' },
) {
  await prisma.tenant.create({
    data: {
      id: tenantId,
      name: 'Fixture tenant',
      subdomain: identity.subdomain,
      status: 'Active',
    },
  });
  await prisma.branch.createMany({
    data: [
      { id: primaryBranchId, tenantId, name: 'Primary fixture branch' },
      { id: otherBranchId, tenantId, name: 'Other fixture branch' },
    ],
  });
  await prisma.role.createMany({
    data: [
      {
        id: initialRoleId,
        name: 'Carer',
        tenantId,
        permissions: EMPTY_ROLE_PERMISSIONS,
      },
      {
        id: newRoleId,
        name: 'Nurse',
        tenantId,
        permissions: {
          ...EMPTY_ROLE_PERMISSIONS,
          dashboard: { read: true, write: false, delete: false },
        },
      },
    ],
  });
  await prisma.user.create({
    data: {
      id: userId,
      cognitoSub: identity.subject,
      tenantId,
      email: identity.email,
      fullName: 'Fixture user',
      roleId: initialRoleId,
      passwordHash: await bcrypt.hash(password, 4),
      emailVerified: true,
      branches: {
        create: [
          { branchId: primaryBranchId, isPrimary: true },
          { branchId: otherBranchId },
        ],
      },
    },
  });
}
