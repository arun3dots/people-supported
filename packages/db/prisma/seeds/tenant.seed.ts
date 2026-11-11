import { PrismaClient } from "../../src/generated/client";

export const DEMO_TENANT_ID = "demo-tenant-id";
export const MAIN_BRANCH_ID = "demo-branch-main";

export async function seedTenant(prisma: PrismaClient): Promise<void> {
  console.log("Seeding demo tenant, branch, wings, rooms, departments, and enquiries...");

  // 1. Demo Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: "demo" },
    update: {
      name: "Cantra Care Demo",
      status: "Active",
      packageId: "premium",
      addressLine1: "124 St John's Way",
      city: "Oxford",
      postcode: "OX1 2JD",
    },
    create: {
      id: DEMO_TENANT_ID,
      name: "Cantra Care Demo",
      subdomain: "demo",
      status: "Active",
      packageId: "premium",
      addressLine1: "124 St John's Way",
      city: "Oxford",
      postcode: "OX1 2JD",
    },
  });

  // 2. Main Care Home Branch
  const mainBranch = await prisma.branch.upsert({
    where: { id: MAIN_BRANCH_ID },
    update: {
      name: "Main Branch",
      code: "MAIN",
      addressLine1: "124 St John's Way",
      city: "Oxford",
      postcode: "OX1 2JD",
      status: "Active",
    },
    create: {
      id: MAIN_BRANCH_ID,
      tenantId: demoTenant.id,
      name: "Main Branch",
      code: "MAIN",
      addressLine1: "124 St John's Way",
      city: "Oxford",
      postcode: "OX1 2JD",
      status: "Active",
    },
  });

  // 3. Wings
  const wings = [
    { id: "demo-wing-north", name: "North Wing", code: "NW" },
    { id: "demo-wing-south", name: "South Wing", code: "SW" },
  ];

  for (const w of wings) {
    await prisma.wing.upsert({
      where: { id: w.id },
      update: { branchId: mainBranch.id, name: w.name, code: w.code, status: "Active" },
      create: {
        id: w.id,
        tenantId: demoTenant.id,
        branchId: mainBranch.id,
        name: w.name,
        code: w.code,
        status: "Active",
      },
    });
  }

  // 4. Facility Rooms
  const rooms = [
    { id: "demo-room-101", wingId: "demo-wing-north", roomNumber: "101", type: "Single" },
    { id: "demo-room-102", wingId: "demo-wing-north", roomNumber: "102", type: "Single" },
    { id: "demo-room-103", wingId: "demo-wing-north", roomNumber: "103", type: "Single" },
    { id: "demo-room-201", wingId: "demo-wing-south", roomNumber: "201", type: "Single" },
    { id: "demo-room-202", wingId: "demo-wing-south", roomNumber: "202", type: "Single" },
    { id: "demo-room-204", wingId: "demo-wing-south", roomNumber: "204", type: "Single" },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: { branchId: mainBranch.id, wingId: r.wingId, roomNumber: r.roomNumber, type: r.type, status: "Active" },
      create: {
        id: r.id,
        wingId: r.wingId,
        branchId: mainBranch.id,
        roomNumber: r.roomNumber,
        type: r.type,
        status: "Active",
      },
    });
  }

  // 5. Departments
  const departments = [
    { id: "demo-dept-care", name: "Nursing & Care" },
    { id: "demo-dept-clinical", name: "Clinical Lead" },
    { id: "demo-dept-admin", name: "Administration" },
    { id: "demo-dept-management", name: "Management" },
    { id: "demo-dept-facilities", name: "Facilities & Catering" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { branchId: mainBranch.id, name: dept.name },
      create: {
        id: dept.id,
        tenantId: demoTenant.id,
        branchId: mainBranch.id,
        name: dept.name,
      },
    });
  }

  // 6. Pre-Admission Enquiries (Stage 1, 2, 3)
  const enquiries = [
    {
      id: "demo-enquiry-1",
      enquirerName: "David Pendelton",
      enquirerRelationship: "Son",
      enquirerPhone: "+44 7700 900501",
      enquirerEmail: "david.pendelton@example.com",
      firstName: "Arthur",
      lastName: "Pendelton",
      dob: new Date("1946-03-22"),
      currentLocation: "Hospital",
      careCategory: "Dementia",
      status: "Enquiry",
      notes: "Seeking full-time dementia residential care following hospital discharge.",
    },
    {
      id: "demo-enquiry-2",
      enquirerName: "Susan Wright",
      enquirerRelationship: "Daughter",
      enquirerPhone: "+44 7700 900502",
      enquirerEmail: "susan.wright@example.com",
      firstName: "Evelyn",
      lastName: "Wright",
      dob: new Date("1940-11-05"),
      currentLocation: "Home",
      careCategory: "Residential",
      status: "Assessment Pending",
      notes: "Needs pre-admission assessment completed before confirming move-in date.",
    },
    {
      id: "demo-enquiry-3",
      enquirerName: "Mary Bailey",
      enquirerRelationship: "Spouse",
      enquirerPhone: "+44 7700 900503",
      enquirerEmail: "mary.bailey@example.com",
      firstName: "George",
      lastName: "Bailey",
      dob: new Date("1948-07-19"),
      currentLocation: "Home",
      careCategory: "Respite",
      status: "Ready for Admission",
      notes: "Assessment completed and accepted. Single room allocated in North Wing.",
    },
  ];

  for (const enq of enquiries) {
    await prisma.enquiry.upsert({
      where: { id: enq.id },
      update: { branchId: mainBranch.id, ...enq },
      create: {
        tenantId: demoTenant.id,
        branchId: mainBranch.id,
        ...enq,
      },
    });
  }

  // 7. General Operational Expenses
  const expenses = [
    {
      id: "demo-expense-1",
      expenseNo: "EXP-2026-001",
      category: "Medical Supplies",
      vendor: "Medline Scientific UK",
      description: "Monthly clinical dressings, gloves, barrier creams, and sanitising supplies",
      amount: 480.0,
      status: "Paid",
    },
    {
      id: "demo-expense-2",
      expenseNo: "EXP-2026-002",
      category: "Food & Catering",
      vendor: "Brakes Foodservice",
      description: "Weekly fresh grocery and catering delivery",
      amount: 1250.0,
      status: "Paid",
    },
    {
      id: "demo-expense-3",
      expenseNo: "EXP-2026-003",
      category: "Utilities",
      vendor: "British Gas Business",
      description: "Facility electricity and heating standing charge",
      amount: 890.0,
      status: "Paid",
    },
  ];

  for (const exp of expenses) {
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: { branchId: mainBranch.id, ...exp },
      create: {
        id: exp.id,
        tenantId: demoTenant.id,
        branchId: mainBranch.id,
        expenseNo: exp.expenseNo,
        category: exp.category,
        vendor: exp.vendor,
        description: exp.description,
        amount: exp.amount,
        status: exp.status,
      },
    });
  }

  console.log("- Seeded Tenant, Branch, Wings, Rooms, Departments, Enquiries, and Expenses");
}

