-- CreateTable
CREATE TABLE "BodyMapFindingAction" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMapFindingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyMapFindingAction_findingId_idx" ON "BodyMapFindingAction"("findingId");

-- CreateIndex
CREATE INDEX "BodyMapFindingAction_createdById_idx" ON "BodyMapFindingAction"("createdById");

-- AddForeignKey
ALTER TABLE "BodyMapFindingAction" ADD CONSTRAINT "BodyMapFindingAction_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "BodyMapFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
