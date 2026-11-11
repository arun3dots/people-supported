import { PrismaClient } from "../../src/generated/client";
import { DEMO_TENANT_ID, MAIN_BRANCH_ID } from "./tenant.seed";

export async function seedResidents(prisma: PrismaClient): Promise<void> {
  console.log("Seeding residents, admissions, bed allocations, care profiles, and observations...");

  // 1. Demo Residents
  const residents = [
    {
      id: "demo-resident-1", fullName: "Sarah Higgins", dob: "1942-08-15", nhsNumber: "9482018592",
      fundingType: "Private", status: "Active", keyworkerId: "demo-user-nurse", admissionDate: new Date("2025-01-10"),
      gpDetails: { gpName: "Dr. Alice Gregory", practice: "Jericho Health Centre, Oxford", phone: "01865 311234" },
      nextOfKin: { name: "Claire Higgins", relationship: "Daughter", phone: "+44 7700 900077", email: "claire.higgins@example.com" },
    },
    {
      id: "demo-resident-margaret", fullName: "Margaret Ashworth", dob: "1939-04-12", nhsNumber: "9482019941",
      fundingType: "Private", status: "Active", keyworkerId: "demo-user-nurse", admissionDate: new Date("2024-06-15"),
      gpDetails: { gpName: "Dr. Alice Gregory", practice: "Jericho Health Centre, Oxford", phone: "01865 311234" },
      nextOfKin: { name: "Richard Ashworth", relationship: "Son", phone: "+44 7700 900099" },
    },
    {
      id: "demo-resident-robert", fullName: "Robert Fox", dob: "1945-11-20", nhsNumber: "9482019942",
      fundingType: "Local Authority", status: "Active", keyworkerId: "demo-user-carer", admissionDate: new Date("2024-08-01"),
      gpDetails: { gpName: "Dr. Robert Chen", practice: "Oxford Central Health", phone: "01865 244556" },
      nextOfKin: { name: "Linda Fox", relationship: "Spouse", phone: "+44 7700 900088" },
    },
  ];

  for (const r of residents) {
    await prisma.resident.upsert({
      where: { id: r.id },
      update: { branchId: MAIN_BRANCH_ID, ...r },
      create: { tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, ...r },
    });
  }

  // 2. Profiles & Admissions
  const profiles = [
    {
      residentId: "demo-resident-1", title: "Mrs", firstName: "Sarah", lastName: "Higgins", preferredName: "Sarah",
      gender: "Female", maritalStatus: "Widowed", religion: "Church of England", preferredLanguage: "English",
      addressLine1: "14 Summertown Road", city: "Oxford", postcode: "OX2 7DN", country: "United Kingdom",
    },
    {
      residentId: "demo-resident-robert", title: "Mr", firstName: "Robert", lastName: "Fox", preferredName: "Bob",
      gender: "Male", maritalStatus: "Married", preferredLanguage: "English",
      addressLine1: "28 Cowley Road", city: "Oxford", postcode: "OX4 1HZ", country: "United Kingdom",
    },
    {
      residentId: "demo-resident-margaret", title: "Mrs", firstName: "Margaret", lastName: "Ashworth", preferredName: "Margaret",
      gender: "Female", maritalStatus: "Widowed", preferredLanguage: "English",
      addressLine1: "5 Headington Hill", city: "Oxford", postcode: "OX3 0BT", country: "United Kingdom",
    },
  ];

  for (const p of profiles) {
    await prisma.residentProfile.upsert({ where: { residentId: p.residentId }, update: p, create: p });
  }

  const admissions = [
    {
      residentId: "demo-resident-1", admissionType: "Planned", admissionSource: "Hospital", admittedFrom: "John Radcliffe Hospital",
      admissionReason: "Post-stroke rehabilitation and full personal care assistance", isSelfFunder: true, payer: "Private",
      agreedRoomRate: 1450.0, agreedRoomRatePeriod: "Week", liabilityWaiverSigned: true, stayType: "Permanent", moveInDateTime: new Date("2025-01-10T11:00:00Z"),
    },
    {
      residentId: "demo-resident-robert", admissionType: "Planned", admissionSource: "Home", localAuthority: "Oxfordshire County Council",
      isSelfFunder: false, payer: "Local Authority", weeklyFundingAmount: 950.0, agreedRoomRate: 950.0,
      agreedRoomRatePeriod: "Week", stayType: "Permanent", moveInDateTime: new Date("2024-08-01T10:00:00Z"),
    },
  ];

  for (const a of admissions) {
    await prisma.residentAdmission.upsert({ where: { residentId: a.residentId }, update: a, create: a });
  }

  await prisma.residentConsent.upsert({
    where: { residentId: "demo-resident-1" },
    update: { confirmGenuine: true, confirmGdpr: true },
    create: {
      residentId: "demo-resident-1", consentSignedBy: "Claire Higgins", consentRelationship: "Daughter (LPA Health & Welfare)",
      consentDate: new Date("2025-01-10"), confirmGenuine: true, confirmGdpr: true,
    },
  });

  // 3. Facility Beds Allocation
  const beds = [
    { id: "demo-bed-101-1", roomId: "demo-room-101", number: "1", bedLabel: "Bed 1", status: "Occupied", residentId: "demo-resident-1" },
    { id: "demo-bed-102-1", roomId: "demo-room-102", number: "1", bedLabel: "Bed 1", status: "Occupied", residentId: "demo-resident-robert" },
    { id: "demo-bed-204-5", roomId: "demo-room-204", number: "5", bedLabel: "Bed 5", status: "Occupied", residentId: "demo-resident-margaret" },
    { id: "demo-bed-103-1", roomId: "demo-room-103", number: "1", bedLabel: "Bed 1", status: "Available", residentId: null },
    { id: "demo-bed-201-1", roomId: "demo-room-201", number: "1", bedLabel: "Bed 1", status: "Available", residentId: null },
    { id: "demo-bed-202-1", roomId: "demo-room-202", number: "1", bedLabel: "Bed 1", status: "Available", residentId: null },
  ];

  for (const b of beds) {
    await prisma.bed.upsert({
      where: { id: b.id },
      update: { branchId: MAIN_BRANCH_ID, ...b },
      create: { branchId: MAIN_BRANCH_ID, ...b },
    });
  }

  // 4. Resident Care Profile, Vitals Observations, Fluid Log & Timeline
  await prisma.residentCareProfile.upsert({
    where: { residentId: "demo-resident-1" },
    update: { primaryDiagnosis: "Type 2 Diabetes & Mild Osteoarthritis" },
    create: {
      residentId: "demo-resident-1", primaryDiagnosis: "Type 2 Diabetes & Mild Osteoarthritis",
      secondaryDiagnoses: ["Hypertension", "Mild Vascular Cognitive Impairment"], heightCm: 162.0, weightKg: 64.5, bmi: 24.6,
      allergies: ["Penicillin"], medicationAllergies: ["Penicillin (Cutaneous rash)"], foodAllergies: ["Shellfish"],
      chronicConditions: ["Type 2 Diabetes", "Hypertension", "Osteoarthritis"], continenceStatus: "Manageable with timed prompts",
    },
  });

  await prisma.observation.upsert({
    where: { id: "demo-obs-1" },
    update: { news2Score: 0, consciousness: "Alert" },
    create: {
      id: "demo-obs-1", residentId: "demo-resident-1", temp: 36.7, pulse: 72, bpSystolic: 122, bpDiastolic: 78,
      respiration: 16, bloodSugar: 6.1, spo2: 98.0, spo2Scale: 1, airOrOxygen: "Air", consciousness: "Alert",
      news2Score: 0, isAbnormal: false, notes: "Baseline morning vitals normal. Alert and stable.", timestamp: new Date(),
    },
  });

  await prisma.foodFluidLog.upsert({
    where: { id: "demo-fluid-1" },
    update: { dailyTotal: 1650 },
    create: { id: "demo-fluid-1", residentId: "demo-resident-1", type: "Fluid", amount: 250, unit: "ml", dailyTotal: 1650, timestamp: new Date() },
  });

  await prisma.careTimeline.upsert({
    where: { id: "demo-timeline-1" },
    update: {},
    create: {
      id: "demo-timeline-1", residentId: "demo-resident-1", carerId: "demo-user-carer",
      eventType: "Personal Care", summary: "Morning personal care completed. Accompanied for 20-min garden stroll.", timestamp: new Date(),
    },
  });

  console.log("- Seeded Residents, Admissions, Bed Allocations, Care Profiles, and Observations");
}
