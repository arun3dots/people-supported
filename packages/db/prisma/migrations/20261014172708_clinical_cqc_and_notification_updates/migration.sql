-- AlterTable
ALTER TABLE "DailyTask" ADD COLUMN     "dueAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FoodFluidLog" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "intakePercentage" INTEGER,
ADD COLUMN     "mealSlot" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "apologyDate" TIMESTAMP(3),
ADD COLUMN     "apologyMethod" TEXT,
ADD COLUMN     "cqcNotificationRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cqcNotificationSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "cqcReferenceNumber" TEXT,
ADD COLUMN     "dutyOfCandourApplicable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dutyOfCandourStatus" TEXT,
ADD COLUMN     "writtenNoticeDueAt" TIMESTAMP(3),
ADD COLUMN     "writtenNoticeSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MedAdministration" ADD COLUMN     "witnessId" TEXT,
ADD COLUMN     "witnessName" TEXT,
ADD COLUMN     "witnessRole" TEXT,
ADD COLUMN     "witnessSignature" TEXT;

-- CreateTable
CREATE TABLE "UserDeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceName" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceToken_token_key" ON "UserDeviceToken"("token");

-- CreateIndex
CREATE INDEX "UserDeviceToken_userId_idx" ON "UserDeviceToken"("userId");

-- CreateIndex
CREATE INDEX "UserDeviceToken_tenantId_idx" ON "UserDeviceToken"("tenantId");

-- CreateIndex
CREATE INDEX "DailyTask_dueAt_idx" ON "DailyTask"("dueAt");

-- CreateIndex
CREATE INDEX "FoodFluidLog_residentId_idx" ON "FoodFluidLog"("residentId");

-- CreateIndex
CREATE INDEX "FoodFluidLog_tenantId_idx" ON "FoodFluidLog"("tenantId");

-- CreateIndex
CREATE INDEX "FoodFluidLog_timestamp_idx" ON "FoodFluidLog"("timestamp");

-- AddForeignKey
ALTER TABLE "UserDeviceToken" ADD CONSTRAINT "UserDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
