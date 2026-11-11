import { PrismaClient } from "../../src/generated/client";
import * as bcrypt from "bcrypt";

// Canonical permission object — matches @repo/schema rolePermissionsSchema.
function perms(opts: {
  dashboard?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  residents?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  staff?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  facilities?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  payments?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  settings?: Partial<{ read: boolean; write: boolean; delete: boolean }>;
  riskAssessments?: Partial<{
    read: boolean;
    write: boolean;
    delete: boolean;
    approve: boolean;
    manageTemplates: boolean;
  }>;
}) {
  const m = (p?: { read?: boolean; write?: boolean; delete?: boolean }) => ({
    read: !!p?.read,
    write: !!p?.write,
    delete: !!p?.delete,
  });
  return {
    dashboard: m(opts.dashboard),
    residents: m(opts.residents),
    staff: m(opts.staff),
    facilities: m(opts.facilities),
    payments: m(opts.payments),
    settings: m(opts.settings),
    riskAssessments: {
      read: !!opts.riskAssessments?.read,
      write: !!opts.riskAssessments?.write,
      delete: !!opts.riskAssessments?.delete,
      approve: !!opts.riskAssessments?.approve,
      manageTemplates: !!opts.riskAssessments?.manageTemplates,
    },
  };
}

const ALL = { read: true, write: true, delete: true };
const READ = { read: true, write: false, delete: false };
const READ_WRITE = { read: true, write: true, delete: false };

export interface SeedSystemOptions {
  /**
   * Create the platform super admin accounts. Off by default so a production
   * database is never given a shared, known password. Enable it deliberately
   * with explicit credentials from the environment.
   */
  createPlatformAdmins?: boolean;
}

