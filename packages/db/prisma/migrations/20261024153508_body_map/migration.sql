-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "bodyMapSequence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BodyMapAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMapAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMapFinding" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "residentId" TEXT,
    "trackingId" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "bodyMapVariant" TEXT NOT NULL DEFAULT 'neutral',
    "anatomyId" TEXT NOT NULL DEFAULT 'unspecified',
    "anatomicalRegion" TEXT NOT NULL DEFAULT 'general',
    "bodyPart" TEXT NOT NULL DEFAULT 'general',
    "subPart" TEXT,
    "detail" TEXT,
    "laterality" TEXT,
    "locationLabel" TEXT NOT NULL DEFAULT 'General',
    "exactX" DOUBLE PRECISION,
    "exactY" DOUBLE PRECISION,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "onsetDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "linkedIncidentId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMapFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMapPhoto" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "gcsPath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMapPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMapAssessment_tenantId_idx" ON "BodyMapAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "BodyMapAssessment_residentId_idx" ON "BodyMapAssessment"("residentId");

-- CreateIndex
CREATE INDEX "BodyMapFinding_residentId_idx" ON "BodyMapFinding"("residentId");

-- CreateIndex
CREATE INDEX "BodyMapFinding_assessmentId_idx" ON "BodyMapFinding"("assessmentId");

-- CreateIndex
CREATE INDEX "BodyMapFinding_linkedIncidentId_idx" ON "BodyMapFinding"("linkedIncidentId");

-- CreateIndex
CREATE INDEX "BodyMapFinding_anatomyId_idx" ON "BodyMapFinding"("anatomyId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyMapFinding_residentId_trackingId_key" ON "BodyMapFinding"("residentId", "trackingId");

-- CreateIndex
CREATE INDEX "BodyMapPhoto_findingId_idx" ON "BodyMapPhoto"("findingId");

-- AddForeignKey
ALTER TABLE "BodyMapAssessment" ADD CONSTRAINT "BodyMapAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMapAssessment" ADD CONSTRAINT "BodyMapAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMapFinding" ADD CONSTRAINT "BodyMapFinding_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMapFinding" ADD CONSTRAINT "BodyMapFinding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "BodyMapAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMapPhoto" ADD CONSTRAINT "BodyMapPhoto_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "BodyMapFinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
