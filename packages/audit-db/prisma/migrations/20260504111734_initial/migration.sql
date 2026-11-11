-- CreateTable
CREATE TABLE "cqc_audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userFullName" TEXT,
    "userRoleName" TEXT,
    "categoryType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "recordHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cqc_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_integrity_blocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "blockNumber" INTEGER NOT NULL,
    "startRecordId" TEXT NOT NULL,
    "endRecordId" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "cumulativeHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_integrity_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cqc_audit_logs_tenantId_timestamp_idx" ON "cqc_audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "cqc_audit_logs_categoryType_timestamp_idx" ON "cqc_audit_logs"("categoryType", "timestamp");

-- CreateIndex
CREATE INDEX "cqc_audit_logs_entityId_timestamp_idx" ON "cqc_audit_logs"("entityId", "timestamp");

-- CreateIndex
CREATE INDEX "cqc_audit_logs_userId_timestamp_idx" ON "cqc_audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_integrity_blocks_tenantId_blockNumber_idx" ON "audit_integrity_blocks"("tenantId", "blockNumber");
