import { PrismaClient } from "../src/generated/client";
import { seedSystem } from "./seeds/system.seed";
import { seedTenant, seedTenantFinancials, MAIN_BRANCH_ID } from "./seeds/tenant.seed";
import { seedAssessmentTemplates } from "./seeds/assessment-templates.seed";
import { seedUsers } from "./seeds/users.seed";
import { seedShifts } from "./seeds/shifts.seed";
import { seedResidents } from "./seeds/residents.seed";
import { seedClinical } from "./seeds/clinical.seed";

const prisma = new PrismaClient();

/**
 * The demo seed keeps the documented development credentials. The production
 * script (`db:seed:system`) does not call this, so no shared password ever
 * reaches a real database.
 */
const DEV_PLATFORM_ADMINS = ["admin@platform.com", "sobin@3dots.co"];
const DEV_PLATFORM_PASSWORD = "Password123!";

async function main() {
  // Only used by this demo seed; seedSystem refuses to invent credentials.
  process.env.PLATFORM_ADMIN_EMAILS ??= DEV_PLATFORM_ADMINS.join(",");
  process.env.PLATFORM_ADMIN_PASSWORD ??= DEV_PLATFORM_PASSWORD;

  console.log("=================================================");
  console.log("Starting Care Home Database Seeding (Modular)...");
  console.log("=================================================");

  // 1. System Foundation (roles, packages, risk templates, dev super admins)
  await seedSystem(prisma, { createPlatformAdmins: true });

  // 2. Tenant & Facility Infrastructure
  await seedTenant(prisma);

  // 2b. Assessment Templates (CQC Benchmark, Dementia, Nursing, Nutrition, Respite)
  await seedAssessmentTemplates(prisma);

  // 3. Staff Users & Compliance
  await seedUsers(prisma);

  // 4. Operational Shifts & Rotas
  await seedShifts(prisma);

  // 5. Residents, Profiles, and Bed Allocation
  await seedResidents(prisma);

  // 6. Clinical Care Plans, Escalations, MCA/DoLS & Risks
  await seedClinical(prisma);

  // 7. Tenant Financials (Invoices, Council PO, Payments)
  await seedTenantFinancials(prisma);

  console.log("=================================================");
  console.log("Seeding completed successfully!");
  console.log("Demo Users:");
  console.log("  - Super Admin: admin@platform.com / Password123!");
  console.log("  - Admin:       demo-admin@3dots.co / Password123!");
  console.log("  - Manager:     demo-manager@3dots.co / Password123!");
  console.log("  - Nurse:       demo-nurse@3dots.co / Password123!");
  console.log("  - Carer:       demo-carer@3dots.co / Password123!");
  console.log(`Primary Branch: ${MAIN_BRANCH_ID} (Main Branch)`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
