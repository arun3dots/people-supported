/**
 * Production-safe system seed.
 *
 * Creates only the data a database needs to function — roles with permissions,
 * subscription packages and risk assessment templates. It never creates demo
 * residents, demo invoices or accounts with a shared password.
 *
 * Safe to run repeatedly: every write is an upsert.
 *
 *   pnpm db:seed:system
 *
 * To bootstrap a platform administrator, supply credentials explicitly:
 *
 *   PLATFORM_ADMIN_EMAILS="ops@example.com" \
 *   PLATFORM_ADMIN_PASSWORD="<at least 12 characters>" \
 *   pnpm db:seed:system --with-admins
 */
import { PrismaClient } from "../src/generated/client";
import { seedSystem } from "./seeds/system.seed";

const prisma = new PrismaClient();

const wantsAdmins =
  process.argv.includes("--with-admins") ||
  process.env.PLATFORM_ADMIN_EMAILS !== undefined;

async function main() {
  console.log("=================================================");
  console.log("System seed (roles, packages, risk templates)");
  console.log("=================================================");

  await seedSystem(prisma, { createPlatformAdmins: wantsAdmins });

  console.log("=================================================");
  console.log("System seed completed.");
  console.log("No demo residents, invoices or tenant users were created.");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("System seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
