import { PrismaClient } from "../../src/generated/client";
import { DEMO_TENANT_ID, MAIN_BRANCH_ID } from "./tenant.seed";

export async function seedClinical(prisma: PrismaClient): Promise<void> {
  console.log("Seeding care plans, goals, MCA, DoLS, SBAR escalations, risks, incidents, and notifications...");

  // 1. Active Person-Centred Care Plans (Sarah Higgins & Margaret Ashworth)
  const sarahPlan = {
    status: "Active", validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), authorId: "demo-user-nurse", authorRole: "RegisteredNurse",
    approvedById: "demo-user-admin", approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    secondaryApprovedById: "demo-user-nurse", secondaryApprovedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    clinicalApproverId: "demo-user-nurse", managerApproverId: "demo-user-admin", residentAgreed: true,
    residentAgreementNotes: "Full agreement with care and hydration goals.", representativeName: "Claire Higgins",
    representativeRelationship: "Daughter", legalConsentBasis: "ResidentSelf", lastReviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    doctorsInvolved: ["Dr. Alice Gregory", "Dr. Robert Chen"], departments: ["Nursing & Care", "Clinical Lead"],
  };
  await prisma.carePlan.upsert({
    where: { id: "demo-careplan-1" },
    update: { branchId: MAIN_BRANCH_ID, ...sarahPlan },
    create: { id: "demo-careplan-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, residentId: "demo-resident-1", ...sarahPlan },
  });

  const margaretPlan = {
    status: "PendingPrimaryApproval", versionNumber: 1, validFrom: new Date(),
    nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), authorId: "demo-user-nurse", authorRole: "RegisteredNurse",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), clinicalApproverId: "demo-user-nurse", managerApproverId: "demo-user-admin",
    residentAgreed: true, legalConsentBasis: "ResidentSelf", departments: ["Nursing & Care"], doctorsInvolved: ["Dr. Alice Gregory"],
  };
  await prisma.carePlan.upsert({
    where: { id: "demo-careplan-margaret" },
    update: { branchId: MAIN_BRANCH_ID, ...margaretPlan },
    create: { id: "demo-careplan-margaret", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, residentId: "demo-resident-margaret", ...margaretPlan },
  });

  // 2. CarePlan Goals (with resident voice whyItMattersToResident)
  const goals = [
    {
      id: "demo-cp-goal-1", carePlanId: "demo-careplan-1", category: "Nutrition", reviewFrequency: "Weekly", progressPercent: 65, status: "Active",
      title: "Maintain Hydration & Fluid Balance", targetDescription: "Achieve min 1500ml daily fluid intake with regular offering of preferred drinks.",
      whyItMattersToResident: "I want to stay healthy and avoid getting dizzy when getting up.", nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "demo-cp-goal-2", carePlanId: "demo-careplan-1", category: "Mobility", reviewFrequency: "Weekly", progressPercent: 80, status: "Active",
      title: "Safe Mobilisation & Fall Prevention", targetDescription: "Mobilise with Zimmer frame and 1 carer assist. Maintain safe transfers.",
      whyItMattersToResident: "I enjoy morning walks in the courtyard garden and want to feel steady.", nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "demo-cp-goal-margaret-1", carePlanId: "demo-careplan-margaret", category: "Hygiene", reviewFrequency: "Weekly", progressPercent: 0, status: "Active",
      title: "Pressure Area Care & Skin Integrity", targetDescription: "Maintain intact skin through regular 2-hourly repositioning and barrier cream.",
      whyItMattersToResident: "I want to be comfortable without sore spots while resting.",
    },
  ];
  for (const g of goals) {
    await prisma.carePlanGoal.upsert({
      where: { id: g.id },
      update: { branchId: MAIN_BRANCH_ID, ...g },
      create: { tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, ...g },
    });
  }

  // 3. CarePlan Section with Structured PRSB & CQC KLOE Domain Matrices
  const secData = {
    sectionName: "Clinical & Personal Support",
    content: "Sarah Higgins requires daily assistance with personal hygiene, hydration, and safe mobilization.",
    sectionData: {
      domain: "Personal Care & Physical Health", cqcKloe: ["Safe", "Effective", "Caring"],
      strengths: "Communicates preferences clearly; active participation in morning grooming.",
      inResidentWords: "I like to take my time in the morning and choose my own clothes.",
      supportRequired: "Assistance of 1 carer for washing and transfer to day chair.",
    },
    authorId: "demo-user-nurse", version: 1,
  };
  await prisma.carePlanSection.upsert({
    where: { id: "demo-careplan-sec-1" },
    update: secData,
    create: { id: "demo-careplan-sec-1", carePlanId: "demo-careplan-1", ...secData },
  });

  // 4. CarePlan Medications, Daily Task, and Medication Rounds
  await prisma.carePlanMedication.upsert({
    where: { id: "demo-cp-med-1" },
    update: {},
    create: {
      id: "demo-cp-med-1", carePlanId: "demo-careplan-1", drugName: "Paracetamol", dose: "500mg", form: "Tablet",
      frequency: "twice daily", timeOfDay: ["Morning", "Evening"], allowLateAdministration: true,
      mandatoryObservations: ["Pain Level", "Temperature"], isActive: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.medicationRound.upsert({
    where: { id: "demo-med-round-1" },
    update: {},
    create: {
      id: "demo-med-round-1", residentId: "demo-resident-1", drugName: "Paracetamol", dose: "500mg", form: "Tablet",
      scheduledTime: new Date(new Date(today).setHours(9, 0)), status: "Pending", allowLateAdministration: true,
      mandatoryObservations: ["Pain Level", "Temperature"], isAdhoc: false, carePlanMedicationId: "demo-cp-med-1",
    },
  });

  await prisma.carePlanTask.upsert({
    where: { id: "demo-cp-task-1" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-cp-task-1", residentId: "demo-resident-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID,
      carePlanId: "demo-careplan-1", goalId: "demo-cp-goal-2", title: "Morning Personal Care Support",
      description: "Assist with washing, dressing, and oral care. Check skin integrity.",
      category: "Personal Care", frequency: "Daily", timeOfDay: ["Morning"], priority: "High", isActive: true,
    },
  });

  await prisma.dailyTask.upsert({
    where: { id: "demo-daily-task-1" },
    update: {},
    create: {
      id: "demo-daily-task-1", residentId: "demo-resident-1", carePlanTaskId: "demo-cp-task-1",
      title: "Morning Personal Care Support", description: "Assist with washing, dressing, and oral care.",
      category: "Personal Care", priority: "High", status: "Pending", scheduledDate: today, timeSlot: "Morning",
    },
  });

  // 5. CarePlan Approvals
  const approvals = [
    { id: "demo-cp-app-1", approverId: "demo-user-admin", role: "Primary", comments: "Approved as Registered Manager." },
    { id: "demo-cp-app-2", approverId: "demo-user-nurse", role: "Secondary", comments: "Approved as Clinical Lead." },
  ];
  for (const app of approvals) {
    await prisma.carePlanApproval.upsert({
      where: { id: app.id },
      update: { branchId: MAIN_BRANCH_ID },
      create: {
        id: app.id, tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, carePlanId: "demo-careplan-1",
        approverId: app.approverId, role: app.role, decision: "Approved", comments: app.comments,
        decidedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 6. CarePlanReview (30-day CQC review - includes branchId)
  const cpReview = {
    decision: "MaintainedNoChanges",
    summaryNotes: "Monthly CQC evaluation completed. Sarah's fluid balance stabilized. Safe mobilisation maintained. Plan maintained.",
    residentFeedback: "Sarah expressed feeling comfortable and enjoys morning garden walks.",
    familyFeedback: "Daughter Claire expressed satisfaction with hydration support.",
    domainsEvaluated: ["Nutrition", "Mobility", "Personal Hygiene"],
    reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextScheduledReview: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
  };
  await prisma.carePlanReview.upsert({
    where: { id: "demo-cp-review-1" },
    update: { branchId: MAIN_BRANCH_ID, ...cpReview },
    create: {
      id: "demo-cp-review-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID,
      carePlanId: "demo-careplan-1", residentId: "demo-resident-1", reviewerId: "demo-user-nurse", ...cpReview,
    },
  });

  // 7. Mental Capacity Assessment (MCA 2005 - includes branchId)
  const mcaData = {
    decisionType: "BedRails", specificDecision: "Use of low-profile profiling bed and floor sensor mat for night safety.",
    hasImpairmentOrDisturbance: true, impairmentDetails: "Mild vascular cognitive impairment with occasional night disorientation.",
    canUnderstandInfo: true, canRetainInfo: true, canWeighOrUseInfo: true, canCommunicateDecision: true, hasCapacity: true,
    bestInterestsRequired: false, consultedPersons: [{ name: "Claire Higgins", relationship: "Daughter", viewsExpressed: "Prefers low bed." }],
    leastRestrictiveOptionConsidered: "Full bed rails determined unnecessarily restrictive. Low bed selected as least restrictive.",
    notes: "Sarah consented willingly to the floor alert sensor mat.",
    assessedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  };
  await prisma.mentalCapacityAssessment.upsert({
    where: { id: "demo-mca-1" },
    update: { branchId: MAIN_BRANCH_ID, ...mcaData },
    create: {
      id: "demo-mca-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID,
      residentId: "demo-resident-1", assessorId: "demo-user-nurse", carePlanId: "demo-careplan-1", ...mcaData,
    },
  });

  // 8. DoLS Authorization (includes branchId)
  const dolsData = {
    supervisoryBody: "Oxfordshire County Council DoLS Team", referenceNumber: "DOLS-2025-0849", status: "Authorized",
    appliedDate: new Date("2025-02-01"), authorizedDate: new Date("2025-02-15"), expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    conditions: ["Quarterly review of sensor mat necessity", "Daily access to secure courtyard garden accompanied by staff"],
    relevantPersonsRepresentative: "Claire Higgins (Daughter)", rprContact: "+44 7700 900077",
    notes: "Standard authorisation granted for 12 months under MCA 2005 Schedule A1.",
  };
  await prisma.dolsAuthorization.upsert({
    where: { id: "demo-dols-1" },
    update: { branchId: MAIN_BRANCH_ID, ...dolsData },
    create: { id: "demo-dols-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, residentId: "demo-resident-1", ...dolsData },
  });

  // 9. Incidents (includes branchId)
  const incidents = [
    {
      id: "demo-incident-1", incidentNumber: "INC-2026-0045", title: "Fall Un-witnessed", category: "Fall",
      harmLevel: "Level 2 (Minor Harm)", severity: "High", status: "Under Review", priority: "High",
      incidentDate: new Date("2026-05-12T09:38:00Z"), incidentTime: "09:38 AM", residentId: "demo-resident-margaret",
      roomNumber: "204", bedNumber: "005", location: "Bedroom",
      initialAssessment: "Minor skin tear left elbow. Mild hip discomfort. NEWS2 Score 1.",
      immediateActions: ["First aid provided", "Vitals recorded (NEWS2)", "GP Contacted", "Family informed"],
      notes: "Resident found sitting on the floor beside the bed. First aid administered.",
      reportedById: "demo-user-carer", assignedToId: "demo-user-admin",
    },
    {
      id: "demo-incident-2", incidentNumber: "INC-2026-0046", title: "Medication Administration Delay", category: "Medication",
      harmLevel: "Level 1 (No Harm)", severity: "Medium", status: "Open", priority: "Medium", incidentDate: new Date(),
      incidentTime: "08:30 AM", residentId: "demo-resident-robert", roomNumber: "102", bedNumber: "001", location: "Room 102",
      initialAssessment: "Morning insulin dose delayed by 45 minutes due to pharmacy delivery delay.",
      immediateActions: ["Blood glucose measured (6.2 mmol/L)", "Pharmacy contacted", "Dose administered"],
      notes: "Resident showed no adverse reaction. Vital signs remained within normal parameters.", reportedById: "demo-user-carer",
    },
  ];
  for (const inc of incidents) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: { branchId: MAIN_BRANCH_ID, ...inc },
      create: { tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, ...inc },
    });
  }

  // 10. NEW MODEL: Clinical Escalation (SBAR Protocol)
  const escalationData = {
    residentId: "demo-resident-margaret", raisedById: "demo-user-carer", assignedToRole: "Nurse",
    assignedToId: "demo-user-nurse", reason: "Fall", severity: "High", status: "Triaged",
    initialNotes: "Unwitnessed fall beside bed. Left elbow abrasion and hip tenderness.",
    sbarSituation: "Resident found on floor in bedroom 204. Alert and responsive, no head injury.",
    sbarBackground: "87 yo female resident with mild osteoporosis and balance unsteadiness.",
    sbarAssessment: "NEWS2 score 1 (BP 138/84). Left elbow abrasion dressed. Mild left hip discomfort upon rotation.",
    sbarRecommendation: "Nurse clinical triage completed. GP notified for review. Floor sensor mat activated.",
    vitalsSnapshot: { bp: "138/84", pulse: 78, temp: 36.8, spo2: 97, resp: 18, news2Score: 1, consciousness: "Alert" },
    actionsTaken: [{ role: "Nurse", staffName: "Demo Nurse", action: "Physical examination, wound dressing, and GP triage call", timestamp: new Date().toISOString() }],
    incidentId: "demo-incident-1",
  };
  await prisma.clinicalEscalation.upsert({
    where: { id: "demo-escalation-1" },
    update: { branchId: MAIN_BRANCH_ID, ...escalationData },
    create: { id: "demo-escalation-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, ...escalationData },
  });

  // 11. Risk Assessments, Controls & Alerts (includes branchId)
  await prisma.riskAssessment.upsert({
    where: { id: "demo-risk-1" },
    update: { branchId: MAIN_BRANCH_ID, status: "Approved" },
    create: {
      id: "demo-risk-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, residentId: "demo-resident-1",
      templateId: "00000000-0000-4000-a000-000000000001", category: "Clinical", title: "Falls Risk Assessment",
      hazardDescription: "Risk of unassisted transfer leading to fall and hip injury.", likelihood: 3, severity: 4,
      inherentScore: 12, inherentLevel: "High", residualLikelihood: 2, residualSeverity: 3, residualScore: 6, residualLevel: "Medium",
      status: "Approved", approvedById: "demo-user-admin", approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.riskControl.upsert({
    where: { id: "demo-rc-1" },
    update: { status: "Completed" },
    create: {
      id: "demo-rc-1", riskAssessmentId: "demo-risk-1", isExisting: true, status: "Completed",
      description: "Low-profile profiling bed and bedside floor sensor mat deployed.",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.riskAlert.upsert({
    where: { id: "demo-risk-alert-1" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-risk-alert-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, recipientId: "demo-user-nurse",
      riskAssessmentId: "demo-risk-1", type: "ReviewDue", message: "Sarah Higgins falls risk review due next month.", isRead: false,
    },
  });

  // 12. Notifications (includes branchId and actionUrl)
  await prisma.notification.upsert({
    where: { id: "demo-notif-1" },
    update: { branchId: MAIN_BRANCH_ID },
    create: {
      id: "demo-notif-1", tenantId: DEMO_TENANT_ID, branchId: MAIN_BRANCH_ID, recipientId: "demo-user-nurse",
      title: "High Severity Clinical Escalation: Fall",
      message: "Margaret Ashworth experienced an unwitnessed fall in Room 204. Nurse triage action required.",
      priority: "High", category: "CLINICAL", channels: ["WEB_PUSH", "MOBILE_PUSH"],
      actionUrl: "/escalations/demo-escalation-1", status: "Pending", isRead: false,
    },
  });

  console.log("- Seeded Care Plans, Goals, MCA, DoLS, SBAR Escalations, Risks, Incidents, and Notifications");
}
