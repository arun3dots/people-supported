import { PrismaClient } from "../../src/generated/client";
import { DEMO_TENANT_ID, MAIN_BRANCH_ID } from "./tenant.seed";

export async function seedShifts(prisma: PrismaClient): Promise<void> {
  console.log("Seeding shift types, sample shifts, assignments, logs, and handovers...");

  // 1. Shift Types
  const shiftTypes = [
    {
      id: "st-early",
      name: "Early",
      startTime: "08:00",
      endTime: "14:00",
      color: "#fef3c7", // Amber 100
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
    },
    {
      id: "st-late",
      name: "Late",
      startTime: "14:00",
      endTime: "20:00",
      color: "#dcfce7", // Green 100
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
    },
    {
      id: "st-night",
      name: "Night",
      startTime: "20:00",
      endTime: "08:00",
      color: "#e0e7ff", // Indigo 100
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
    },
  ];

  for (const st of shiftTypes) {
    await prisma.shiftType.upsert({
      where: { id: st.id },
      update: { ...st, branchId: MAIN_BRANCH_ID },
      create: st,
    });
  }

  // 2. Sample Shifts for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sampleShifts = [
    {
      id: "shift-1",
      tenantId: DEMO_TENANT_ID,
      typeId: "st-early",
      branchId: MAIN_BRANCH_ID,
      wingId: "demo-wing-north",
      startTime: new Date(new Date(today).setHours(8, 0)),
      endTime: new Date(new Date(today).setHours(14, 0)),
      status: "Published",
    },
    {
      id: "shift-2",
      tenantId: DEMO_TENANT_ID,
      typeId: "st-late",
      branchId: MAIN_BRANCH_ID,
      wingId: "demo-wing-south",
      startTime: new Date(new Date(today).setHours(14, 0)),
      endTime: new Date(new Date(today).setHours(20, 0)),
      status: "Published",
    },
  ];

  for (const s of sampleShifts) {
    await prisma.shift.upsert({
      where: { id: s.id },
      update: { ...s, branchId: MAIN_BRANCH_ID },
      create: s,
    });
  }

  // 3. Shift Assignments
  const assignments = [
    { id: "sa-1", shiftId: "shift-1", userId: "demo-user-carer", role: "Carer" },
    { id: "sa-2", shiftId: "shift-1", userId: "demo-user-nurse", role: "Nurse" },
    { id: "sa-3", shiftId: "shift-2", userId: "demo-user-carer-2", role: "Carer" },
  ];

  for (const a of assignments) {
    await prisma.shiftAssignment.upsert({
      where: { id: a.id },
      update: { role: a.role },
      create: a,
    });
  }

  // 4. Active Shift Clock-In Log
  await prisma.staffShiftLog.upsert({
    where: { id: "demo-shift-log-1" },
    update: { branchId: MAIN_BRANCH_ID, status: "Started" },
    create: {
      id: "demo-shift-log-1",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      shiftId: "shift-1",
      userId: "demo-user-carer",
      actualStartTime: new Date(new Date(today).setHours(8, 2)),
      status: "Started",
      handoverNotes: "Clocked in on time. Assigned to North Wing personal care rounds.",
    },
  });

  // 5. Shift Handover Note
  await prisma.handover.upsert({
    where: { shiftId: "shift-1" },
    update: {
      comment:
        "Morning medication round completed. Sarah Higgins fluid intake monitored. Margaret Ashworth had an unwitnessed fall at 09:38, incident logged and GP contacted.",
      incidentCount: 1,
      missedTasks: 0,
    },
    create: {
      id: "demo-handover-1",
      shiftId: "shift-1",
      comment:
        "Morning medication round completed. Sarah Higgins fluid intake monitored. Margaret Ashworth had an unwitnessed fall at 09:38, incident logged and GP contacted.",
      incidentCount: 1,
      missedTasks: 0,
    },
  });

  // 6. Shift Requests (Leave & Cover)
  await prisma.shiftRequest.upsert({
    where: { id: "demo-shift-req-1" },
    update: { branchId: MAIN_BRANCH_ID, status: "Approved" },
    create: {
      id: "demo-shift-req-1",
      tenantId: DEMO_TENANT_ID,
      branchId: MAIN_BRANCH_ID,
      userId: "demo-user-carer-2",
      type: "Leave",
      status: "Approved",
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason: "Annual leave request (pre-booked)",
    },
  });

  console.log("- Seeded Shift Types, Shifts, Assignments, Clock-in Logs, Handover, and Requests");
}
