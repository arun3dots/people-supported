/*
  Warnings:

  - Added the required column `branchId` to the `CarePlanReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `DolsAuthorization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `MentalCapacityAssessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CarePlanGoal" ADD COLUMN     "whyItMattersToResident" TEXT;

-- AlterTable
ALTER TABLE "CarePlanReview" ADD COLUMN     "branchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CarePlanSection" ADD COLUMN     "sectionData" JSONB;

-- AlterTable
ALTER TABLE "DolsAuthorization" ADD COLUMN     "branchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MentalCapacityAssessment" ADD COLUMN     "branchId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ClinicalEscalation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "assignedToRole" TEXT NOT NULL DEFAULT 'Nurse',
    "assignedToId" TEXT,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "initialNotes" TEXT NOT NULL,
    "sbarSituation" TEXT,
    "sbarBackground" TEXT,
    "sbarAssessment" TEXT,
    "sbarRecommendation" TEXT,
    "actionsTaken" JSONB,
    "vitalsSnapshot" JSONB,
    "taskId" TEXT,
    "observationId" TEXT,
    "incidentId" TEXT,
    "managerNotes" TEXT,
    "managerSignedAt" TIMESTAMP(3),
    "managerSignedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalEscalation_tenantId_idx" ON "ClinicalEscalation"("tenantId");

-- CreateIndex
CREATE INDEX "ClinicalEscalation_branchId_idx" ON "ClinicalEscalation"("branchId");

-- CreateIndex
CREATE INDEX "ClinicalEscalation_residentId_idx" ON "ClinicalEscalation"("residentId");

-- CreateIndex
CREATE INDEX "ClinicalEscalation_status_idx" ON "ClinicalEscalation"("status");

-- CreateIndex
CREATE INDEX "ClinicalEscalation_severity_idx" ON "ClinicalEscalation"("severity");

-- CreateIndex
CREATE INDEX "ClinicalEscalation_createdAt_idx" ON "ClinicalEscalation"("createdAt");

-- CreateIndex
CREATE INDEX "CarePlanReview_branchId_idx" ON "CarePlanReview"("branchId");

-- CreateIndex
CREATE INDEX "CarePlanSection_carePlanId_idx" ON "CarePlanSection"("carePlanId");

-- CreateIndex
CREATE INDEX "CarePlanSection_sectionName_idx" ON "CarePlanSection"("sectionName");

-- CreateIndex
CREATE INDEX "DolsAuthorization_branchId_idx" ON "DolsAuthorization"("branchId");

-- CreateIndex
CREATE INDEX "MentalCapacityAssessment_branchId_idx" ON "MentalCapacityAssessment"("branchId");

-- AddForeignKey
ALTER TABLE "CarePlanReview" ADD CONSTRAINT "CarePlanReview_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalCapacityAssessment" ADD CONSTRAINT "MentalCapacityAssessment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DolsAuthorization" ADD CONSTRAINT "DolsAuthorization_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "DailyTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEscalation" ADD CONSTRAINT "ClinicalEscalation_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
