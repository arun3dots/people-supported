-- AlterTable
ALTER TABLE "BodyMapFinding" ADD COLUMN     "depthMm" DOUBLE PRECISION,
ADD COLUMN     "dressingApplied" TEXT,
ADD COLUMN     "exudateLevel" TEXT,
ADD COLUMN     "lengthMm" DOUBLE PRECISION,
ADD COLUMN     "nextDressingDueAt" TIMESTAMP(3),
ADD COLUMN     "pressureUlcerCategory" TEXT,
ADD COLUMN     "tissueType" TEXT,
ADD COLUMN     "widthMm" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MedAdministration" ADD COLUMN     "correctedAt" TIMESTAMP(3),
ADD COLUMN     "correctedById" TEXT,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supersededById" TEXT;

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "correctedAt" TIMESTAMP(3),
ADD COLUMN     "correctedById" TEXT,
ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supersededById" TEXT;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "recordState" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "recordStateReason" TEXT,
ADD COLUMN     "recordStateUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "recordStateUpdatedById" TEXT;

-- CreateTable
CREATE TABLE "ResidentConsentItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "lawfulBasis" TEXT NOT NULL DEFAULT 'Art6_1_c_LegalObligation',
    "specialCategoryBasis" TEXT NOT NULL DEFAULT 'Art9_2_h_HealthAndSocialCare',
    "capacityStatus" TEXT NOT NULL DEFAULT 'HasCapacity',
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "signedByName" TEXT NOT NULL,
    "signedByRelationship" TEXT NOT NULL DEFAULT 'Self',
    "evidenceUrl" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "withdrawnById" TEXT,
    "reviewDueAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResidentConsentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantRetentionPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adultCareRecordsYears" INTEGER NOT NULL DEFAULT 8,
    "staffHrRecordsYears" INTEGER NOT NULL DEFAULT 6,
    "financialRecordsYears" INTEGER NOT NULL DEFAULT 7,
    "incidentSafeguardingYrs" INTEGER NOT NULL DEFAULT 10,
    "dsarComplaintsYears" INTEGER NOT NULL DEFAULT 6,
    "autoPurgeExpiredTokens" BOOLEAN NOT NULL DEFAULT true,
    "lastRetentionRunAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlledDrugRegister" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "residentId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "drugName" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "quantityIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runningBalance" DOUBLE PRECISION NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "witnessById" TEXT NOT NULL,
    "witnessByName" TEXT NOT NULL,
    "witnessSignature" TEXT,
    "disposalMethod" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlledDrugRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationStockLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "residentId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "drugName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "transactionType" TEXT NOT NULL,
    "quantityDelta" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "recordedById" TEXT NOT NULL,
    "witnessById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationStockLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingReferral" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "residentId" TEXT,
    "linkedIncidentId" TEXT,
    "referralNumber" TEXT NOT NULL,
    "abuseCategory" TEXT NOT NULL,
    "allegationSummary" TEXT NOT NULL,
    "immediateProtectionPlan" TEXT NOT NULL,
    "localAuthorityName" TEXT NOT NULL,
    "section42Referred" BOOLEAN NOT NULL DEFAULT false,
    "section42ReferredAt" TIMESTAMP(3),
    "section42ReferenceNo" TEXT,
    "cqcNotified" BOOLEAN NOT NULL DEFAULT false,
    "cqcNotifiedAt" TIMESTAMP(3),
    "cqcReferenceNo" TEXT,
    "policeNotified" BOOLEAN NOT NULL DEFAULT false,
    "policeCrimeReference" TEXT,
    "familyInformed" BOOLEAN NOT NULL DEFAULT false,
    "familyInformedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "investigationOutcome" TEXT,
    "lessonsLearned" TEXT,
    "raisedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeguardingReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "residentId" TEXT,
    "complaintNumber" TEXT NOT NULL,
    "complaintType" TEXT NOT NULL DEFAULT 'CareService',
    "complainantName" TEXT NOT NULL,
    "complainantRelationship" TEXT,
    "complainantContact" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Received',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgeDueAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "responseDueAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "investigationFindings" TEXT,
    "resolutionOutcome" TEXT,
    "lessonsLearned" TEXT,
    "escalatedToExternals" BOOLEAN NOT NULL DEFAULT false,
    "externalEscalationBody" TEXT,
    "externalReferenceNo" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentConsentItem_tenantId_idx" ON "ResidentConsentItem"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentConsentItem_residentId_idx" ON "ResidentConsentItem"("residentId");

-- CreateIndex
CREATE INDEX "ResidentConsentItem_purpose_idx" ON "ResidentConsentItem"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRetentionPolicy_tenantId_key" ON "TenantRetentionPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "ControlledDrugRegister_tenantId_idx" ON "ControlledDrugRegister"("tenantId");

-- CreateIndex
CREATE INDEX "ControlledDrugRegister_residentId_idx" ON "ControlledDrugRegister"("residentId");

-- CreateIndex
CREATE INDEX "ControlledDrugRegister_drugName_idx" ON "ControlledDrugRegister"("drugName");

-- CreateIndex
CREATE INDEX "ControlledDrugRegister_occurredAt_idx" ON "ControlledDrugRegister"("occurredAt");

-- CreateIndex
CREATE INDEX "MedicationStockLedger_tenantId_idx" ON "MedicationStockLedger"("tenantId");

-- CreateIndex
CREATE INDEX "MedicationStockLedger_residentId_idx" ON "MedicationStockLedger"("residentId");

-- CreateIndex
CREATE INDEX "MedicationStockLedger_prescriptionId_idx" ON "MedicationStockLedger"("prescriptionId");

-- CreateIndex
CREATE INDEX "SafeguardingReferral_tenantId_idx" ON "SafeguardingReferral"("tenantId");

-- CreateIndex
CREATE INDEX "SafeguardingReferral_residentId_idx" ON "SafeguardingReferral"("residentId");

-- CreateIndex
CREATE INDEX "SafeguardingReferral_status_idx" ON "SafeguardingReferral"("status");

-- CreateIndex
CREATE INDEX "Complaint_tenantId_idx" ON "Complaint"("tenantId");

-- CreateIndex
CREATE INDEX "Complaint_residentId_idx" ON "Complaint"("residentId");

-- CreateIndex
CREATE INDEX "Complaint_complaintType_idx" ON "Complaint"("complaintType");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- AddForeignKey
ALTER TABLE "ResidentConsentItem" ADD CONSTRAINT "ResidentConsentItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentConsentItem" ADD CONSTRAINT "ResidentConsentItem_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRetentionPolicy" ADD CONSTRAINT "TenantRetentionPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledDrugRegister" ADD CONSTRAINT "ControlledDrugRegister_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledDrugRegister" ADD CONSTRAINT "ControlledDrugRegister_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStockLedger" ADD CONSTRAINT "MedicationStockLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStockLedger" ADD CONSTRAINT "MedicationStockLedger_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingReferral" ADD CONSTRAINT "SafeguardingReferral_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingReferral" ADD CONSTRAINT "SafeguardingReferral_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
