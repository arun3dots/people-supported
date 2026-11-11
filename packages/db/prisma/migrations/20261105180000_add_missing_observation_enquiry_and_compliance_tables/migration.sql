-- Align the database with schema.prisma: columns and tables that were only
-- ever applied with `prisma db push` and never captured in a migration.

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "contactPreference" TEXT NOT NULL DEFAULT 'Email',
ADD COLUMN     "optOutAt" TIMESTAMP(3),
ADD COLUMN     "optOutReason" TEXT;

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "isLateEntry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occurredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BreakGlassAccess" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreakGlassAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "contactNumber" TEXT,
    "visitingRestrictions" TEXT,
    "signInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeepRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "evacuationMobility" TEXT NOT NULL,
    "daytimeLocation" TEXT,
    "nighttimeLocation" TEXT,
    "staffAssistanceCount" INTEGER NOT NULL DEFAULT 1,
    "equipmentNeeded" TEXT,
    "hearingImpairment" BOOLEAN NOT NULL DEFAULT false,
    "visualImpairment" BOOLEAN NOT NULL DEFAULT false,
    "cognitiveImpairment" BOOLEAN NOT NULL DEFAULT false,
    "specificInstructions" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT NOT NULL,
    "nextReviewDue" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeepRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentMaintenanceLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "serialNumber" TEXT,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lastCheckedDate" TIMESTAMP(3) NOT NULL,
    "nextServiceDue" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pass',
    "servicedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentMaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSupervision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "supervisionDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "actionAgreed" TEXT,
    "nextSessionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSupervision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAppraisal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "appraiserId" TEXT NOT NULL,
    "appraisalPeriod" TEXT NOT NULL,
    "appraisalDate" TIMESTAMP(3) NOT NULL,
    "objectives" TEXT NOT NULL,
    "trainingNeeds" TEXT,
    "overallRating" TEXT,
    "nextAppraisalDue" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "auditType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "auditorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "scorePercentage" DOUBLE PRECISION,
    "findingsSummary" TEXT,
    "actionPlan" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CqcNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT,
    "noticeType" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "cqcNotifiedAt" TIMESTAMP(3),
    "cqcReferenceNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "submittedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CqcNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BreakGlassAccess_tenantId_residentId_idx" ON "BreakGlassAccess"("tenantId", "residentId");

-- CreateIndex
CREATE INDEX "BreakGlassAccess_userId_idx" ON "BreakGlassAccess"("userId");

-- CreateIndex
CREATE INDEX "BreakGlassAccess_createdAt_idx" ON "BreakGlassAccess"("createdAt");

-- CreateIndex
CREATE INDEX "VisitorLog_tenantId_residentId_idx" ON "VisitorLog"("tenantId", "residentId");

-- CreateIndex
CREATE INDEX "VisitorLog_signInTime_idx" ON "VisitorLog"("signInTime");

-- CreateIndex
CREATE UNIQUE INDEX "PeepRecord_residentId_key" ON "PeepRecord"("residentId");

-- CreateIndex
CREATE INDEX "PeepRecord_tenantId_idx" ON "PeepRecord"("tenantId");

-- CreateIndex
CREATE INDEX "EquipmentMaintenanceLog_tenantId_idx" ON "EquipmentMaintenanceLog"("tenantId");

-- CreateIndex
CREATE INDEX "EquipmentMaintenanceLog_nextServiceDue_idx" ON "EquipmentMaintenanceLog"("nextServiceDue");

-- CreateIndex
CREATE INDEX "StaffSupervision_tenantId_staffId_idx" ON "StaffSupervision"("tenantId", "staffId");

-- CreateIndex
CREATE INDEX "StaffSupervision_supervisorId_idx" ON "StaffSupervision"("supervisorId");

-- CreateIndex
CREATE INDEX "StaffAppraisal_tenantId_staffId_idx" ON "StaffAppraisal"("tenantId", "staffId");

-- CreateIndex
CREATE INDEX "AuditSchedule_tenantId_idx" ON "AuditSchedule"("tenantId");

-- CreateIndex
CREATE INDEX "AuditSchedule_scheduledDate_idx" ON "AuditSchedule"("scheduledDate");

-- CreateIndex
CREATE INDEX "CqcNotification_tenantId_idx" ON "CqcNotification"("tenantId");

-- CreateIndex
CREATE INDEX "CqcNotification_noticeType_idx" ON "CqcNotification"("noticeType");

-- AddForeignKey
ALTER TABLE "BreakGlassAccess" ADD CONSTRAINT "BreakGlassAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakGlassAccess" ADD CONSTRAINT "BreakGlassAccess_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakGlassAccess" ADD CONSTRAINT "BreakGlassAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorLog" ADD CONSTRAINT "VisitorLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeepRecord" ADD CONSTRAINT "PeepRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeepRecord" ADD CONSTRAINT "PeepRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMaintenanceLog" ADD CONSTRAINT "EquipmentMaintenanceLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSupervision" ADD CONSTRAINT "StaffSupervision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSupervision" ADD CONSTRAINT "StaffSupervision_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSupervision" ADD CONSTRAINT "StaffSupervision_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAppraisal" ADD CONSTRAINT "StaffAppraisal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAppraisal" ADD CONSTRAINT "StaffAppraisal_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAppraisal" ADD CONSTRAINT "StaffAppraisal_appraiserId_fkey" FOREIGN KEY ("appraiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditSchedule" ADD CONSTRAINT "AuditSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CqcNotification" ADD CONSTRAINT "CqcNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CqcNotification" ADD CONSTRAINT "CqcNotification_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

