-- AlterTable
ALTER TABLE "MedicationRound" ADD COLUMN     "prescriptionId" TEXT;

-- CreateTable
CREATE TABLE "MedicationPrescription" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "instructions" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "times" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allowLateAdministration" BOOLEAN NOT NULL DEFAULT false,
    "mandatoryObservations" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active',
    "stopReason" TEXT,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "MedicationPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationPrescriptionPause" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "pauseFrom" TIMESTAMP(3) NOT NULL,
    "resumeOn" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "MedicationPrescriptionPause_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicationPrescription_supersedesId_key" ON "MedicationPrescription"("supersedesId");

-- CreateIndex
CREATE INDEX "MedicationPrescription_residentId_idx" ON "MedicationPrescription"("residentId");

-- CreateIndex
CREATE INDEX "MedicationPrescriptionPause_prescriptionId_idx" ON "MedicationPrescriptionPause"("prescriptionId");

-- CreateIndex
CREATE INDEX "MedicationRound_prescriptionId_idx" ON "MedicationRound"("prescriptionId");

-- AddForeignKey
ALTER TABLE "MedicationRound" ADD CONSTRAINT "MedicationRound_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "MedicationPrescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPrescription" ADD CONSTRAINT "MedicationPrescription_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "MedicationPrescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPrescription" ADD CONSTRAINT "MedicationPrescription_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationPrescriptionPause" ADD CONSTRAINT "MedicationPrescriptionPause_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "MedicationPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