export async function seedSystem(
  prisma: PrismaClient,
  options: SeedSystemOptions = {},
): Promise<void> {
  console.log("Seeding system roles, super admins, packages, and risk templates...");

  // 1. System Roles
  const systemRoles = [
    {
      id: "sys-role-superadmin",
      name: "SuperAdmin",
      isSystem: true,
      permissions: perms({
        dashboard: ALL,
        residents: ALL,
        staff: ALL,
        facilities: ALL,
        payments: ALL,
        settings: ALL,
        riskAssessments: { read: true, write: true, delete: true, approve: true, manageTemplates: true },
      }),
      tenantId: null,
    },
    {
      id: "sys-role-admin",
      name: "Admin",
      isSystem: true,
      permissions: perms({
        dashboard: ALL,
        residents: ALL,
        staff: ALL,
        facilities: ALL,
        payments: ALL,
        settings: ALL,
        riskAssessments: { read: true, write: true, delete: true, approve: true, manageTemplates: true },
      }),
      tenantId: null,
    },
    {
      id: "sys-role-manager",
      name: "Manager",
      isSystem: true,
      permissions: perms({
        dashboard: READ,
        residents: READ_WRITE,
        staff: READ,
        facilities: READ,
        payments: READ,
        settings: READ,
        riskAssessments: { read: true, write: true, delete: false, approve: true, manageTemplates: false },
      }),
      tenantId: null,
    },
    {
      id: "sys-role-nurse",
      name: "Nurse",
      isSystem: true,
      permissions: perms({
        dashboard: READ,
        residents: READ_WRITE,
        staff: {},
        facilities: READ,
        payments: {},
        settings: {},
        riskAssessments: { read: true, write: true, delete: false, approve: false, manageTemplates: false },
      }),
      tenantId: null,
    },
    {
      id: "sys-role-carer",
      name: "Carer",
      isSystem: true,
      permissions: perms({
        dashboard: READ,
        residents: READ,
        staff: {},
        facilities: READ,
        payments: {},
        settings: {},
        riskAssessments: { read: true, write: true, delete: true, approve: false, manageTemplates: false },
      }),
      tenantId: null,
    },
    {
      id: "sys-role-resident",
      name: "Resident",
      isSystem: true,
      permissions: perms({
        dashboard: READ,
        residents: READ,
        staff: {},
        facilities: {},
        payments: {},
        settings: {},
        riskAssessments: { read: true, write: true, delete: true, approve: false, manageTemplates: false },
      }),
      tenantId: null,
    },
  ];

  for (const roleData of systemRoles) {
    await prisma.role.upsert({
      where: { id: roleData.id },
      update: {
        name: roleData.name,
        permissions: roleData.permissions,
      },
      create: roleData,
    });
  }
  console.log(`- Seeded ${systemRoles.length} system roles`);

  // 2. Super Admin Users (opt-in only)
  if (options.createPlatformAdmins) {
    const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const plainPassword = process.env.PLATFORM_ADMIN_PASSWORD ?? "";

    if (adminEmails.length === 0 || plainPassword.length < 12) {
      throw new Error(
        "seedSystem({ createPlatformAdmins: true }) requires PLATFORM_ADMIN_EMAILS " +
          "(comma separated) and PLATFORM_ADMIN_PASSWORD (at least 12 characters). " +
          "The seed will not invent credentials for a real database.",
      );
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    for (const email of adminEmails) {
      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          roleId: "sys-role-superadmin",
          tenantId: null,
        },
        create: {
          email,
          passwordHash,
          fullName: "System Administrator",
          roleId: "sys-role-superadmin",
          tenantId: null,
          isActive: true,
          emailVerified: true,
        },
      });
    }
    console.log(`- Seeded platform super admins: ${adminEmails.join(", ")}`);
  } else {
    console.log("- Skipped platform super admins (opt-in; no shared password)");
  }

  // 3. Subscription Packages
  const packages = [
    {
      id: "starter",
      name: "Starter",
      priceMonthly: 99.0,
      residentLimit: 20,
      staffLimit: 10,
      featureFlags: {
        mfa_required: false,
        advanced_reporting: false,
        audit_logs: true,
      },
    },
    {
      id: "premium",
      name: "Premium",
      priceMonthly: 249.0,
      residentLimit: 9999,
      staffLimit: 9999,
      featureFlags: {
        all: true,
        mfa_required: true,
        advanced_reporting: true,
        audit_logs: true,
      },
    },
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { id: pkg.id },
      update: pkg,
      create: pkg,
    });
  }
  console.log(`- Seeded subscription packages`);

  // 4. System Risk Assessment Templates
  const riskTemplates = [
    {
      id: "00000000-0000-4000-a000-000000000001",
      name: "Falls Risk",
      category: "Clinical",
      hazardDescription: "Risk of resident falling resulting in injury, particularly in mobility-impaired or cognitively impaired residents.",
      tool: "Morse Fall Scale",
      defaultLikelihood: 3,
      defaultSeverity: 4,
      defaultControls: [
        "Place call bell within reach at all times",
        "Use bed/chair sensor where appropriate",
        "Ensure mobility aids are present, working, and used",
        "Footwear check on each shift",
      ],
      isSystem: true,
      tenantId: null,
    },
    {
      id: "00000000-0000-4000-a000-000000000002",
      name: "Pressure Ulcer Risk",
      category: "Clinical",
      hazardDescription: "Risk of pressure ulcer development, especially in immobile, malnourished, or incontinent residents.",
      tool: "Braden Scale",
      defaultLikelihood: 3,
      defaultSeverity: 4,
      defaultControls: [
        "Two-hourly repositioning schedule",
        "Pressure-relieving mattress in use",
        "Daily skin inspection at each personal care episode",
        "Maintain hydration and nutrition",
      ],
      isSystem: true,
      tenantId: null,
    },
    {
      id: "00000000-0000-4000-a000-000000000003",
      name: "Medication Risk",
      category: "Clinical",
      hazardDescription: "Risk of medication error, omission, or adverse reaction during MAR administration.",
      tool: "MAR Audit",
      defaultLikelihood: 2,
      defaultSeverity: 4,
      defaultControls: [
        "Two-staff check for controlled drugs",
        "Verify resident identity before each dose",
        "Document each administration in MAR immediately",
        "Report any omission or error within the same shift",
      ],
      isSystem: true,
      tenantId: null,
    },
    {
      id: "00000000-0000-4000-a000-000000000004",
      name: "Fire Safety",
      category: "Building",
      hazardDescription: "Risk of fire and impact on resident evacuation, particularly for residents requiring assistance.",
      tool: "PEEP",
      defaultLikelihood: 1,
      defaultSeverity: 5,
      defaultControls: [
        "Personal Emergency Evacuation Plan (PEEP) on file",
        "Evacuation aids available in room",
        "Fire doors not propped open",
        "Monthly fire drill attendance recorded",
      ],
      isSystem: true,
      tenantId: null,
    },
    {
      id: "00000000-0000-4000-a000-000000000005",
      name: "Nutrition / Hydration Risk",
      category: "Clinical",
      hazardDescription: "Risk of malnutrition or dehydration affecting health, recovery, or skin integrity.",
      tool: "MUST",
      defaultLikelihood: 3,
      defaultSeverity: 3,
      defaultControls: [
        "Food and fluid chart in use",
        "Weekly weight check",
        "SaLT referral if swallowing concerns",
        "Fortified diet plan agreed with dietitian",
      ],
      isSystem: true,
      tenantId: null,
    },
    {
      id: "00000000-0000-4000-a000-000000000006",
      name: "Behaviour / Cognitive Risk",
      category: "Behavioral",
      hazardDescription: "Risk of distressed behaviour, wandering, or harm to self/others associated with cognitive impairment.",
      tool: "CMAI",
      defaultLikelihood: 3,
      defaultSeverity: 3,
      defaultControls: [
        "Behaviour-monitoring chart in use",
        "Familiar carer assignment where possible",
        "Engagement / activity plan in place",
        "Door-monitoring during high-risk periods",
      ],
      isSystem: true,
      tenantId: null,
    },
  ];

  for (const t of riskTemplates) {
    await prisma.riskTemplate.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`- Seeded ${riskTemplates.length} system risk templates`);
}
