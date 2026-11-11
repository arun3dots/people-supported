-- CreateTable
CREATE TABLE "ResidentAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "preAdmissionId" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "tools" JSONB,
    "needs" JSONB,
    "dols" JSONB,
    "assessedAt" TIMESTAMP(3),
    "assessedById" TEXT,
    "assessedByName" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "ResidentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentNeedCarePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "areaKey" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "supportLevel" TEXT,
    "risk" JSONB,
    "content" JSONB,
    "agreement" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "reviewDate" TIMESTAMP(3),
    "agreedAt" TIMESTAMP(3),
    "agreedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "ResidentNeedCarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentCareTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "stepIndex" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "shift" TEXT NOT NULL DEFAULT 'Day',
    "time" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Carer',
    "recurrence" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsOn" DATE,
    "endsOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "ResidentCareTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentCareTaskRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "outcome" TEXT NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "undoneAt" TIMESTAMP(3),
    "undoneById" TEXT,

    CONSTRAINT "ResidentCareTaskRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentShiftNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shift" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResidentShiftNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResidentAssessment_tenantId_idx" ON "ResidentAssessment"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentAssessment_residentId_isCurrent_idx" ON "ResidentAssessment"("residentId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentAssessment_residentId_versionNumber_key" ON "ResidentAssessment"("residentId", "versionNumber");

-- CreateIndex
CREATE INDEX "ResidentNeedCarePlan_tenantId_idx" ON "ResidentNeedCarePlan"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentNeedCarePlan_residentId_isCurrent_idx" ON "ResidentNeedCarePlan"("residentId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentNeedCarePlan_residentId_areaKey_versionNumber_key" ON "ResidentNeedCarePlan"("residentId", "areaKey", "versionNumber");

-- CreateIndex
CREATE INDEX "ResidentCareTask_tenantId_idx" ON "ResidentCareTask"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentCareTask_residentId_isActive_idx" ON "ResidentCareTask"("residentId", "isActive");

-- CreateIndex
CREATE INDEX "ResidentCareTask_carePlanId_idx" ON "ResidentCareTask"("carePlanId");

-- CreateIndex
CREATE INDEX "ResidentCareTaskRecord_tenantId_idx" ON "ResidentCareTaskRecord"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentCareTaskRecord_residentId_date_idx" ON "ResidentCareTaskRecord"("residentId", "date");

-- CreateIndex
CREATE INDEX "ResidentCareTaskRecord_taskId_date_idx" ON "ResidentCareTaskRecord"("taskId", "date");

-- CreateIndex
CREATE INDEX "ResidentShiftNote_tenantId_idx" ON "ResidentShiftNote"("tenantId");

-- CreateIndex
CREATE INDEX "ResidentShiftNote_residentId_date_idx" ON "ResidentShiftNote"("residentId", "date");

-- AddForeignKey
ALTER TABLE "ResidentAssessment" ADD CONSTRAINT "ResidentAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentAssessment" ADD CONSTRAINT "ResidentAssessment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentAssessment" ADD CONSTRAINT "ResidentAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentNeedCarePlan" ADD CONSTRAINT "ResidentNeedCarePlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentNeedCarePlan" ADD CONSTRAINT "ResidentNeedCarePlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentNeedCarePlan" ADD CONSTRAINT "ResidentNeedCarePlan_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentNeedCarePlan" ADD CONSTRAINT "ResidentNeedCarePlan_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ResidentAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTask" ADD CONSTRAINT "ResidentCareTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTask" ADD CONSTRAINT "ResidentCareTask_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTask" ADD CONSTRAINT "ResidentCareTask_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTask" ADD CONSTRAINT "ResidentCareTask_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "ResidentNeedCarePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTaskRecord" ADD CONSTRAINT "ResidentCareTaskRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTaskRecord" ADD CONSTRAINT "ResidentCareTaskRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCareTaskRecord" ADD CONSTRAINT "ResidentCareTaskRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ResidentCareTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentShiftNote" ADD CONSTRAINT "ResidentShiftNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentShiftNote" ADD CONSTRAINT "ResidentShiftNote_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Partial unique indexes (not expressible in Prisma).
CREATE UNIQUE INDEX "ResidentAssessment_one_current_per_resident"
    ON "ResidentAssessment"("residentId") WHERE "isCurrent" = true;

CREATE UNIQUE INDEX "ResidentAssessment_one_draft_per_resident"
    ON "ResidentAssessment"("residentId") WHERE "status" = 'Draft';

CREATE UNIQUE INDEX "ResidentNeedCarePlan_one_current_per_area"
    ON "ResidentNeedCarePlan"("residentId", "areaKey") WHERE "isCurrent" = true;

-- A task can have one live (not undone) record per day.
CREATE UNIQUE INDEX "ResidentCareTaskRecord_one_live_per_task_day"
    ON "ResidentCareTaskRecord"("taskId", "date") WHERE "undoneAt" IS NULL;