export async function seedTenantFinancials(prisma: PrismaClient): Promise<void> {
  console.log("Seeding resident invoices, council PO, and payment history...");

  // Seed Council PO for Robert Fox
  await prisma.councilPO.upsert({
    where: { id: "demo-council-po-1" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-council-po-1",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      residentId: "demo-resident-robert",
      poNumber: "PO-OXF-2025-8842",
      councilName: "Oxfordshire County Council",
      amountWeek: 950.0,
      startDate: new Date("2024-08-01"),
    },
  });

  // Seed Invoices
  await prisma.invoice.upsert({
    where: { id: "demo-invoice-1" },
    update: { branchId: MAIN_BRANCH_ID, status: "Paid" },
    create: {
      id: "demo-invoice-1",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      residentId: "demo-resident-1",
      invoiceNumber: "INV-2026-0101",
      invoiceType: "Residential Fees",
      amount: 3800.0,
      status: "Paid",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: "4 weeks residential care fees for Sarah Higgins.",
    },
  });

  await prisma.paymentHistory.upsert({
    where: { id: "demo-pmt-1" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-pmt-1",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      invoiceId: "demo-invoice-1",
      amountPaid: 3800.0,
      paymentMethod: "Bank Transfer",
      reference: "BACS-9482018",
      status: "Completed",
    },
  });

  await prisma.invoice.upsert({
    where: { id: "demo-invoice-2" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-invoice-2",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      residentId: "demo-resident-robert",
      councilPoId: "demo-council-po-1",
      invoiceNumber: "INV-2026-0102",
      invoiceType: "Local Authority Funded",
      amount: 950.0,
      status: "Unpaid",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: "Council weekly funding contribution for Robert Fox.",
    },
  });

  await prisma.invoice.upsert({
    where: { id: "demo-invoice-3" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-invoice-3",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      residentId: "demo-resident-margaret",
      invoiceNumber: "INV-2026-0103",
      invoiceType: "Residential Fees",
      amount: 4100.0,
      status: "Unpaid",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Monthly private residential care fees for Margaret Ashworth.",
    },
  });

  console.log("- Seeded Council PO, Invoices, and Payment History");
}
