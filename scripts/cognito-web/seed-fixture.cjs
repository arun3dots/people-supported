const { randomUUID } = require("node:crypto");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");

async function seedWebIntegrationFixture(root) {
  const { prisma } = require(resolve(root, "packages/db/dist"));
  const { EMPTY_ROLE_PERMISSIONS } = require(resolve(root, "packages/schema/dist"));
  const backendReq = createRequire(
    resolve(root, "apps/backend/package.json"),
  );
  const bcrypt = backendReq("bcrypt");

  const tenantAId = randomUUID();
  const branchAId = randomUUID();
  const tenantBId = randomUUID();
  const branchBId = randomUUID();
  const adminRoleId = randomUUID();
  const carerRoleId = randomUUID();
  const superAdminRoleId = randomUUID();

  const ids = {
    tenantAId,
    branchAId,
    tenantBId,
    residentBId: randomUUID(),
    adminUserId: randomUUID(),
    adminSub: "11111111-aaaa-4111-8111-111111111101",
    carerUserId: randomUUID(),
    carerSub: "11111111-aaaa-4111-8111-111111111102",
    disabledUserId: randomUUID(),
    disabledSub: "11111111-aaaa-4111-8111-111111111103",
    legacyUserId: randomUUID(),
    superAdminId: randomUUID(),
    superAdminSub: "11111111-aaaa-4111-8111-111111111104",
    password: "LocalBrowserFixture123!",
  };

  await prisma.tenant.createMany({
    data: [
      {
        id: tenantAId,
        name: "Cantra Supported Living A",
        subdomain: "cognito-web-a",
        status: "Active",
        subscriptionStatus: "active",
      },
      {
        id: tenantBId,
        name: "Cantra Supported Living B",
        subdomain: "cognito-web-b",
        status: "Active",
        subscriptionStatus: "active",
      },
    ],
  });
  await prisma.branch.createMany({
    data: [
      { id: branchAId, tenantId: tenantAId, name: "Main Branch A" },
      { id: branchBId, tenantId: tenantBId, name: "Main Branch B" },
    ],
  });
  await prisma.role.createMany({
    data: [
      {
        id: adminRoleId,
        name: "Admin",
        tenantId: tenantAId,
        permissions: {
          ...EMPTY_ROLE_PERMISSIONS,
          dashboard: { read: true, write: true, delete: false },
          residents: { read: true, write: true, delete: false },
          staff: { read: true, write: true, delete: false },
        },
      },
      {
        id: carerRoleId,
        name: "Carer",
        tenantId: tenantAId,
        permissions: {
          ...EMPTY_ROLE_PERMISSIONS,
          dashboard: { read: true, write: false, delete: false },
          residents: { read: true, write: false, delete: false },
        },
      },
      {
        id: superAdminRoleId,
        name: "SuperAdmin",
        tenantId: null,
        permissions: EMPTY_ROLE_PERMISSIONS,
      },
    ],
  });

  const passwordHash = await bcrypt.hash(ids.password, 4);
  await prisma.user.createMany({
    data: [
      {
        id: ids.adminUserId,
        cognitoSub: ids.adminSub,
        tenantId: tenantAId,
        email: "admin-a@cantracare.test",
        fullName: "Admin Pilot",
        roleId: adminRoleId,
        passwordHash,
        emailVerified: true,
      },
      {
        id: ids.carerUserId,
        cognitoSub: ids.carerSub,
        tenantId: tenantAId,
        email: "carer-a@cantracare.test",
        fullName: "Carer Pilot",
        roleId: carerRoleId,
        passwordHash,
        emailVerified: true,
      },
      {
        id: ids.disabledUserId,
        cognitoSub: ids.disabledSub,
        tenantId: tenantAId,
        email: "disabled-a@cantracare.test",
        fullName: "Disabled Pilot",
        roleId: adminRoleId,
        passwordHash,
        emailVerified: true,
        isActive: false,
      },
      {
        id: ids.legacyUserId,
        tenantId: tenantAId,
        email: "legacy-a@cantracare.test",
        fullName: "Legacy Admin",
        roleId: adminRoleId,
        passwordHash,
        emailVerified: true,
      },
      {
        id: ids.superAdminId,
        cognitoSub: ids.superAdminSub,
        tenantId: null,
        email: "superadmin@cantracare.test",
        fullName: "Platform SuperAdmin",
        roleId: superAdminRoleId,
        passwordHash,
        emailVerified: true,
      },
    ],
  });
  await prisma.userBranch.createMany({
    data: [
      { userId: ids.adminUserId, branchId: branchAId, isPrimary: true },
      { userId: ids.carerUserId, branchId: branchAId, isPrimary: true },
      { userId: ids.disabledUserId, branchId: branchAId, isPrimary: true },
      { userId: ids.legacyUserId, branchId: branchAId, isPrimary: true },
    ],
  });
  await prisma.resident.create({
    data: {
      id: ids.residentBId,
      tenantId: tenantBId,
      branchId: branchBId,
      fullName: "Isolated Resident",
      dob: "1960-01-01",
    },
  });

  return { ids, prisma };
}

module.exports = { seedWebIntegrationFixture };
