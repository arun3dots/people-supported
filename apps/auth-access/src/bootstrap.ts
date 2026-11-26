import { readFile } from "node:fs/promises";
import {
  accessPermissionsSchema,
  accessRoleCreateSchema,
  accessSlugSchema,
  z,
} from "@repo/schema";
import { createAccessDatabase, requireDatabaseUrl } from "./access-db";

const enrollment = z
  .object({
    product: accessSlugSchema,
    issuer: z.string().url().max(300),
    tenantId: z.string().uuid(),
    permissions: accessPermissionsSchema,
    roles: z.array(accessRoleCreateSchema).min(1).max(50),
    users: z
      .array(
        z
          .object({
            subject: z.string().min(1).max(128),
            name: z.string().trim().min(1).max(150).optional(),
            roleKey: accessSlugSchema,
            canManage: z.boolean().default(false),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

async function main() {
  const path = process.argv[2];
  if (!path || process.argv[3])
    throw new Error("Supply an enrollment JSON file.");
  const input = enrollment.parse(JSON.parse(await readFile(path, "utf8")));
  const roles = new Set(input.roles.map((role) => role.key));
  if (
    !input.users.some((user) => user.canManage) ||
    roles.size !== input.roles.length ||
    new Set(input.users.map((user) => user.subject)).size !==
      input.users.length ||
    input.users.some((user) => !roles.has(user.roleKey)) ||
    input.roles.some((role) =>
      role.permissions.some((p) => !input.permissions.includes(p)),
    )
  ) {
    throw new Error(
      "Enrollment requires unique subjects, registered permissions, and an administrator.",
    );
  }
  const db = createAccessDatabase(requireDatabaseUrl(process.env));
  try {
    await db.$transaction(
      async (tx) => {
        const scope = { productKey: input.product, tenantId: input.tenantId };
        const product = await tx.accessProduct.upsert({
          where: { key: input.product },
          update: {},
          create: {
            key: input.product,
            issuer: input.issuer,
            permissions: input.permissions,
          },
        });
        if (
          product.issuer !== input.issuer ||
          product.permissions.length !== input.permissions.length ||
          product.permissions.some((p) => !input.permissions.includes(p))
        ) {
          throw new Error("Enrollment differs from the registered product.");
        }
        // Creating the tenant is the enrollment boundary. A rerun aborts without
        // overwriting roles, membership status, or prior administrator decisions.
        await tx.accessTenant.create({ data: scope });
        await tx.accessRole.createMany({
          data: input.roles.map((role) => ({ ...scope, ...role })),
        });
        for (const { subject, name, roleKey, canManage } of input.users) {
          const user = await tx.accessUser.upsert({
            where: { issuer_subject: { issuer: input.issuer, subject } },
            update: {},
            create: { issuer: input.issuer, subject, name },
          });
          await tx.accessMembership.create({
            data: { ...scope, userId: user.id, roleKey, canManage },
          });
          await tx.accessAudit.create({
            data: {
              ...scope,
              action: "membership.bootstrapped",
              target: user.id,
              changes: { roleKey, canManage, source: "operator" },
            },
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
  } finally {
    await db.$disconnect();
  }
  console.log("Auth & Access tenant enrolled.");
}

void main().catch(() => {
  console.error(
    "Enrollment failed. Check the dedicated database, verified subjects, and prior enrollment.",
  );
  process.exitCode = 1;
});
