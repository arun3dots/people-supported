import { PrismaClient } from "../../src/generated/client";
import * as bcrypt from "bcrypt";
import { DEMO_TENANT_ID, MAIN_BRANCH_ID } from "./tenant.seed";

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log("Seeding demo users, staff profiles, branch assignments, and compliance...");

  const plainPassword = "Password123!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const demoStaff = [
    {
      id: "demo-user-admin",
      email: "demo-admin@3dots.co",
      fullName: "Demo Admin",
      roleId: "sys-role-admin",
      department: "Administration",
      phone: "+44 7700 900100",
    },
    {
      id: "demo-user-manager",
      email: "demo-manager@3dots.co",
      fullName: "Demo Manager",
      roleId: "sys-role-manager",
      department: "Management",
      phone: "+44 7700 900101",
    },
    {
      id: "demo-user-nurse",
      email: "demo-nurse@3dots.co",
      fullName: "Demo Nurse",
      roleId: "sys-role-nurse",
      department: "Clinical Lead",
      phone: "+44 7700 900102",
    },
    {
      id: "demo-user-nurse-2",
      email: "nurse2@3dots.co",
      fullName: "Sarah Jenkins RN",
      roleId: "sys-role-nurse",
      department: "Clinical Lead",
      phone: "+44 7700 900104",
    },
    {
      id: "demo-user-carer",
      email: "demo-carer@3dots.co",
      fullName: "Demo Carer",
      roleId: "sys-role-carer",
      department: "Nursing & Care",
      phone: "+44 7700 900103",
    },
    {
      id: "demo-user-carer-2",
      email: "carer2@3dots.co",
      fullName: "James Miller",
      roleId: "sys-role-carer",
      department: "Nursing & Care",
      phone: "+44 7700 900105",
    },
  ];

  for (const u of demoStaff) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        tenantId: DEMO_TENANT_ID,
        roleId: u.roleId,
        fullName: u.fullName,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        roleId: u.roleId,
        tenantId: DEMO_TENANT_ID,
        isActive: true,
        emailVerified: true,
      },
    });

    // 1. Branch association
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: user.id, branchId: MAIN_BRANCH_ID } },
      update: { isPrimary: true },
      create: { userId: user.id, branchId: MAIN_BRANCH_ID, isPrimary: true },
    });

    // 2. Staff Profile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        department: u.department,
        phoneNumber: u.phone,
        city: "Oxford",
      },
      create: {
        userId: user.id,
        department: u.department,
        phoneNumber: u.phone,
        city: "Oxford",
        addressLine1: "Staff Quarters, 124 St John's Way",
        startDate: new Date("2023-01-15"),
      },
    });
  }

  // 3. Mandatory Staff Compliance & DBS
  const complianceUsers = [
    { userId: "demo-user-nurse", nmcPin: "14B0231E" },
    { userId: "demo-user-nurse-2", nmcPin: "18C0412E" },
    { userId: "demo-user-carer", nmcPin: null },
  ];

  for (const staff of complianceUsers) {
    // DBS Check
    await prisma.dbsCheck.upsert({
      where: { id: `dbs-${staff.userId}` },
      update: { status: "Verified" },
      create: {
        id: `dbs-${staff.userId}`,
        userId: staff.userId,
        type: "Enhanced with Barred Lists",
        certificateNumber: `00159${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: new Date("2024-01-10"),
        status: "Verified",
      },
    });

    // Mandatory Training: Safeguarding
    await prisma.staffTraining.upsert({
      where: { id: `train-safeguard-${staff.userId}` },
      update: {},
      create: {
        id: `train-safeguard-${staff.userId}`,
        userId: staff.userId,
        type: "Safeguarding Adults Level 2",
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    });

    // Mandatory Training: Fire Safety
    await prisma.staffTraining.upsert({
      where: { id: `train-fire-${staff.userId}` },
      update: {},
      create: {
        id: `train-fire-${staff.userId}`,
        userId: staff.userId,
        type: "Fire Safety & Evacuation",
        expiryDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
      },
    });

    // Nurse Professional NMC Registration
    if (staff.nmcPin) {
      await prisma.staffCertification.upsert({
        where: { id: `cert-nmc-${staff.userId}` },
        update: { status: "Active" },
        create: {
          id: `cert-nmc-${staff.userId}`,
          userId: staff.userId,
          name: `NMC Registered Nurse (${staff.nmcPin})`,
          issueDate: new Date("2020-03-01"),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "Active",
        },
      });
    }
  }

  console.log(`- Seeded ${demoStaff.length} demo staff users with profiles, branch links, DBS & training`);
}
